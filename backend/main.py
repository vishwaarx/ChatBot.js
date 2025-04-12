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
from functools import lru_cache
import hashlib

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
CHUNK_SIZE = 1000  # Increased for better context
CHUNK_OVERLAP = 200  # Increased for better continuity
CACHE_TTL = 3600  # Cache time-to-live in seconds

# Cache configuration
@lru_cache(maxsize=100)
def get_document_embedding(text: str):
    return embeddings.embed_query(text)

@lru_cache(maxsize=1000)
def get_question_embedding(text: str):
    return embeddings.embed_query(text)

# Initialize ChromaDB with optimized settings
CHROMA_DB_PATH = "./chroma_db"
try:
    chroma_client = chromadb.PersistentClient(
        path=CHROMA_DB_PATH,
        settings=Settings(
            anonymized_telemetry=False,
            allow_reset=True,
            is_persistent=True
        )
    )
    logger.info("ChromaDB initialized successfully")
except Exception as e:
    logger.error(f"Error initializing ChromaDB: {str(e)}")
    raise

# Initialize embeddings with optimized model
try:
    embeddings = HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2",
        model_kwargs={'device': 'cpu'},
        encode_kwargs={'normalize_embeddings': True}
    )
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

def load_training_data():
    """Load and process the training data from training.txt"""
    try:
        # Use absolute path to the training.txt file
        import os
        current_dir = os.path.dirname(os.path.abspath(__file__))
        training_file_path = os.path.join(os.path.dirname(current_dir), "data", "training.txt")
        
        with open(training_file_path, "r") as file:
            content = file.read()
            
        # Split content into Q&A pairs
        qa_pairs = []
        current_qa = {"question": "", "answer": ""}
        
        for line in content.split("\n"):
            line = line.strip()
            if line.startswith("Q:"):
                if current_qa["question"] and current_qa["answer"]:
                    qa_pairs.append(current_qa)
                current_qa = {"question": line[2:].strip(), "answer": ""}
            elif line.startswith("A:"):
                current_qa["answer"] = line[2:].strip()
        
        # Add the last pair
        if current_qa["question"] and current_qa["answer"]:
            qa_pairs.append(current_qa)
            
        # Create or get collection for training data
        collection_name = "training_data"
        try:
            collection = chroma_client.get_collection(collection_name)
            logger.info("Retrieved existing training collection")
        except:
            collection = chroma_client.create_collection(collection_name)
            logger.info("Created new training collection")
            
        # Add Q&A pairs to collection
        for i, qa in enumerate(qa_pairs):
            # Combine question and answer for better context
            combined_text = f"Question: {qa['question']}\nAnswer: {qa['answer']}"
            collection.add(
                documents=[combined_text],
                ids=[f"training_{i}"]
            )
            
        logger.info(f"Added {len(qa_pairs)} training Q&A pairs to collection")
        return True
    except Exception as e:
        logger.error(f"Error loading training data: {str(e)}")
        return False

# Load training data on startup
load_training_data()

@app.post("/ask")
async def ask_question(question: Question):
    try:
        logger.info(f"Received question: {question.text}")
        
        # Initialize variables
        docs_context = ""
        training_context = ""
        retriever = None
        
        # Get training data context with improved retrieval
        try:
            training_collection = chroma_client.get_collection("training_data")
            training_vectorstore = Chroma(
                client=chroma_client,
                collection_name="training_data",
                embedding_function=embeddings
            )
            training_retriever = training_vectorstore.as_retriever(
                search_type="similarity",
                search_kwargs={
                    "k": 4
                }
            )
            training_results = training_retriever.get_relevant_documents(question.text)
            training_context = "\n\n".join([doc.page_content for doc in training_results])
            logger.info("Retrieved training data successfully")
            
            # Set the default retriever to training data
            retriever = training_retriever
        except Exception as e:
            logger.error(f"Error accessing training data: {str(e)}")
            raise HTTPException(status_code=500, detail="Error accessing training data")
        
        # Get uploaded documents context with improved retrieval
        try:
            collections = chroma_client.list_collections()
            if any(col.name == "hr_it_docs" for col in collections):
                docs_collection = chroma_client.get_collection("hr_it_docs")
                docs_vectorstore = Chroma(
                    client=chroma_client,
                    collection_name="hr_it_docs",
                    embedding_function=embeddings
                )
                docs_retriever = docs_vectorstore.as_retriever(
                    search_type="similarity",
                    search_kwargs={
                        "k": 4
                    }
                )
                docs_results = docs_retriever.get_relevant_documents(question.text)
                docs_context = "\n\n".join([doc.page_content for doc in docs_results])
                logger.info("Found and used uploaded documents")
            else:
                logger.info("No uploaded documents collection found")
        except Exception as e:
            logger.error(f"Error accessing uploaded documents: {str(e)}")
        
        # Combine contexts
        combined_context = f"{training_context}\n\n{docs_context}".strip()
        
        # Create a more focused prompt template
        prompt_template = """Use the following context to answer the question. If you cannot find the answer in the context, say "I cannot find a specific answer to this question in the provided context."

Context: {context}

Question: {question}

Answer: Let me help you with that."""

        # Initialize QA chain with optimized settings
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=retriever,
            return_source_documents=True,
            chain_type_kwargs={
                "prompt": PromptTemplate(
                    template=prompt_template,
                    input_variables=["context", "question"]
                )
            }
        )
        
        # Get response with timeout
        try:
            response = await asyncio.wait_for(
                asyncio.to_thread(qa_chain.invoke, {"query": question.text}),
                timeout=30.0  # 30 second timeout
            )
            
            return JSONResponse(content={
                "answer": response["result"],
                "sources": [doc.page_content[:200] + "..." for doc in response.get("source_documents", [])]
            })
        except asyncio.TimeoutError:
            logger.error("Response generation timed out")
            raise HTTPException(status_code=504, detail="Response generation timed out")
            
    except Exception as e:
        logger.error(f"Error processing question: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 