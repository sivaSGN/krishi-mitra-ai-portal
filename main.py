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

from fastapi import FastAPI, HTTPException, status, Response
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


import auth_db

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
    language: Optional[str] = Field(
        default=None,
        description="Optional preferred response language code ('ta', 'te', 'en', 'hi')."
    )


class ChatResponse(BaseModel):
    """
    Schema for outgoing AI answer response.
    """
    answer: str = Field(
        ...,
        description="Farmer-friendly, grounded natural language answer."
    )


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, description="Farmer's full name")
    age: int = Field(..., ge=18, le=120, description="Farmer's age")
    state: str = Field(..., min_length=1, description="State")
    district: str = Field(..., min_length=1, description="District")
    preferred_language: str = Field("en", description="Preferred language code")
    annual_income: str = Field(..., min_length=1, description="Annual income")
    mobile: str = Field(..., min_length=10, max_length=15, description="10-digit mobile number")
    password: str = Field(..., min_length=6, description="Account password (min 6 chars)")


class LoginRequest(BaseModel):
    mobile: str = Field(..., min_length=10, max_length=15, description="Registered mobile number")
    password: str = Field(..., min_length=1, description="Account password")


class AuthResponse(BaseModel):
    success: bool
    message: str
    user: Optional[Dict[str, Any]] = None
    session_token: Optional[str] = None


class FarmerProfileRequest(BaseModel):
    name: Optional[str] = "Farmer"
    age: Optional[int] = 42
    gender: Optional[str] = "Male"
    state: Optional[str] = "Telangana"
    district: Optional[str] = "Warangal"
    farmer_type: Optional[str] = None
    farmerType: Optional[str] = None
    crop: Optional[str] = "Paddy & Cotton"
    experience: Optional[str] = "15 years"
    irrigation: Optional[str] = "Borewell"
    ownership: Optional[str] = "Owned"
    land_size: Optional[str] = None
    landSize: Optional[str] = None
    land_location: Optional[str] = None
    landLocation: Optional[str] = None
    income: Optional[str] = None
    annual_income: Optional[str] = None
    aadhaar: Optional[bool] = True
    bank: Optional[bool] = True
    land_document: Optional[bool] = None
    landDocument: Optional[bool] = None
    preferred_language: Optional[str] = "en"
    language: Optional[str] = None


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
        logger.info(f"Received query: '{query_text}' (language: {payload.language})")
        
        # Execute Layer 2 (FAISS) + Layer 3 (Groq LLM) pipeline with language preference
        result = krishi_ai_engine.ask(
            query=query_text,
            top_k=3,
            language=payload.language
        )
        
        logger.info(f"Successfully generated answer for query: '{query_text}'")
        return ChatResponse(answer=result["answer"])

    except Exception as e:
        logger.error(f"Error processing question '{query_text}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while generating the response: {str(e)}"
        )


@app.post("/api/register", response_model=AuthResponse, tags=["Authentication"])
async def register_endpoint(payload: RegisterRequest):
    """
    Registers a new farmer in the database with hashed password.
    Enforces 10-digit unique mobile number.
    """
    import secrets
    ok, message, user = auth_db.register_user(
        name=payload.name,
        age=payload.age,
        state=payload.state,
        district=payload.district,
        preferred_language=payload.preferred_language,
        annual_income=payload.annual_income,
        mobile=payload.mobile,
        password=payload.password,
    )
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    session_token = secrets.token_hex(24)
    return AuthResponse(
        success=True,
        message=message,
        user=user,
        session_token=session_token,
    )


@app.post("/api/login", response_model=AuthResponse, tags=["Authentication"])
async def login_endpoint(payload: LoginRequest):
    """
    Authenticates farmer by mobile number and password against database.
    """
    import secrets
    ok, message, user = auth_db.authenticate_user(
        mobile=payload.mobile,
        password=payload.password,
    )
    if not ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=message)

    session_token = secrets.token_hex(24)
    return AuthResponse(
        success=True,
        message=message,
        user=user,
        session_token=session_token,
    )


@app.get("/api/user/{mobile}", tags=["Authentication"])
async def get_user_endpoint(mobile: str):
    """
    Retrieves user profile details by mobile number.
    """
    user = auth_db.get_user_by_mobile(mobile)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"success": True, "user": user}


@app.post("/api/user/{mobile}/profile", tags=["Farmer Profile & Analytics"])
@app.put("/api/user/{mobile}/profile", tags=["Farmer Profile & Analytics"])
async def save_farmer_profile_endpoint(mobile: str, payload: FarmerProfileRequest):
    """
    Saves or updates complete details of a specific farmer in the database
    for profile management and future agricultural analytics.
    """
    ok, message, updated_profile = auth_db.save_or_update_farmer_profile(
        mobile=mobile,
        profile_data=payload.model_dump(exclude_unset=True),
    )
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    return {
        "success": True,
        "message": message,
        "profile": updated_profile,
    }


@app.get("/api/user/{mobile}/profile", tags=["Farmer Profile & Analytics"])
async def get_farmer_profile_endpoint(mobile: str):
    """
    Retrieves all details stored in the database for a specific farmer.
    """
    profile = auth_db.get_farmer_profile_by_mobile(mobile)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farmer profile not found")
    return {
        "success": True,
        "profile": profile,
    }


@app.get("/api/analytics/farmers", tags=["Farmer Profile & Analytics"])
async def get_all_farmers_analytics_endpoint():
    """
    Retrieves all farmer profile records stored in the database for future analysis,
    statistical aggregations, crop patterns, and agricultural policy intelligence.
    """
    farmers = auth_db.get_all_farmer_profiles_for_analysis()
    return {
        "success": True,
        "count": len(farmers),
        "farmers": farmers,
    }


@app.get("/api/analytics/export.csv", tags=["Farmer Profile & Analytics"])
async def export_farmers_csv_endpoint():
    """
    Exports all farmer profile details as a downloadable CSV dataset for offline analysis
    in Excel, Pandas, or BI platforms.
    """
    csv_content = auth_db.export_farmers_to_csv()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=farmer_profiles_dataset.csv"
        }
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
