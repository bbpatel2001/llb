"""
Study materials API routes
"""

from fastapi import APIRouter, HTTPException
import logging
from app.database import db
from app.models import StudyMaterial

logger = logging.getLogger(__name__)

router = APIRouter()

# ============================================================================
# GET COMPLETE STUDY MATERIAL
# ============================================================================

@router.get("/{question_id}")
async def get_study_material(question_id: str):
    """
    Get complete study material for a question
    
    Returns:
    - Long answer (20 marks)
    - Short answer (8 marks)
    - Key points
    - Related case laws
    - Bare acts and statutes
    - MCQ questions
    - Flashcards
    - Revision notes
    """
    try:
        material = await db.get_study_material(question_id)
        
        if not material:
            raise HTTPException(status_code=404, detail="Study material not found")
        
        return material
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting study material: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET LONG ANSWER
# ============================================================================

@router.get("/{question_id}/long-answer")
async def get_long_answer(question_id: str):
    """
    Get comprehensive long answer for a question (20 marks)
    
    Includes:
    - Introduction
    - Main points with explanations
    - Legal principles
    - Case law references
    - Practical applications
    - Conclusion
    """
    try:
        answer = await db.get_long_answer(question_id)
        
        if not answer:
            raise HTTPException(status_code=404, detail="Long answer not found")
        
        return {
            "question_id": question_id,
            "marks": 20,
            "answer": answer
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting long answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET SHORT ANSWER
# ============================================================================

@router.get("/{question_id}/short-answer")
async def get_short_answer(question_id: str):
    """
    Get concise short answer for a question (8 marks)
    
    Includes:
    - Concise definition/explanation
    - Key elements
    - Important distinctions
    """
    try:
        answer = await db.get_short_answer(question_id)
        
        if not answer:
            raise HTTPException(status_code=404, detail="Short answer not found")
        
        return {
            "question_id": question_id,
            "marks": 8,
            "answer": answer
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting short answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET KEY POINTS
# ============================================================================

@router.get("/{question_id}/key-points")
async def get_key_points(question_id: str):
    """
    Get key points and concepts for a question
    """
    try:
        study_col = db.db["study_materials"]
        doc = await study_col.find_one(
            {"question_id": question_id},
            {"key_points": 1}
        )
        
        if not doc:
            raise HTTPException(status_code=404, detail="Key points not found")
        
        return {
            "question_id": question_id,
            "key_points": doc.get("key_points", [])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting key points: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET CASE LAWS
# ============================================================================

@router.get("/{question_id}/case-laws")
async def get_case_laws(question_id: str):
    """
    Get related case laws for a question
    
    Includes:
    - Case name
    - Legal principle established
    - Holding/Decision
    - Year and jurisdiction
    """
    try:
        study_col = db.db["study_materials"]
        doc = await study_col.find_one(
            {"question_id": question_id},
            {"case_laws": 1}
        )
        
        if not doc:
            raise HTTPException(status_code=404, detail="Case laws not found")
        
        return {
            "question_id": question_id,
            "case_laws": doc.get("case_laws", [])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting case laws: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET BARE ACTS AND STATUTES
# ============================================================================

@router.get("/{question_id}/bare-acts")
async def get_bare_acts(question_id: str):
    """
    Get relevant statutory acts and sections
    
    Includes:
    - Act title
    - Relevant sections
    - Section descriptions
    """
    try:
        study_col = db.db["study_materials"]
        doc = await study_col.find_one(
            {"question_id": question_id},
            {"bare_acts": 1}
        )
        
        if not doc:
            raise HTTPException(status_code=404, detail="Bare acts not found")
        
        return {
            "question_id": question_id,
            "bare_acts": doc.get("bare_acts", [])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting bare acts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET MCQ QUESTIONS
# ============================================================================

@router.get("/{question_id}/mcq")
async def get_mcq_questions(question_id: str):
    """
    Get MCQ question based on the topic
    
    Returns:
    - Question
    - Options (A, B, C, D)
    - Correct answer
    - Explanation
    """
    try:
        study_col = db.db["study_materials"]
        doc = await study_col.find_one(
            {"question_id": question_id},
            {"mcq_questions": 1}
        )
        
        if not doc or not doc.get("mcq_questions"):
            raise HTTPException(status_code=404, detail="MCQ questions not found")
        
        return {
            "question_id": question_id,
            "mcq_questions": doc.get("mcq_questions", [])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting MCQ questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET FLASHCARD
# ============================================================================

@router.get("/{question_id}/flashcard")
async def get_flashcard(question_id: str):
    """
    Get flashcard for a question
    
    Returns:
    - Front (question/term)
    - Back (answer/definition)
    """
    try:
        study_col = db.db["study_materials"]
        doc = await study_col.find_one(
            {"question_id": question_id},
            {"flashcard": 1}
        )
        
        if not doc:
            raise HTTPException(status_code=404, detail="Flashcard not found")
        
        return {
            "question_id": question_id,
            "flashcard": doc.get("flashcard", {})
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting flashcard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET REVISION NOTES
# ============================================================================

@router.get("/{question_id}/revision-notes")
async def get_revision_notes(question_id: str):
    """
    Get revision notes for a question
    
    Includes:
    - Definition
    - Elements/Components
    - Related concepts
    - Memory aids/Mnemonics
    - Important points
    """
    try:
        study_col = db.db["study_materials"]
        doc = await study_col.find_one(
            {"question_id": question_id},
            {"revision_notes": 1}
        )
        
        if not doc:
            raise HTTPException(status_code=404, detail="Revision notes not found")
        
        return {
            "question_id": question_id,
            "revision_notes": doc.get("revision_notes", "")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting revision notes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET ALL MATERIALS BY SUBJECT
# ============================================================================

@router.get("/subject/{subject}")
async def get_materials_by_subject(subject: str):
    """
    Get all study materials for a subject
    """
    try:
        study_col = db.db["study_materials"]
        questions_col = db.db["questions"]
        
        # Get all question IDs for this subject
        question_ids = await questions_col.distinct("id", {"subject": subject})
        
        # Get study materials for these questions
        cursor = study_col.find({"question_id": {"$in": question_ids}})
        materials = await cursor.to_list(length=None)
        
        return {
            "subject": subject,
            "total": len(materials),
            "materials": materials
        }
        
    except Exception as e:
        logger.error(f"Error getting materials by subject: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# SEARCH STUDY MATERIALS
# ============================================================================

@router.get("/search/{query}")
async def search_study_materials(query: str):
    """
    Search study materials
    """
    try:
        if len(query) < 2:
            raise HTTPException(
                status_code=400,
                detail="Search query must be at least 2 characters"
            )
        
        study_col = db.db["study_materials"]
        
        cursor = study_col.find(
            {"$text": {"$search": query}}
        )
        
        materials = await cursor.to_list(length=20)
        
        return {
            "query": query,
            "total": len(materials),
            "materials": materials
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching study materials: {e}")
        raise HTTPException(status_code=500, detail=str(e))
