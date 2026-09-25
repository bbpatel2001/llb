"""
Configuration management for LLB Question Bank
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

MONGODB_URL = os.getenv(
    "MONGODB_URL",
    "mongodb://localhost:27017"
)

DATABASE_NAME = os.getenv(
    "DATABASE_NAME",
    "llb_question_bank"
)

# ============================================================================
# API CONFIGURATION
# ============================================================================

API_TITLE = "LLB Question Bank API"
API_VERSION = "1.0.0"
API_DESCRIPTION = "API for law exam questions and study materials"

# ============================================================================
# CORS CONFIGURATION
# ============================================================================

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
]

# ============================================================================
# PAGINATION
# ============================================================================

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# ============================================================================
# SEARCH CONFIGURATION
# ============================================================================

SEARCH_MIN_LENGTH = 2
SEARCH_MAX_LENGTH = 200

# ============================================================================
# FILE UPLOAD CONFIGURATION
# ============================================================================

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50MB

ALLOWED_EXTENSIONS = [".pdf"]

# ============================================================================
# COLLECTION NAMES
# ============================================================================

COLLECTIONS = {
    "questions": "questions",
    "study_materials": "study_materials",
    "flashcards": "flashcards",
    "student_progress": "student_progress",
    "mcq_attempts": "mcq_attempts",
    "quiz_attempts": "quiz_attempts",
    "student_goals": "student_goals",
    "study_notes": "study_notes",
    "students": "students",
}

# ============================================================================
# SIMILARITY THRESHOLD FOR DUPLICATE DETECTION
# ============================================================================

DUPLICATE_DETECTION_THRESHOLD = 0.85  # 85% similarity

# ============================================================================
# SPACED REPETITION CONFIGURATION
# ============================================================================

SM2_INITIAL_EASINESS = 2.5
SM2_MIN_EASINESS = 1.3
SM2_INITIAL_INTERVAL = 1

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# ============================================================================
# CACHE CONFIGURATION
# ============================================================================

CACHE_TTL = 3600  # 1 hour in seconds
ENABLE_CACHE = os.getenv("ENABLE_CACHE", "True").lower() == "true"

# ============================================================================
# SECURITY CONFIGURATION
# ============================================================================

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# ============================================================================
# FEATURE FLAGS
# ============================================================================

ENABLE_AUTHENTICATION = os.getenv("ENABLE_AUTHENTICATION", "False").lower() == "true"
ENABLE_RATE_LIMITING = os.getenv("ENABLE_RATE_LIMITING", "True").lower() == "true"
ENABLE_CACHING = os.getenv("ENABLE_CACHING", "True").lower() == "true"

# ============================================================================
# PRINT CONFIGURATION
# ============================================================================

def print_config():
    """Print current configuration"""
    print("""
    ╔════════════════════════════════════════════════════════════════╗
    ║              LLB QUESTION BANK - CONFIGURATION                 ║
    ╠════════════════════════════════════════════════════════════════╣
    ║ MongoDB URL:       """ + MONGODB_URL + """
    ║ Database:          """ + DATABASE_NAME + """
    ║ API Version:       """ + API_VERSION + """
    ║ CORS Enabled:      Yes
    ║ Authentication:    """ + ("Enabled" if ENABLE_AUTHENTICATION else "Disabled") + """
    ║ Rate Limiting:     """ + ("Enabled" if ENABLE_RATE_LIMITING else "Disabled") + """
    ║ Caching:           """ + ("Enabled" if ENABLE_CACHING else "Disabled") + """
    ╚════════════════════════════════════════════════════════════════╝
    """)
