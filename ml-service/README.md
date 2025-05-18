# ML Service Setup and Running Instructions

## Prerequisites
- Python 3.8 or higher
- Virtual environment
- GROQ API key

## Setup Instructions

1. Create and activate virtual environment:
```bash
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate # Linux/Mac
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Download required NLTK data:
```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('wordnet'); nltk.download('averaged_perceptron_tagger')"
```

4. Install spaCy model:
```bash
python -m spacy download en_core_web_sm
```

5. Create `.env` file with your GROQ API key:
```env
GROQ_API_KEY=your_groq_api_key
CLIENT_URL=http://localhost:3000
PORT=8000
```

## Running the Service

1. Make sure you're in the virtual environment (you should see `(venv)` in your terminal)

2. Start the service:
```bash
uvicorn server:app --host 127.0.0.1 --port 8000 --reload
```

3. Verify the service is running by visiting:
```
http://127.0.0.1:8000/health
```
You should see: `{"status": "ok"}`

## Troubleshooting

- If port 8000 is in use, you can specify a different port:
```bash
uvicorn server:app --host 127.0.0.1 --port 8001 --reload
```

- If dependencies are missing:
```bash
pip install -r requirements.txt
```

- If NLTK data is missing:
```bash
python -c "import nltk; nltk.download('all')"
```