# HR/IT FAQ Chatbot

A chatbot application that can answer HR and IT related questions using RAG (Retrieval Augmented Generation).

## Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher
- Git
- Ollama (for local LLM support)
- ChromeDB (for vector storage)

## Quick Start

1. Clone the repository:
```bash
git clone <repository-url>
cd chatbot
```

2. Set up the backend:
```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# Install backend dependencies
pip install -r requirements.txt

# Start the backend server
cd backend
python -m uvicorn main:app --reload
```

3. Set up the frontend (in a new terminal):
```bash
cd frontend
npm install
npm run dev
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Detailed Setup Instructions

### Backend Setup

1. Create and activate virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Start the backend server:
```bash
cd backend
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

## Verification Steps

1. Backend Verification:
   - Open http://localhost:8000/docs in your browser
   - You should see the Swagger UI documentation
   - Try the health check endpoint at http://localhost:8000/

2. Frontend Verification:
   - Open http://localhost:3000 in your browser
   - You should see the chatbot interface
   - Try uploading a PDF document
   - Ask a question to test the RAG functionality

## Features

- Upload PDF documents for context
- Ask questions about HR and IT topics
- Real-time responses using RAG
- Modern UI with Tailwind CSS
- File upload support
- Responsive design

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

## Troubleshooting

1. If you encounter dependency issues:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt --no-cache-dir
   ```

2. If the frontend fails to start:
   ```bash
   cd frontend
   rm -rf node_modules
   npm install
   ```

3. If the backend fails to start:
   - Check if port 8000 is already in use
   - Ensure all dependencies are installed correctly
   - Verify Python version is 3.9 or higher

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the LICENSE file for details. 