# HR/IT FAQ Chatbot

A chatbot application that can answer HR and IT related questions using RAG (Retrieval Augmented Generation).

## Setup Instructions

### Backend Setup

1. Create a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
```

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Start the backend server:
```bash
python -m uvicorn main:app --reload
```

The backend will run on http://localhost:8000

### Frontend Setup

1. Install Node.js dependencies:
```bash
cd frontend
npm install
```

2. Start the frontend development server:
```bash
npm run dev
```

The frontend will run on http://localhost:3000

## Features

- Upload PDF documents for context
- Ask questions about HR and IT topics
- Real-time responses using RAG
- Modern UI with Tailwind CSS
- File upload support
- Responsive design

## Requirements

- Python 3.9+
- Node.js 18+
- Ollama (for local LLM support)
- ChromeDB (for vector storage)

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