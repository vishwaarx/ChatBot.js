# RAG Chatbot with PDF Support

A powerful chatbot application that uses Retrieval-Augmented Generation (RAG) to answer questions based on uploaded PDF documents. Built with FastAPI, Next.js, and Ollama.

## Features

- PDF document upload and processing
- Intelligent question answering using RAG
- Modern, responsive UI with TailwindCSS
- Real-time chat interface
- Document context-aware responses
- Powered by Mistral model through Ollama

## Prerequisites

- Python 3.8+
- Node.js 16+
- Ollama installed and running
- Mistral model pulled in Ollama

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/vishwaarx/ChatBot.js.git
cd ChatBot.js
```

### 2. Backend Setup

```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Pull Mistral model for Ollama
ollama pull mistral
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### 1. Start the Backend Server

```bash
# From the root directory
cd backend
uvicorn main:app --reload
```

The backend server will start on `http://localhost:8000`

### 2. Start the Frontend Development Server

```bash
# In a new terminal, from the frontend directory
cd frontend
npm run dev
```

The frontend application will be available at `http://localhost:3000`

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Upload a PDF document using the file upload interface
3. Wait for the document to be processed
4. Start asking questions about the content of your document
5. The chatbot will provide answers based on the document's content

## Project Structure

```
.
├── backend/
│   ├── main.py           # FastAPI application
│   └── chroma_db/        # Vector database storage
├── frontend/
│   ├── app/              # Next.js application
│   ├── public/           # Static assets
│   └── package.json      # Frontend dependencies
└── requirements.txt      # Python dependencies
```

## Technologies Used

### Backend
- FastAPI
- LangChain
- ChromaDB
- Ollama
- PyPDF2
- Sentence Transformers

### Frontend
- Next.js
- React
- TailwindCSS
- Axios
- TypeScript

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the LICENSE file for details. 