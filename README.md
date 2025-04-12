# RAG-based HR/IT FAQ Chatbot

This project implements a RAG (Retrieval-Augmented Generation) based chatbot that can answer HR and IT-related questions by retrieving relevant information from uploaded documents.

## Features

- Document upload and processing
- RAG-based question answering
- Modern web interface
- Local deployment with Ollama-Mistral
- Vector storage with ChromaDB

## Prerequisites

- Python 3.8+
- Node.js 16+
- Ollama installed locally with Mistral model
- npm or yarn

## Setup

1. Install Ollama and pull the Mistral model:
```bash
# Install Ollama (if not already installed)
curl https://ollama.ai/install.sh | sh

# Pull the Mistral model
ollama pull mistral
```

2. Set up the backend:
```bash
# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
cd backend
uvicorn main:app --reload
```

3. Set up the frontend:
```bash
# Install dependencies
cd frontend
npm install

# Start the development server
npm run dev
```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Upload HR/IT-related documents using the file upload section
3. Ask questions in the chat interface
4. The system will retrieve relevant information and generate answers using the RAG pipeline

## Architecture

- Backend: FastAPI with ChromaDB for vector storage
- Frontend: Next.js with TailwindCSS
- LLM: Ollama-Mistral running locally
- Embeddings: Sentence Transformers (all-MiniLM-L6-v2)

## Project Structure

```
.
├── backend/
│   └── main.py
├── frontend/
│   ├── app/
│   │   └── page.tsx
│   └── package.json
├── requirements.txt
└── README.md
```

## Notes

- The system uses local storage for the vector database
- All processing is done locally for privacy and security
- The RAG pipeline uses a chunk size of 1000 characters with 200 character overlap
- The system retrieves the top 3 most relevant chunks for each question 