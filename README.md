# HR/IT FAQ Chatbot

A chatbot application that can answer HR and IT related questions using RAG (Retrieval Augmented Generation).

## Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher
- Git
- Ollama (for local LLM support)
- ChromeDB (for vector storage)
- Google API Key (for document processing)

## Environment Configuration

1. Create a `.env` file in the root directory:
```bash
touch .env
```

2. Add your Google API key to the `.env` file:
```
GOOGLE_API_KEY=your_api_key_here
```

Make sure to:
- Never commit the `.env` file to version control
- Keep your API key secure and private
- Replace `your_api_key_here` with your actual Google API key

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On macOS/Linux
```

3. Install backend dependencies:
```bash
pip install -r requirements.txt
```

4. Start the backend server:
```bash
uvicorn main:app --reload
```

The backend server will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install frontend dependencies:
```bash
npm install
```

3. Build the Next.js application:
```bash
npm run build
```

4. Start the frontend server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## Development Mode

For frontend development, you can use:
```bash
npm run dev
```

This will start the development server with hot-reloading enabled.

## Troubleshooting

1. If you get "command not found" for uvicorn:
   - Make sure you're in the virtual environment (you should see `(venv)` in your terminal)
   - Verify uvicorn is installed: `pip show uvicorn`

2. If you get "missing .next/BUILD_ID" error:
   - Make sure you've run `npm run build` before `npm start`
   - Or use `npm run dev` for development

3. If you get dependency errors:
   - Make sure you're using the correct Python version (3.9 or higher)
   - Make sure you're using the correct Node.js version (18 or higher)
   - Try deleting `node_modules` and running `npm install` again

## Project Structure

- `/backend` - FastAPI backend server
- `/frontend` - Next.js frontend application
- `/data` - Data files and documents
- `requirements.txt` - Backend dependencies
- `.env` - Environment configuration

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request