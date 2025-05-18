# server.py
from fastapi import FastAPI, Request, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
import logging

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
import spacy
from sentence_transformers import SentenceTransformer
from collections import defaultdict
import numpy as np
from nltk.tokenize import sent_tokenize
from sklearn.cluster import KMeans
import json
import requests
import fitz
from nltk.corpus import wordnet as wn
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
from dotenv import load_dotenv
import os
import base64
from concurrent.futures import ThreadPoolExecutor

# Load environment variables at the start
load_dotenv()

# Get environment settings
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
CLIENT_URL = os.getenv("CLIENT_URL", "http://localhost:3000")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in environment variables")

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import spacy.cli
    nlp = spacy.load("en_core_web_sm")

model = SentenceTransformer('all-MiniLM-L6-v2')


contrast_words = ["however", "whereas", "although", "but", "yet", "in contrast"]
argumentative_patterns = ["should", "must", "it is important", "in my opinion"]

bloom_verb_lists = {
    1: ["define", "list", "recall", "identify", "name"],
    2: ["explain", "summarize", "describe", "classify"],
    3: ["apply", "demonstrate", "use"],
    4: ["analyze", "compare", "contrast"],
    5: ["evaluate", "assess", "justify"],
    6: ["create", "design", "formulate"]
}
bloom_levels = list(bloom_verb_lists.keys())
expanded_verb_to_bloom = defaultdict(set)

expanded_argument_verbs = set()
for verb in ["recommend", "suggest", "propose", "argue", "advocate", "assert"]:
    expanded_argument_verbs.update({lemma.name().replace("_", " ").lower() for syn in wn.synsets(verb, pos=wn.VERB) for lemma in syn.lemmas()})
    expanded_argument_verbs.add(verb)

def expand_bloom_verbs(bloom_verb_lists):
    for level, verbs in bloom_verb_lists.items():
        for verb in verbs:
            lemma = nlp(verb.lower())[0].lemma_
            expanded_verb_to_bloom[lemma].add(level)
            expanded_verb_to_bloom[verb.lower()].add(level)
            for syn in wn.synsets(verb.lower(), pos=wn.VERB):
                for l in syn.lemmas():
                    syn_verb = l.name().replace("_", " ").lower()
                    syn_lemma = nlp(syn_verb)[0].lemma_
                    expanded_verb_to_bloom[syn_lemma].add(level)
                    expanded_verb_to_bloom[syn_verb].add(level)

                    
expand_bloom_verbs(bloom_verb_lists)
class PDFContent(BaseModel):
    content: str
    # selectedTopic: str | None = None
    selectedSubtopic: str | None = None

    @validator('content')
    def validate_base64(cls, v):
        try:
            base64.b64decode(v)
            return v
        except Exception:
            raise ValueError('Invalid base64 encoded content')


def extract_structured_by_font(pdf_bytes):
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

def summarize_with_sumy(sentences, ratio=0.3):
    from nltk.corpus import stopwords
    text = " ".join(sentences)
    parser = PlaintextParser.from_string(text, Tokenizer("english"))
    summarizer = LsaSummarizer()
    summarizer.stop_words = set(stopwords.words("english"))
    n = max(1, int(len(sentences) * ratio))
    summary = summarizer(parser.document, n)
    return " ".join(str(sentence) for sentence in summary)

def estimate_k(num_sentences):
    if num_sentences <= 5:
        return 1
    elif num_sentences <= 10:
        return 2
    elif num_sentences <= 20:
        return 3
    else:
        return 4

def expand_bloom_verbs(bloom_verb_lists):
    for level, verbs in bloom_verb_lists.items():
        for verb in verbs:
            lemma = nlp(verb.lower())[0].lemma_
            expanded_verb_to_bloom[lemma].add(level)
            expanded_verb_to_bloom[verb.lower()].add(level)
            for syn in wn.synsets(verb.lower(), pos=wn.VERB):
                for l in syn.lemmas():
                    syn_verb = l.name().replace("_", " ").lower()
                    syn_lemma = nlp(syn_verb)[0].lemma_
                    expanded_verb_to_bloom[syn_lemma].add(level)
                    expanded_verb_to_bloom[syn_verb].add(level)

def preprocess_paragraph(paragraph_text):
    if not paragraph_text or paragraph_text.isspace():
        return ""
    sentences = sent_tokenize(paragraph_text)
    if not sentences:
        return ""

    embeddings = model.encode(sentences)
    k = estimate_k(len(sentences))
    kmeans = KMeans(n_clusters=k, random_state=42)
    labels = kmeans.fit_predict(embeddings)

    clusters = defaultdict(list)
    for label, sentence in zip(labels, sentences):
        clusters[label].append(sentence)

    final_sentences = []
    for cluster_id, sents in clusters.items():
        if len(sents) > 3:
            summarized = summarize_with_sumy(sents, ratio=0.3)
            final_sentences.append(summarized)
        else:
            final_sentences.extend(sents)

    return " ".join(final_sentences)

def extract_linguistic_counts(paragraph):
    doc = nlp(paragraph)
    clause_count = 0
    total_words = 0
    contrast_count = 0
    argument_count = 0

    for sent in doc.sents:
        total_words += len(sent)
        clause_count += len([t for t in sent if t.dep_ in ["ccomp", "xcomp", "advcl", "acl", "relcl"]]) + 1

        for token in sent:
            lemma = token.lemma_.lower()
            if lemma in expanded_argument_verbs:   # <--- corrected matching
                argument_count += 1

        if any(word in sent.text.lower() for word in contrast_words):
            contrast_count += 1
        if any(phrase in sent.text.lower() for phrase in argumentative_patterns):
            argument_count += 1

    return clause_count, total_words, contrast_count, argument_count

def get_bloom_levels(paragraph):
    doc = nlp(paragraph)
    level_counts = {level: 0 for level in bloom_levels}

    for token in doc:
        if token.pos_ == "VERB":
            lemma = token.lemma_.lower()
            if lemma in expanded_verb_to_bloom:
                for level in expanded_verb_to_bloom[lemma]:
                    level_counts[level] += 1

    return level_counts

def extract_feature_vector(paragraph):
    doc = nlp(paragraph)
    clause_count, word_count, contrast_count, argument_count = extract_linguistic_counts(paragraph)

    sentence_count = len(list(doc.sents))
    avg_sentence_length = word_count / max(1, sentence_count)
    bloom_counts = get_bloom_levels(paragraph)
    bloom_features = [bloom_counts.get(level, 0) / max(1, word_count) for level in bloom_levels]
    contrast_density = sum(1 for token in doc if token.text.lower() in contrast_words) / max(1, sentence_count)
    argument_markers = sum(1 for pattern in argumentative_patterns if pattern in paragraph.lower()) / max(1, sentence_count)

    return np.array([
        clause_count,
        word_count,
        sentence_count,
        avg_sentence_length,
        contrast_count,
        argument_count,
        contrast_density,
        argument_markers
    ] + bloom_features)

def determine_bloom_level(feature_vector):
    bloom_indices = feature_vector[8:]  # bloom features start after index 8
    max_index = np.argmax(bloom_indices)
    return max_index + 1  # Map to Bloom level 1-6

def basic_bt_mapping(text):
    feature_vector = extract_feature_vector(text)
    bloom_level = determine_bloom_level(feature_vector)
    return bloom_level

def extract_linguistic_features(text):
    """Extract linguistic features for Bloom's taxonomy classification."""
    feature_vector = extract_feature_vector(text)
    return {
        'clause_count': feature_vector[0],
        'word_count': feature_vector[1],
        'sentence_count': feature_vector[2],
        'avg_sentence_length': feature_vector[3],
        'contrast_count': feature_vector[4],
        'argument_count': feature_vector[5],
        'contrast_density': feature_vector[6],
        'argument_markers': feature_vector[7],
        'bloom_features': feature_vector[8:].tolist()
    }

def generate_questions_groq(content, bloom_level):
    logger.info(f"Generating questions for bloom level {bloom_level}")
    
    # Limit content length to avoid payload size issues
    max_content_length = 4000
    if len(content) > max_content_length:
        content = content[:max_content_length]
        logger.info(f"Content truncated to {max_content_length} characters")

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    prompt = {
        "model": "llama3-8b-8192",
        "messages": [{
            "role": "user",
            "content": f"""Generate questions based on this content and Bloom's level {bloom_level}.
            
Content: {content}

Instructions: Generate 3 multiple choice questions focusing on Bloom's level {bloom_level}.
Format the response as a JSON array ONLY with no additional text.
Example:
[
  {{
    "type": "MCQ",
    "question": "What is X?",
    "options": ["A) First", "B) Second", "C) Third", "D) Fourth"],
    "answer": "A"
  }}
]"""
        }],
        "temperature": 0.7,
        "max_tokens": 1000
    }

    try:
        logger.info("Sending request to GROQ API...")
        response = requests.post(GROQ_API_URL, headers=headers, json=prompt, timeout=30)
        logger.info(f"GROQ API Status Code: {response.status_code}")
        logger.info(f"GROQ API Response: {response.text[:500]}...")  # Log first 500 chars
        
        response.raise_for_status()
        result = response.json()
        
        questions_text = result['choices'][0]['message']['content'].strip()
        logger.info(f"Raw questions text: {questions_text[:500]}...")  # Log first 500 chars
        
        try:
            # First try to parse the text directly
            questions = json.loads(questions_text)
            logger.info("Successfully parsed response as JSON")
        except json.JSONDecodeError:
            # If that fails, try to extract JSON array
            logger.info("Failed to parse response directly, trying to extract JSON array...")
            json_start = questions_text.find('[')
            json_end = questions_text.rfind(']') + 1
            
            if json_start == -1 or json_end == 0:
                logger.error(f"No JSON array found in response: {questions_text}")
                raise ValueError("No valid JSON found in response")
            
            questions_json = questions_text[json_start:json_end]
            logger.info(f"Extracted JSON: {questions_json}")
            questions = json.loads(questions_json)
            logger.info("Successfully parsed extracted JSON")

        # Validate response format
        if not isinstance(questions, list):
            raise ValueError("Response is not a list of questions")

        # Print questions for debugging
        print("\n=== Generated Questions ===")
        print(json.dumps(questions, indent=2))
        print("=====================\n")
        logger.info(f"Generated {len(questions)} questions")

        return questions

    except Exception as e:
        logger.error(f"Error in generate_questions_groq: {str(e)}")
        raise

# Function to process chunks in parallel
def process_chunk(chunk, bloom_level):
    try:
        return generate_questions_groq(chunk, bloom_level)
    except Exception as e:
        logger.error(f"Error processing chunk: {str(e)}")
        return []

def chunk_content(content, max_length=3000):
    """Split content into manageable chunks."""
    sentences = sent_tokenize(content)
    chunks = []
    current_chunk = []
    current_length = 0

    for sentence in sentences:
        if current_length + len(sentence) > max_length:
            if current_chunk:
                chunks.append(" ".join(current_chunk))
                current_chunk = []
                current_length = 0
        current_chunk.append(sentence)
        current_length += len(sentence)

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks

def convert_numpy_types(data):
    """Recursively convert numpy types to native Python types."""
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

@app.post("/api/questions/generate")
async def generate_questions(data: PDFContent):
    logger.info("Starting question generation from PDF content")
    try:
        pdf_content = base64.b64decode(data.content)
        structured_data = extract_structured_by_font(pdf_content)

        if not structured_data:
            raise HTTPException(status_code=400, detail="No structured data extracted from PDF")

        all_questions = []
        topic_breakdown = {}

        for main_topic, subtopics in structured_data.items():
            topic_questions = []

            for subtopic, content in subtopics.items():
                if len(content.strip()) < 100:
                    continue

                processed_content = preprocess_paragraph(content)
                if not processed_content:
                    continue

                bloom_level = basic_bt_mapping(processed_content)
                chunks = chunk_content(processed_content)

                for chunk in chunks:
                    try:
                        questions = generate_questions_groq(chunk, bloom_level)
                        for q in questions:
                            if q["type"] == "MCQ":
                                topic_questions.append({
                                    "content": q["question"],
                                    "options": q["options"],
                                    "correctAnswer": q["answer"],
                                    "bloomLevel": bloom_level,
                                    "type": "MCQ",
                                    "mainTopic": main_topic,
                                    "subtopic": subtopic
                                })
                    except Exception as e:
                        logger.error(f"Error processing chunk: {str(e)}")

            all_questions.extend(topic_questions)
            topic_breakdown[main_topic] = len(topic_questions)

        if not all_questions:
            raise HTTPException(status_code=500, detail="No questions generated")

        response_data = {
            "questions": all_questions,
            "totalQuestions": len(all_questions),
            "topicBreakdown": topic_breakdown
        }

        # Convert numpy types to native Python types
        return convert_numpy_types(response_data)

    except Exception as e:
        logger.error(f"Error generating questions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/pdf/upload")
async def upload_pdf(file: UploadFile):
    logger.info(f"Received PDF upload request: {file.filename}")
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=400,
                detail="File must be a PDF"
            )
            
        content = await file.read()
        if not content:
            raise HTTPException(
                status_code=400,
                detail="Empty file received"
            )

        logger.info("Extracting structured content from PDF")
        structured_data = extract_structured_by_font(content)
        
        if not structured_data:
            logger.error("No structured data extracted from PDF")
            raise HTTPException(
                status_code=400,
                detail="Could not extract content from PDF"
            )

        all_questions = []
        topic_breakdown = {}
        
        # Process each main topic and its subtopics
        for main_topic, subtopics in structured_data.items():
            logger.info(f"Processing main topic: {main_topic}")
            topic_questions = []            
            for subtopic, content in subtopics.items():
                logger.info(f"Processing subtopic: {subtopic}")
                if len(content.strip()) < 100:
                    logger.warning(f"Skipping short content in {main_topic}/{subtopic}")
                    continue
                
                # Preprocess this section's content
                processed_content = preprocess_paragraph(content)
                if not processed_content:
                    logger.warning(f"No content after preprocessing in {main_topic}/{subtopic}")
                    continue
                
                # Get Bloom's level for this section
                section_bloom_level = basic_bt_mapping(processed_content)
                logger.info(f"Determined Bloom's level {section_bloom_level} for {main_topic}/{subtopic}")
                
                try:
                    # Generate questions for this section
                    logger.info(f"Generating questions for {main_topic}/{subtopic}")
                    section_questions = generate_questions_groq(processed_content, section_bloom_level)
                    logger.info(f"Generated {len(section_questions)} questions")
                    
                    # Format and add metadata
                    for q in section_questions:
                        if q["type"] == "MCQ":
                            formatted_question = {
                                "content": q["question"],
                                "options": [opt.replace("A) ", "").replace("B) ", "")
                                          .replace("C) ", "").replace("D) ", "") 
                                          for opt in q["options"]],
                                "correctAnswer": q["answer"],
                                "bloomLevel": section_bloom_level,
                                "type": "MCQ",
                                "mainTopic": main_topic,
                                "subtopic": subtopic
                            }
                            topic_questions.append(formatted_question)
                            logger.info(f"Added question: {formatted_question['content'][:50]}...")
                except Exception as e:
                    logger.error(f"Failed to process section {main_topic}/{subtopic}: {str(e)}")
                    continue
            
            # Add questions from this topic
            all_questions.extend(topic_questions)
            topic_breakdown[main_topic] = len(topic_questions)
            logger.info(f"Added {len(topic_questions)} questions for topic {main_topic}")

        if not all_questions:
            logger.error("No questions were generated")
            raise HTTPException(
                status_code=500,
                detail="Failed to generate any valid questions"
            )

        response_data = {
            "questions": all_questions,
            "totalQuestions": len(all_questions)
        }

        # Convert numpy types to native Python types
        return convert_numpy_types(response_data)

    except Exception as e:
        logger.error(f"Error processing PDF: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing PDF: {str(e)}"
        )

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.on_event("startup")
async def startup_event():
    # Validate required environment variables
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY environment variable is not set")
    

    try:
        response = requests.post(
            GROQ_API_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            json={
                "model": "llama3-8b-8192",
                "messages": [{"role": "user", "content": "Test"}],
                "max_tokens": 1
            }
        )
        response.raise_for_status()
    except Exception as e:
        print(f"Warning: GROQ API test failed: {e}")

# Add explicit host binding
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)