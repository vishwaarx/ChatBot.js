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

## Quick Start

1. Clone the repository:
```