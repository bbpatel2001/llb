"""
Questions API routes
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import logging
from app.database import db
from app.models import Question, SearchRequest, PaginatedResponse

logger = logging.getLogger(__name__)

router = APIRouter()

# ============================================================================
# GET QUESTIONS
# ============================================================================

@router.get("/", response_model=List[Question])
async def get_questions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    subject: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    question_type: Optional[str] = Query(None)
):
    """
    Get all questions with optional filters
    
    - **skip**: Number of questions to skip
    - **limit**: Number of questions to return
    - **subject**: Filter by subject (e.g., "Law of Torts")
    - **year**: Filter by year (e.g., 2024)
    - **question_type**: Filter by type (Long Answer, MCQ, etc.)
    """
    try:
        query = {}
        
        if subject:
            query["subject"] = subject
        if year:
            query["year"] = year
        if question_type:
            query["question_type"] = question_type
        
        # Get total count
        questions_col = db.db["questions"]
        total = await questions_col.count_documents(query)
        
        # Get paginated results
        cursor = questions_col.find(query).skip(skip).limit(limit)
        questions = await cursor.to_list(length=limit)
        
        return questions
        
    except Exception as e:
        logger.error(f"Error getting questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET SINGLE QUESTION
# ============================================================================

@router.get("/{question_id}")
async def get_question(question_id: str):
    """
    Get a single question by ID with all details
    """
    try:
        question = await db.get_question_by_id(question_id)
        
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        return question
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting question {question_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# SEARCH QUESTIONS
# ============================================================================

@router.post("/search")
async def search_questions(
    request: SearchRequest
):
    """
    Full-text search questions
    
    Request body:
    - **query**: Search query string
    - **skip**: Number of results to skip
    - **limit**: Number of results to return
    """
    try:
        if len(request.query) < 2:
            raise HTTPException(
                status_code=400,
                detail="Search query must be at least 2 characters"
            )
        
        results = await db.search_questions(
            request.query,
            skip=request.skip,
            limit=request.limit
        )
        
        return {
            "query": request.query,
            "total": len(results),
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET QUESTIONS BY SUBJECT
# ============================================================================

@router.get("/by-subject/{subject}")
async def get_questions_by_subject(
    subject: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get all questions for a specific subject
    """
    try:
        questions_col = db.db["questions"]
        
        # Count total
        total = await questions_col.count_documents({"subject": subject})
        
        # Get paginated results
        cursor = questions_col.find({"subject": subject}).skip(skip).limit(limit)
        questions = await cursor.to_list(length=limit)
        
        return {
            "subject": subject,
            "total": total,
            "skip": skip,
            "limit": limit,
            "questions": questions
        }
        
    except Exception as e:
        logger.error(f"Error getting questions by subject: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET QUESTIONS BY YEAR
# ============================================================================

@router.get("/by-year/{year}")
async def get_questions_by_year(
    year: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get all questions from a specific year
    """
    try:
        if year < 2000 or year > 2100:
            raise HTTPException(status_code=400, detail="Invalid year")
        
        questions_col = db.db["questions"]
        
        total = await questions_col.count_documents({"year": year})
        cursor = questions_col.find({"year": year}).skip(skip).limit(limit)
        questions = await cursor.to_list(length=limit)
        
        return {
            "year": year,
            "total": total,
            "questions": questions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting questions by year: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET SUBJECTS
# ============================================================================

@router.get("/subjects/list")
async def get_subjects():
    """
    Get all available subjects
    """
    try:
        questions_col = db.db["questions"]
        subjects = await questions_col.distinct("subject")
        
        return {
            "total": len(subjects),
            "subjects": sorted(subjects)
        }
        
    except Exception as e:
        logger.error(f"Error getting subjects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET YEARS
# ============================================================================

@router.get("/years/list")
async def get_years():
    """
    Get all available years
    """
    try:
        questions_col = db.db["questions"]
        years = await questions_col.distinct("year")
        
        return {
            "total": len(years),
            "years": sorted(years, reverse=True)
        }
        
    except Exception as e:
        logger.error(f"Error getting years: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET QUESTION TYPES
# ============================================================================

@router.get("/types/list")
async def get_question_types():
    """
    Get all available question types
    """
    try:
        questions_col = db.db["questions"]
        types = await questions_col.distinct("question_type")
        
        return {
            "total": len(types),
            "types": sorted(types)
        }
        
    except Exception as e:
        logger.error(f"Error getting question types: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET DUPLICATE QUESTIONS
# ============================================================================

@router.get("/duplicates/list")
async def get_duplicate_questions():
    """
    Get all duplicate/repeated questions
    """
    try:
        duplicates = await db.get_duplicate_questions()
        
        return {
            "total": len(duplicates),
            "duplicates": duplicates
        }
        
    except Exception as e:
        logger.error(f"Error getting duplicate questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET STATISTICS
# ============================================================================

@router.get("/stats/overview")
async def get_questions_stats():
    """
    Get overall questions statistics
    """
    try:
        questions_col = db.db["questions"]
        
        # Count by subject
        subjects_pipeline = [
            {"$group": {"_id": "$subject", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        subjects = await questions_col.aggregate(subjects_pipeline).to_list(None)
        
        # Count by year
        years_pipeline = [
            {"$group": {"_id": "$year", "count": {"$sum": 1}}},
            {"$sort": {"_id": -1}}
        ]
        years = await questions_col.aggregate(years_pipeline).to_list(None)
        
        # Count by type
        types_pipeline = [
            {"$group": {"_id": "$question_type", "count": {"$sum": 1}}}
        ]
        types = await questions_col.aggregate(types_pipeline).to_list(None)
        
        # Total stats
        total = await questions_col.count_documents({})
        total_marks = await questions_col.aggregate([
            {"$group": {"_id": None, "total": {"$sum": "$marks"}}}
        ]).to_list(1)
        
        return {
            "total_questions": total,
            "total_marks": total_marks[0]["total"] if total_marks else 0,
            "by_subject": subjects,
            "by_year": years,
            "by_type": types
        }
        
    except Exception as e:
        logger.error(f"Error getting statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))
