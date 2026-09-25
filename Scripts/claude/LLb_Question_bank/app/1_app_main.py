"""
LLB Question Bank - FastAPI Backend
Main application file
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routes
from app.routes import questions, study, flashcards, progress, admin

# Import database
from app.database import db

# ============================================================================
# LIFECYCLE EVENTS
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown events
    """
    # Startup
    print("🚀 Starting LLB Question Bank API...")
    await db.connect()
    print("✓ Database connected")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down...")
    await db.disconnect()
    print("✓ Database disconnected")

# ============================================================================
# APP INITIALIZATION
# ============================================================================

app = FastAPI(
    title="LLB Question Bank API",
    description="API for extracting law exam questions and generating study materials",
    version="1.0.0",
    lifespan=lifespan
)

# ============================================================================
# CORS CONFIGURATION
# ============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# INCLUDE ROUTERS
# ============================================================================

app.include_router(questions.router, prefix="/api/questions", tags=["Questions"])
app.include_router(study.router, prefix="/api/study", tags=["Study Materials"])
app.include_router(flashcards.router, prefix="/api/flashcards", tags=["Flashcards"])
app.include_router(progress.router, prefix="/api/progress", tags=["Progress"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

# ============================================================================
# ROOT ROUTES
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to LLB Question Bank API",
        "docs": "/docs",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    db_status = await db.check_connection()
    return {
        "status": "healthy" if db_status else "unhealthy",
        "database": "connected" if db_status else "disconnected",
        "service": "LLB Question Bank API"
    }

@app.get("/stats")
async def get_stats():
    """Get system statistics"""
    return await db.get_stats()

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {
        "status": "error",
        "message": exc.detail,
        "status_code": exc.status_code
    }

# ============================================================================
# STARTUP MESSAGES
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    print("""
    ╔════════════════════════════════════════════════════════════════╗
    ║       LLB QUESTION BANK - FASTAPI BACKEND                      ║
    ║                                                                ║
    ║  Starting server on http://localhost:8000                     ║
    ║  API Documentation: http://localhost:8000/docs                ║
    ║  Alternative Docs: http://localhost:8000/redoc               ║
    ╚════════════════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
