"""
=============================================================================
Krishi Mitra AI Portal - Layer 4: FastAPI Backend (main.py)
=============================================================================

This module provides the REST API for the Krishi Mitra AI Portal, exposing
the RAG pipeline (FAISS vector search + Groq LLM) over HTTP for frontend
applications, mobile apps, and external integrations.

Pipeline Flow:
React Frontend (or HTTP Client)
       │  POST /chat  {"question": "..."}
       ▼
FastAPI Backend (main.py)
       │  Calls RAG Engine
       ▼
Layer 2 & 3: FAISS Retrieval (search.py) + Groq LLM (llm.py)
       │
       ▼
JSON Response: {"answer": "..."}
=============================================================================
"""

import sys
import logging
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Set terminal stdout encoding to UTF-8 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Import Layer 3 LLM Generator (which internally uses Layer 2 FAISS Retriever)
from llm import KrishiMitraLLM

# ---------------------------------------------------------------------------
# Logging Configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("krishi-mitra-api")

# ---------------------------------------------------------------------------
# Global RAG Engine Instance (Loaded once at server startup)
# ---------------------------------------------------------------------------
krishi_ai_engine: Optional[KrishiMitraLLM] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager to load the embedding model and FAISS index
    once during server startup, and clean up on shutdown.
    """
    global krishi_ai_engine
    logger.info("Initializing Krishi Mitra RAG Engine (FAISS + Groq)...")
    try:
        krishi_ai_engine = KrishiMitraLLM()
        logger.info("Krishi Mitra RAG Engine successfully initialized and ready for requests.")
    except Exception as e:
        logger.error(f"Failed to initialize Krishi Mitra RAG Engine: {e}", exc_info=True)
        raise e
    yield
    logger.info("Shutting down Krishi Mitra API Server...")


# ---------------------------------------------------------------------------
# FastAPI Application Definition
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Krishi Mitra AI Portal API",
    description=(
        "Layer 4 REST API for Krishi Mitra AI Portal. "
        "Provides grounded, farmer-friendly agricultural scheme intelligence "
        "powered by FAISS vector similarity search and Groq LLM."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS Middleware (Allows React, Vite, and mobile client access)
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local development and web clients
    allow_credentials=True,
    allow_methods=["*"],  # Allows GET, POST, OPTIONS, etc.
    allow_headers=["*"],  # Allows all headers
)


# ---------------------------------------------------------------------------
# Pydantic Request & Response Schemas
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    """
    Schema for incoming farmer chat question.
    """
    question: str = Field(
        ...,
        min_length=1,
        description="The farmer's question or topic of inquiry.",
        examples=["I want a scheme for paddy crop"]
    )


class ChatResponse(BaseModel):
    """
    Schema for outgoing AI answer response.
    """
    answer: str = Field(
        ...,
        description="Farmer-friendly, grounded natural language answer."
    )


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
async def root():
    """
    Root endpoint providing API information and service health.
    """
    return {
        "service": "Krishi Mitra AI Portal API",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
        "endpoints": {
            "chat": "POST /chat",
            "health": "GET /health"
        }
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint to verify backend and RAG engine status.
    """
    engine_ready = krishi_ai_engine is not None
    return {
        "status": "healthy" if engine_ready else "initializing",
        "rag_engine_ready": engine_ready,
        "indexed_schemes_count": len(krishi_ai_engine.retriever.chunks) if engine_ready else 0
    }


@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat_endpoint(payload: ChatRequest):
    """
    Primary RAG Chat Endpoint.
    
    1. Accepts a farmer's question.
    2. Retrieves the top 3 relevant schemes from FAISS vector search.
    3. Generates a grounded, farmer-friendly answer using Groq LLM.
    4. Returns {"answer": "..."}.
    """
    global krishi_ai_engine

    # Ensure engine is loaded
    if krishi_ai_engine is None:
        try:
            logger.info("Lazy-loading KrishiMitraLLM engine...")
            krishi_ai_engine = KrishiMitraLLM()
        except Exception as e:
            logger.error(f"Error initializing RAG engine: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="RAG Engine is not yet ready. Please check server logs and configuration."
            )

    # Validate input query
    query_text = payload.question.strip()
    if not query_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The 'question' field cannot be empty."
        )

    try:
        logger.info(f"Received query: '{query_text}'")
        
        # Execute Layer 2 (FAISS) + Layer 3 (Groq LLM) pipeline
        result = krishi_ai_engine.ask(query=query_text, top_k=3)
        
        logger.info(f"Successfully generated answer for query: '{query_text}'")
        return ChatResponse(answer=result["answer"])

    except Exception as e:
        logger.error(f"Error processing question '{query_text}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while generating the response: {str(e)}"
        )


# ---------------------------------------------------------------------------
# Server Startup Execution
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    print("\n" + "=" * 80)
    print("   KRISHI MITRA AI PORTAL - LAYER 4 FASTAPI BACKEND SERVER")
    print("   Access API Documentation at: http://localhost:8000/docs")
    print("   Chat Endpoint: POST http://localhost:8000/chat")
    print("=" * 80 + "\n")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
