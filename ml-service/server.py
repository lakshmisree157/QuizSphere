# server.py - Clean version using BloomPredictor
from fastapi import FastAPI, Request, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
import logging
import json
import requests
import fitz
import base64
from collections import defaultdict
from nltk.tokenize import sent_tokenize
from dotenv import load_dotenv
import os

# Import your BloomPredictor
from bloom_predictor import predict_bloom_level_for_paragraph

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ml-service.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
CLIENT_URL = os.getenv("CLIENT_URL", "http://localhost:3000")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in environment variables")

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[CLIENT_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class PDFContent(BaseModel):
    content: str
    selectedSubtopic: str | None = None

    @validator('content')
    def validate_base64(cls, v):
        try:
            base64.b64decode(v)
            return v
        except Exception:
            raise ValueError('Invalid base64 encoded content')

# Bloom's Taxonomy Configuration for Question Generation
BLOOM_TAXONOMY = {
    1: {
        "name": "Remember",
        "description": "Recall facts, basic concepts, and answers",
        "question_instruction": """
Generate questions that test recall of facts, terminology, or basic concepts.
Focus on: definitions, facts, lists, basic identification.
Question types: Multiple Choice, True/False, Fill in the Blanks.
Use verbs like: define, identify, list, name, recall, recognize, state.
"""
    },
    2: {
        "name": "Understand", 
        "description": "Explain ideas or concepts",
        "question_instruction": """
Generate questions that test comprehension and interpretation.
Focus on: explanations, descriptions, summaries, comparisons.
Question types: Multiple Choice, Short Answer,Fill in the Blanks.
Use verbs like: describe, explain, interpret, summarize, classify, compare.
"""
    },
    3: {
        "name": "Apply",
        "description": "Use information in new situations",
        "question_instruction": """
Generate questions that require applying knowledge to new situations.
Focus on: problem-solving, demonstrations, implementations.
Question types: Scenario-based MCQ, Problem-solving questions.
Use verbs like: apply, demonstrate, illustrate, solve, use, implement.
"""
    },
    4: {
        "name": "Analyze",
        "description": "Draw connections among ideas",
        "question_instruction": """
Generate questions that examine relationships and break down information.
Focus on: comparisons, relationships, patterns, structure analysis.
Question types: MCQ with reasoning, Analysis questions.
Use verbs like: analyze, differentiate, organize, relate, compare, contrast.
"""
    },
    5: {
        "name": "Evaluate",
        "description": "Justify a stand or decision",
        "question_instruction": """
Generate questions that require making judgments based on criteria.
Focus on: critiques, evaluations, justifications, arguments.
Question types: Long Answer, Evaluative MCQ.
Use verbs like: assess, critique, evaluate, judge, justify, defend.
"""
    },
    6: {
        "name": "Create",
        "description": "Produce new or original work",
        "question_instruction": """
Generate questions that involve creating new ideas or solutions.
Focus on: designing, developing, constructing, formulating new approaches.
Question types: Project-based, Creative tasks, Synthesis questions.
Use verbs like: create, design, develop, formulate, construct, produce.
"""
    }
}

def extract_pdf_content(pdf_bytes):
    """Extract structured content from PDF bytes."""
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        structured = defaultdict(lambda: defaultdict(str))
        current_main = ""
        current_sub = ""

        for page in doc:
            blocks = page.get_text("dict")["blocks"]
            for b in blocks:
                for line in b.get("lines", []):
                    for span in line.get("spans", []):
                        text = span["text"].strip()
                        size = round(span["size"])
                        if not text:
                            continue
                        if size >= 16:  # Main topic
                            current_main = text
                            structured[current_main] = defaultdict(str)
                        elif size >= 14:  # Subtopic
                            current_sub = text
                        elif current_main and current_sub:  # Content
                            structured[current_main][current_sub] += " " + text
        
        return structured
    except Exception as e:
        raise ValueError(f"Failed to process PDF: {str(e)}")
    finally:
        if 'doc' in locals():
            doc.close()

def generate_questions_with_groq(content, bloom_level, max_questions=5):
    """Generate questions using GROQ API based on Bloom's level."""
    
    bloom_config = BLOOM_TAXONOMY.get(bloom_level, BLOOM_TAXONOMY[2])
    
    prompt = f"""
Generate {max_questions} educational questions based on the following content.

Content: {content[:2500]}

Bloom's Taxonomy Level: {bloom_level} ({bloom_config['name']})
{bloom_config['question_instruction']}

Return ONLY a valid JSON array with this exact format:
[
  {{
    "type": "MCQ",
    "question": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A"
  }},
  {{
    "type": "TRUE_FALSE",
    "question": "Statement to evaluate?",
    "answer": "True"
  }},
  {{
    "type": "SHORT_ANSWER",
    "question": "Question requiring explanation?",
    "answer": "Expected answer or key points"
  }}
  {{
    "type": "DESCRIPTIVE",
    "question": "In-depth question requiring detailed response?",
    "answer": "Detailed explanation or analysis"
  }},
  {{
    "type": "YES_NO",
    "question": "Yes/No question?",
    "answer": "Yes"
  }}
]

Important: 
- Generate questions appropriate for Bloom's level {bloom_level}
- Ensure answers are accurate based on the content
- Use varied question types suitable for this cognitive level
"""

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 1200
    }

    try:
        logger.info(f"Generating questions for Bloom level {bloom_level}")
        response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()
        
        questions_text = result['choices'][0]['message']['content'].strip()
        logger.info(f"Raw response: {questions_text[:200]}...")
        
        # Extract JSON from response
        json_start = questions_text.find('[')
        json_end = questions_text.rfind(']') + 1
        
        if json_start != -1 and json_end > json_start:
            questions_json = questions_text[json_start:json_end]
            questions = json.loads(questions_json)
            
            # Validate and normalize questions
            valid_questions = []
            for q in questions:
                if isinstance(q, dict) and 'question' in q and 'answer' in q and 'type' in q:
                    q_type = q['type'].upper()
                    if q_type in ['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'DESCRIPTIVE', 'YES_NO']:
                        if q_type == 'YES_NO':
                            q['type'] = 'TRUE_FALSE'
                            q['answer'] = 'True' if q['answer'].lower() in ['yes', 'y', 'true'] else 'False'
                        valid_questions.append(q)
            
            logger.info(f"Generated {len(valid_questions)} valid questions")
            return valid_questions
        else:
            raise ValueError("No valid JSON array found in response")
            
    except Exception as e:
        logger.error(f"Error generating questions: {str(e)}")
        raise

def chunk_content(content, max_length=2000):
    """Split content into manageable chunks."""
    sentences = sent_tokenize(content)
    chunks = []
    current_chunk = []
    current_length = 0

    for sentence in sentences:
        if current_length + len(sentence) > max_length and current_chunk:
            chunks.append(" ".join(current_chunk))
            current_chunk = []
            current_length = 0
        current_chunk.append(sentence)
        current_length += len(sentence)

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks

def convert_numpy_types(data):
    """Convert numpy types to native Python types."""
    import numpy as np
    if isinstance(data, np.integer):
        return int(data)
    elif isinstance(data, np.floating):
        return float(data)
    elif isinstance(data, np.ndarray):
        return data.tolist()
    elif isinstance(data, dict):
        return {key: convert_numpy_types(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_numpy_types(item) for item in data]
    return data

# API Endpoints
@app.post("/api/questions/generate")
async def generate_questions(data: PDFContent):
    logger.info("Starting question generation from PDF content")
    try:
        pdf_content = base64.b64decode(data.content)
        structured_data = extract_pdf_content(pdf_content)

        if not structured_data:
            raise HTTPException(status_code=400, detail="No content extracted from PDF")

        all_questions = []
        topic_breakdown = {}

        for main_topic, subtopics in structured_data.items():
            logger.info(f"Processing main topic: {main_topic}")
            topic_questions = []

            for subtopic, content in subtopics.items():
                if len(content.strip()) < 100:
                    logger.warning(f"Skipping short content in {main_topic}/{subtopic}")
                    continue

                logger.info(f"Processing subtopic: {subtopic}")
                
                # Use your BloomPredictor to determine the level
                try:
                    bloom_level = predict_bloom_level_for_paragraph(content)
                    logger.info(f"Predicted Bloom level {bloom_level} for {subtopic}")
                except Exception as e:
                    logger.error(f"Error predicting Bloom level: {e}, using default level 2")
                    bloom_level = 2
                
                # Chunk content if too long
                chunks = chunk_content(content)

                for chunk in chunks:
                    try:
                        questions = generate_questions_with_groq(chunk, bloom_level)
                        
                        for q in questions:
                            formatted_question = {
                                "content": q["question"],
                                "type": q["type"],
                                "bloomLevel": bloom_level,
                                "bloomName": BLOOM_TAXONOMY[bloom_level]["name"],
                                "mainTopic": main_topic,
                                "subtopic": subtopic,
                                "options": q.get("options", []),
                                "correctAnswer": q["answer"]
                            }
                            
                            topic_questions.append(formatted_question)
                            logger.info(f"Added {q['type']} question for level {bloom_level}")
                            
                    except Exception as e:
                        logger.error(f"Error processing chunk: {str(e)}")
                        continue

            all_questions.extend(topic_questions)
            topic_breakdown[main_topic] = len(topic_questions)
            logger.info(f"Generated {len(topic_questions)} questions for {main_topic}")

        if not all_questions:
            raise HTTPException(status_code=500, detail="No questions generated")

        response_data = {
            "questions": all_questions,
            "totalQuestions": len(all_questions),
            "topicBreakdown": topic_breakdown
        }

        return convert_numpy_types(response_data)

    except Exception as e:
        logger.error(f"Error generating questions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/pdf/upload")
async def upload_pdf(file: UploadFile):
    logger.info(f"Received PDF upload: {file.filename}")
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
        
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file received")

    try:
        structured_data = extract_pdf_content(content)
        
        if not structured_data:
            raise HTTPException(status_code=400, detail="Could not extract content from PDF")

        all_questions = []
        topic_breakdown = {}
        
        for main_topic, subtopics in structured_data.items():
            logger.info(f"Processing main topic: {main_topic}")
            topic_questions = []            
            
            for subtopic, content_text in subtopics.items():
                if len(content_text.strip()) < 100:
                    continue
                
                # Use your BloomPredictor
                try:
                    bloom_level = predict_bloom_level_for_paragraph(content_text)
                    logger.info(f"Predicted Bloom level {bloom_level} for {subtopic}")
                except Exception as e:
                    logger.error(f"Error predicting Bloom level: {e}")
                    bloom_level = 2
                
                try:
                    questions = generate_questions_with_groq(content_text, bloom_level)
                    
                    for q in questions:
                        formatted_question = {
                            "content": q["question"],
                            "type": q["type"],
                            "bloomLevel": bloom_level,
                            "bloomName": BLOOM_TAXONOMY[bloom_level]["name"],
                            "mainTopic": main_topic,
                            "subtopic": subtopic,
                            "options": q.get("options", []),
                            "correctAnswer": q["answer"]
                        }
                        
                        topic_questions.append(formatted_question)
                        
                except Exception as e:
                    logger.error(f"Failed to process section {main_topic}/{subtopic}: {str(e)}")
                    continue
            
            all_questions.extend(topic_questions)
            topic_breakdown[main_topic] = len(topic_questions)

        if not all_questions:
            raise HTTPException(status_code=500, detail="Failed to generate any questions")

        response_data = {
            "questions": all_questions,
            "totalQuestions": len(all_questions),
            "topicBreakdown": topic_breakdown
        }

        return convert_numpy_types(response_data)

    except Exception as e:
        logger.error(f"Error processing PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.get("/health")
async def health_check():
    return {
        "status": "ok", 
        "bloom_levels": list(BLOOM_TAXONOMY.keys()),
        "model_loaded": True
    }

@app.on_event("startup")
async def startup_event():
    # Test GROQ API connection
    try:
        response = requests.post(
            GROQ_API_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": "Test"}],
                "max_tokens": 1
            },
            timeout=10
        )
        response.raise_for_status()
        logger.info("GROQ API connection successful")
    except Exception as e:
        logger.warning(f"GROQ API test failed: {e}")

    # Test BloomPredictor
    try:
        test_result = predict_bloom_level_for_paragraph("Define artificial intelligence.")
        logger.info(f"BloomPredictor test successful, result: {test_result}")
    except Exception as e:
        logger.error(f"BloomPredictor test failed: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)