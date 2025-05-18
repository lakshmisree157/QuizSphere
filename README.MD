# Adaptive Quiz Project

## Overview
This project consists of three main parts:

- **Client**: React frontend application  
- **ML Service**: Python FastAPI service for machine learning tasks  
- **Server**: Node.js Express backend API server  

---

## Prerequisites

- Node.js and npm installed  
- Python 3.8 or higher  
- Virtual environment  
- MongoDB instance running  
- GROQ API key  

---

## Environment Variables

### `client/.env`
```env
REACT_APP_API_URL=http://localhost:5000
```

### `ml-service/.env`
```env
GROQ_API_KEY=your_groq_api_key
CLIENT_URL=http://localhost:3000
PORT=8000
```

### `server/.env`
```env
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:3000
PORT=5000
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

---

## Setup and Running Instructions

### Client

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
REACT_APP_API_URL=http://localhost:5000
```

4. Run the client:
```bash
npm start
```

---

### ML Service

1. Navigate to the ML service directory:
```bash
cd ml-service
```

2. Create and activate a virtual environment:

**Windows:**
```bash
python -m venv venv
.\venv\Scripts\activate
```

**Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Download required NLTK data:
```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('wordnet'); nltk.download('averaged_perceptron_tagger')"
```

5. Install spaCy model:
```bash
python -m spacy download en_core_web_sm
```

6. Create `.env` file:
```env
GROQ_API_KEY=your_groq_api_key
CLIENT_URL=http://localhost:3000
PORT=8000
```

7. Run the ML service:
```bash
uvicorn server:app --host 127.0.0.1 --port 8000 --reload
```

---

### Server

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:3000
PORT=5000
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

4. Run the server:
```bash
npm start
```

To run in development mode with auto-restart:
```bash
npm run dev
```

---

## Notes

- Make sure MongoDB is running and accessible via the connection string.  
- Adjust ports in `.env` files if needed to avoid conflicts.  
- Use `npm run dev` in the server for auto-restarting during development.
