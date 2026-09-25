"""
Flashcards API routes with spaced repetition algorithm (SM-2)
"""

from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta
import logging
from app.database import db
from app.models import FlashcardReviewRequest
from app.config import SM2_INITIAL_EASINESS, SM2_MIN_EASINESS, SM2_INITIAL_INTERVAL

logger = logging.getLogger(__name__)

router = APIRouter()

# ============================================================================
# GET DUE FLASHCARDS FOR REVIEW
# ============================================================================

@router.get("/due/{student_id}")
async def get_due_flashcards(
    student_id: str,
    limit: int = Query(10, ge=1, le=50)
):
    """
    Get flashcards due for review (spaced repetition algorithm)
    
    Returns flashcards that need to be reviewed based on:
    - Next review date has passed
    - Spaced repetition interval
    """
    try:
        flashcards = await db.get_due_flashcards(student_id, limit)
        
        return {
            "student_id": student_id,
            "total": len(flashcards),
            "flashcards": flashcards
        }
        
    except Exception as e:
        logger.error(f"Error getting due flashcards: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET FLASHCARD DECK
# ============================================================================

@router.get("/deck/{deck_id}")
async def get_flashcard_deck(
    deck_id: str,
    student_id: str = Query(...)
):
    """
    Get all flashcards in a deck
    """
    try:
        flashcards_col = db.db["flashcards"]
        cursor = flashcards_col.find({
            "deck_id": deck_id,
            "student_id": student_id
        })
        
        flashcards = await cursor.to_list(length=None)
        
        if not flashcards:
            raise HTTPException(status_code=404, detail="Deck not found")
        
        return {
            "deck_id": deck_id,
            "total": len(flashcards),
            "flashcards": flashcards
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting flashcard deck: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# CREATE FLASHCARD FROM QUESTION
# ============================================================================

@router.post("/create/{question_id}")
async def create_flashcard_from_question(
    question_id: str,
    student_id: str = Query(...),
    deck_id: str = Query(...)
):
    """
    Create a flashcard from a question's study material
    """
    try:
        # Get study material
        material = await db.get_study_material(question_id)
        
        if not material:
            raise HTTPException(status_code=404, detail="Study material not found")
        
        # Create flashcard
        flashcard = {
            "deck_id": deck_id,
            "student_id": student_id,
            "question_id": question_id,
            "front": material.get("flashcard", {}).get("front", ""),
            "back": material.get("flashcard", {}).get("back", ""),
            "easiness_factor": SM2_INITIAL_EASINESS,
            "repetitions": 0,
            "interval_days": SM2_INITIAL_INTERVAL,
            "next_review": datetime.utcnow(),
            "status": "learning",
            "correct_reviews": 0,
            "incorrect_reviews": 0,
            "created_at": datetime.utcnow(),
            "last_reviewed": None
        }
        
        flashcard_id = await db.insert_flashcard(flashcard)
        
        return {
            "status": "created",
            "flashcard_id": flashcard_id,
            "flashcard": flashcard
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating flashcard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# RECORD FLASHCARD REVIEW (SM-2 Algorithm)
# ============================================================================

@router.post("/{flashcard_id}/review")
async def record_flashcard_review(
    flashcard_id: str,
    request: FlashcardReviewRequest
):
    """
    Record flashcard review using SM-2 spaced repetition algorithm
    
    SM-2 Algorithm:
    - EF (Easiness Factor) - determines difficulty
    - I (Interval) - days until next review
    - N (Repetitions) - number of times reviewed
    
    Quality scale:
    - 0: Complete blackout
    - 1: Incorrect, but correct answer remembered
    - 2: Incorrect, correct answer is familiar
    - 3: Correct answer with serious difficulty
    - 4: Correct answer after hesitation
    - 5: Perfect response
    """
    try:
        from bson import ObjectId
        
        flashcards_col = db.db["flashcards"]
        
        # Get current flashcard
        flashcard = await flashcards_col.find_one({"_id": ObjectId(flashcard_id)})
        
        if not flashcard:
            raise HTTPException(status_code=404, detail="Flashcard not found")
        
        # Convert difficulty string to quality score (0-5)
        quality_mapping = {
            "easy": 5,
            "normal": 4,
            "hard": 2
        }
        quality = quality_mapping.get(request.difficulty, 3)
        
        if not request.is_correct:
            quality = 1  # Incorrect
        
        # SM-2 Algorithm calculation
        ef = flashcard.get("easiness_factor", SM2_INITIAL_EASINESS)
        n = flashcard.get("repetitions", 0)
        i = flashcard.get("interval_days", SM2_INITIAL_INTERVAL)
        
        # Update easiness factor
        ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        ef = max(SM2_MIN_EASINESS, ef)
        
        # Update interval and repetitions
        if quality >= 3:  # Correct or nearly correct
            n += 1
            if n == 1:
                i = 1
            elif n == 2:
                i = 3
            else:
                i = round(i * ef)
        else:  # Incorrect
            n = 0
            i = 1
        
        # Calculate next review date
        next_review = datetime.utcnow() + timedelta(days=i)
        
        # Update flashcard
        update_data = {
            "easiness_factor": ef,
            "repetitions": n,
            "interval_days": i,
            "next_review": next_review,
            "last_reviewed": datetime.utcnow(),
            "status": "mastered" if n >= 5 else "reviewing" if n > 1 else "learning"
        }
        
        if request.is_correct:
            update_data["correct_reviews"] = flashcard.get("correct_reviews", 0) + 1
        else:
            update_data["incorrect_reviews"] = flashcard.get("incorrect_reviews", 0) + 1
        
        success = await db.update_flashcard_review(flashcard_id, update_data)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update flashcard")
        
        return {
            "status": "success",
            "message": "Flashcard review recorded",
            "updated_data": update_data,
            "next_review": next_review.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recording flashcard review: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET FLASHCARD STATISTICS
# ============================================================================

@router.get("/stats/{student_id}")
async def get_flashcard_statistics(student_id: str):
    """
    Get flashcard statistics for a student
    """
    try:
        flashcards_col = db.db["flashcards"]
        
        # Get all flashcards for student
        cursor = flashcards_col.find({"student_id": student_id})
        flashcards = await cursor.to_list(length=None)
        
        if not flashcards:
            return {
                "student_id": student_id,
                "total_cards": 0,
                "statistics": {
                    "learning": 0,
                    "reviewing": 0,
                    "mastered": 0,
                    "total_correct_reviews": 0,
                    "total_incorrect_reviews": 0,
                    "average_easiness": 0,
                    "average_repetitions": 0
                }
            }
        
        # Calculate statistics
        stats = {
            "learning": sum(1 for f in flashcards if f.get("status") == "learning"),
            "reviewing": sum(1 for f in flashcards if f.get("status") == "reviewing"),
            "mastered": sum(1 for f in flashcards if f.get("status") == "mastered"),
            "total_correct_reviews": sum(f.get("correct_reviews", 0) for f in flashcards),
            "total_incorrect_reviews": sum(f.get("incorrect_reviews", 0) for f in flashcards),
            "average_easiness": sum(f.get("easiness_factor", 0) for f in flashcards) / len(flashcards),
            "average_repetitions": sum(f.get("repetitions", 0) for f in flashcards) / len(flashcards)
        }
        
        # Count due cards
        now = datetime.utcnow()
        due_count = sum(1 for f in flashcards if f.get("next_review", now) <= now)
        
        return {
            "student_id": student_id,
            "total_cards": len(flashcards),
            "due_today": due_count,
            "statistics": stats
        }
        
    except Exception as e:
        logger.error(f"Error getting flashcard statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# DELETE FLASHCARD
# ============================================================================

@router.delete("/{flashcard_id}")
async def delete_flashcard(
    flashcard_id: str,
    student_id: str = Query(...)
):
    """
    Delete a flashcard (only by student who owns it)
    """
    try:
        from bson import ObjectId
        
        flashcards_col = db.db["flashcards"]
        
        # Verify ownership
        flashcard = await flashcards_col.find_one({"_id": ObjectId(flashcard_id)})
        
        if not flashcard:
            raise HTTPException(status_code=404, detail="Flashcard not found")
        
        if flashcard.get("student_id") != student_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        # Delete
        result = await flashcards_col.delete_one({"_id": ObjectId(flashcard_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=500, detail="Failed to delete flashcard")
        
        return {
            "status": "success",
            "message": "Flashcard deleted"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting flashcard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET FLASHCARD BY ID
# ============================================================================

@router.get("/card/{flashcard_id}")
async def get_flashcard(flashcard_id: str):
    """
    Get a single flashcard by ID
    """
    try:
        from bson import ObjectId
        
        flashcards_col = db.db["flashcards"]
        flashcard = await flashcards_col.find_one({"_id": ObjectId(flashcard_id)})
        
        if not flashcard:
            raise HTTPException(status_code=404, detail="Flashcard not found")
        
        return flashcard
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting flashcard: {e}")
        raise HTTPException(status_code=500, detail=str(e))
