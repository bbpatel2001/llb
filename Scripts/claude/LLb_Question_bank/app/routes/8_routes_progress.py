"""
Student progress tracking API routes
"""

from fastapi import APIRouter, HTTPException, Query
from datetime import datetime
import logging
from app.database import db
from app.models import StudentProgressUpdate

logger = logging.getLogger(__name__)

router = APIRouter()

# ============================================================================
# GET STUDENT DASHBOARD
# ============================================================================

@router.get("/dashboard/{student_id}")
async def get_student_dashboard(student_id: str):
    """
    Get student dashboard with overall statistics
    """
    try:
        progress_col = db.db["student_progress"]
        
        # Get all progress records
        all_progress = await db.get_student_progress(student_id)
        
        # Calculate statistics
        completed = sum(1 for p in all_progress if p.get("status") == "completed")
        total = len(all_progress)
        
        # Group by subject
        by_subject = {}
        for p in all_progress:
            subject = p.get("subject", "Unknown")
            if subject not in by_subject:
                by_subject[subject] = {"completed": 0, "total": 0}
            by_subject[subject]["total"] += 1
            if p.get("status") == "completed":
                by_subject[subject]["completed"] += 1
        
        # Calculate average score
        avg_attempts = sum(p.get("attempts", 0) for p in all_progress) / len(all_progress) if all_progress else 0
        
        # Calculate total study time
        total_study_time = sum(p.get("time_spent_seconds", 0) for p in all_progress)
        
        return {
            "student_id": student_id,
            "total_questions": total,
            "completed_questions": completed,
            "progress_percentage": (completed / total * 100) if total > 0 else 0,
            "average_attempts": avg_attempts,
            "total_study_time_minutes": int(total_study_time / 60),
            "by_subject": by_subject
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET PROGRESS BY SUBJECT
# ============================================================================

@router.get("/subject/{student_id}/{subject}")
async def get_progress_by_subject(student_id: str, subject: str):
    """
    Get student's progress on a specific subject
    """
    try:
        progress = await db.get_progress_by_subject(student_id, subject)
        
        if not progress:
            raise HTTPException(status_code=404, detail="No progress found for this subject")
        
        # Calculate statistics
        completed = sum(1 for p in progress if p.get("status") == "completed")
        total = len(progress)
        
        avg_score = sum(p.get("correct_answers", 0) for p in progress) / len(progress) if progress else 0
        
        return {
            "student_id": student_id,
            "subject": subject,
            "total_questions": total,
            "completed": completed,
            "progress_percentage": (completed / total * 100) if total > 0 else 0,
            "average_score": avg_score,
            "progress": progress
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting subject progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET SINGLE QUESTION PROGRESS
# ============================================================================

@router.get("/{student_id}/{question_id}")
async def get_question_progress(student_id: str, question_id: str):
    """
    Get student's progress on a specific question
    """
    try:
        progress_col = db.db["student_progress"]
        progress = await progress_col.find_one({
            "student_id": student_id,
            "question_id": question_id
        })
        
        if not progress:
            # Return default progress if not found
            return {
                "student_id": student_id,
                "question_id": question_id,
                "status": "not_started",
                "attempts": 0,
                "correct_answers": 0,
                "time_spent_seconds": 0,
                "rating": 0,
                "bookmarked": False
            }
        
        return progress
        
    except Exception as e:
        logger.error(f"Error getting question progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# UPDATE QUESTION PROGRESS
# ============================================================================

@router.put("/{student_id}/{question_id}")
async def update_question_progress(
    student_id: str,
    question_id: str,
    update: StudentProgressUpdate
):
    """
    Update student's progress on a question
    
    Can update:
    - status (not_started, in_progress, completed, mastered)
    - attempts count
    - correct answers count
    - time spent
    - rating (1-5)
    - bookmarked
    - notes
    """
    try:
        # Get current progress
        progress_col = db.db["student_progress"]
        current = await progress_col.find_one({
            "student_id": student_id,
            "question_id": question_id
        })
        
        # Get question details
        questions_col = db.db["questions"]
        question = await questions_col.find_one({"id": question_id})
        
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        # Prepare update data
        update_data = {
            "student_id": student_id,
            "question_id": question_id,
            "subject": question.get("subject"),
            "updated_at": datetime.utcnow()
        }
        
        # Add optional fields if provided
        if update.status:
            update_data["status"] = update.status
        if update.attempts is not None:
            update_data["attempts"] = update.attempts
        if update.correct_answers is not None:
            update_data["correct_answers"] = update.correct_answers
        if update.time_spent_seconds is not None:
            update_data["time_spent_seconds"] = update.time_spent_seconds
        if update.rating is not None:
            if not (1 <= update.rating <= 5):
                raise HTTPException(status_code=400, detail="Rating must be between 1-5")
            update_data["rating"] = update.rating
        if update.bookmarked is not None:
            update_data["bookmarked"] = update.bookmarked
        if update.notes:
            update_data["notes"] = update.notes
        
        if not current:
            # Create new progress record
            update_data["created_at"] = datetime.utcnow()
            update_data["last_attempted"] = datetime.utcnow()
            result = await progress_col.insert_one(update_data)
            return {
                "status": "created",
                "progress": update_data
            }
        else:
            # Update existing progress
            update_data["last_attempted"] = datetime.utcnow()
            result = await progress_col.update_one(
                {"student_id": student_id, "question_id": question_id},
                {"$set": update_data}
            )
            
            if result.modified_count == 0:
                raise HTTPException(status_code=500, detail="Failed to update progress")
            
            return {
                "status": "updated",
                "progress": update_data
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET COMPLETED QUESTIONS
# ============================================================================

@router.get("/completed/{student_id}")
async def get_completed_questions(
    student_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get all completed questions for a student
    """
    try:
        progress_col = db.db["student_progress"]
        
        cursor = progress_col.find({
            "student_id": student_id,
            "status": "completed"
        }).skip(skip).limit(limit)
        
        completed = await cursor.to_list(length=limit)
        total = await progress_col.count_documents({
            "student_id": student_id,
            "status": "completed"
        })
        
        return {
            "student_id": student_id,
            "total": total,
            "completed": completed
        }
        
    except Exception as e:
        logger.error(f"Error getting completed questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET WEAK AREAS (Questions with low scores)
# ============================================================================

@router.get("/weak-areas/{student_id}")
async def get_weak_areas(student_id: str):
    """
    Get areas where student is struggling (low accuracy)
    """
    try:
        progress_col = db.db["student_progress"]
        
        # Aggregate to get subjects with low average score
        pipeline = [
            {"$match": {"student_id": student_id}},
            {"$group": {
                "_id": "$subject",
                "avg_correct": {"$avg": {"$divide": [
                    "$correct_answers",
                    {"$cond": [
                        {"$eq": ["$attempts", 0]},
                        1,
                        "$attempts"
                    ]}
                ]}},
                "total_questions": {"$sum": 1}
            }},
            {"$sort": {"avg_correct": 1}},
            {"$limit": 5}
        ]
        
        weak_areas = await progress_col.aggregate(pipeline).to_list(None)
        
        return {
            "student_id": student_id,
            "weak_areas": weak_areas
        }
        
    except Exception as e:
        logger.error(f"Error getting weak areas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# GET STUDY STREAK
# ============================================================================

@router.get("/streak/{student_id}")
async def get_study_streak(student_id: str):
    """
    Get student's current study streak (consecutive days studied)
    """
    try:
        progress_col = db.db["student_progress"]
        
        # Get unique dates when student studied
        pipeline = [
            {"$match": {"student_id": student_id}},
            {"$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$last_attempted"
                    }
                }
            }},
            {"$sort": {"_id": -1}}
        ]
        
        study_dates = await progress_col.aggregate(pipeline).to_list(None)
        
        if not study_dates:
            return {
                "student_id": student_id,
                "current_streak": 0,
                "longest_streak": 0
            }
        
        # Calculate streaks
        from datetime import datetime, timedelta
        
        current_streak = 1
        longest_streak = 1
        temp_streak = 1
        
        study_dates_sorted = [d["_id"] for d in study_dates]
        
        for i in range(1, len(study_dates_sorted)):
            current_date = datetime.strptime(study_dates_sorted[i-1], "%Y-%m-%d")
            prev_date = datetime.strptime(study_dates_sorted[i], "%Y-%m-%d")
            
            if (current_date - prev_date).days == 1:
                temp_streak += 1
            else:
                longest_streak = max(longest_streak, temp_streak)
                temp_streak = 1
        
        longest_streak = max(longest_streak, temp_streak)
        
        # Check if streak is still active (last study was today or yesterday)
        last_study_date = datetime.strptime(study_dates_sorted[0], "%Y-%m-%d")
        today = datetime.utcnow()
        days_since = (today - last_study_date).days
        
        if days_since > 1:
            current_streak = 0
        else:
            current_streak = temp_streak
        
        return {
            "student_id": student_id,
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "last_study_date": study_dates_sorted[0]
        }
        
    except Exception as e:
        logger.error(f"Error getting study streak: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# RESET PROGRESS
# ============================================================================

@router.post("/reset/{student_id}")
async def reset_progress(student_id: str):
    """
    Reset student's progress (delete all progress records)
    """
    try:
        progress_col = db.db["student_progress"]
        
        result = await progress_col.delete_many({"student_id": student_id})
        
        return {
            "status": "success",
            "message": f"Deleted {result.deleted_count} progress records"
        }
        
    except Exception as e:
        logger.error(f"Error resetting progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))
