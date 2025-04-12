from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import chromadb
from chromadb.config import Settings
import os
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.llms import Ollama
from langchain.chains import RetrievalQA
import uvicorn
import logging
from fastapi.responses import JSONResponse
import asyncio
import PyPDF2
import io
from langchain.prompts import PromptTemplate

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
CHUNK_SIZE = 500  # Reduced from 1000 to 500 for faster processing
CHUNK_OVERLAP = 100  # Reduced from 200 to 100 for faster processing

# Initialize ChromaDB
CHROMA_DB_PATH = "./chroma_db"
try:
    chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    logger.info("ChromaDB initialized successfully")
except Exception as e:
    logger.error(f"Error initializing ChromaDB: {str(e)}")
    raise

# Initialize embeddings
try:
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    logger.info("Embeddings model loaded successfully")
except Exception as e:
    logger.error(f"Error loading embeddings model: {str(e)}")
    raise

# Initialize Ollama
try:
    llm = Ollama(model="mistral")
    logger.info("Ollama Mistral model initialized successfully")
except Exception as e:
    logger.error(f"Error initializing Ollama: {str(e)}")
    raise

class Question(BaseModel):
    text: str

def extract_text_from_pdf(pdf_bytes):
    """Extract text from PDF bytes"""
    try:
        pdf_file = io.BytesIO(pdf_bytes)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        raise

async def process_file_content(content, file_extension=None):
    """Process file content asynchronously"""
    try:
        # If it's a PDF, extract text first
        if file_extension and file_extension.lower() == '.pdf':
            content = extract_text_from_pdf(content.encode('utf-8') if isinstance(content, str) else content)
            logger.info("Extracted text from PDF")
        
        # Split text into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP
        )
        chunks = text_splitter.split_text(content)
        logger.info(f"Split document into {len(chunks)} chunks")
        
        # Create or get collection
        collection_name = "hr_it_docs"
        try:
            collection = chroma_client.get_collection(collection_name)
            logger.info("Retrieved existing collection")
        except:
            collection = chroma_client.create_collection(collection_name)
            logger.info("Created new collection")
        
        # Add documents to collection
        collection.add(
            documents=chunks,
            ids=[f"doc_{i}" for i in range(len(chunks))]
        )
        logger.info("Documents added to collection successfully")
        
        return True
    except Exception as e:
        logger.error(f"Error processing file content: {str(e)}")
        raise

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        # Check file size
        file_size = 0
        chunk_size = 1024 * 1024  # 1MB chunks
        content = bytearray()
        
        # Read file in chunks
        while chunk := await file.read(chunk_size):
            file_size += len(chunk)
            if file_size > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
            content.extend(chunk)
        
        # Process the file content
        file_extension = os.path.splitext(file.filename)[1].lower()
        await process_file_content(bytes(content), file_extension)
        
        return {"message": "File processed successfully"}
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask")
async def ask_question(question: Question):
    try:
        logger.info(f"Received question: {question.text}")
        
        # Get collection
        collection_name = "hr_it_docs"
        collection = chroma_client.get_collection(collection_name)
        
        # Create vector store
        vectorstore = Chroma(
            client=chroma_client,
            collection_name=collection_name,
            embedding_function=embeddings
        )
        
        # Create retriever with smaller k value for faster processing
        retriever = vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 3}  # Reduced from default to 3 most relevant chunks
        )
        
        # Create QA chain with optimized parameters
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=retriever,
            return_source_documents=True,
            chain_type_kwargs={
                "prompt": PromptTemplate(
                    template="Answer the question based on the following context. If you cannot find the answer in the context, say 'I cannot find the answer in the provided documents.'\n\nContext: {context}\n\nQuestion: {question}\n\nAnswer:",
                    input_variables=["context", "question"]
                )
            }
        )
        
        # Get answer
        result = qa_chain({"query": question.text})
        logger.info("Generated answer successfully")
        
        return {"answer": result["result"]}
    except Exception as e:
        logger.error(f"Error processing question: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 