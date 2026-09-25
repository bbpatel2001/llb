"""
Admin API routes for content management
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
import logging
import json
from app.database import db

logger = logging.getLogger(__name__)

router = APIRouter()

# ============================================================================
# IMPORT QUESTIONS FROM JSON
# ============================================================================

@router.post("/import/questions")
async def import_questions(file: UploadFile = File(...)):
    """
    Import questions from JSON file
    
    JSON format:
    [
        {
            "id": "2024_Torts_1",
            "question_number": "1",
            "question_text": "...",
            "subject": "Law of Torts",
            "year": 2024,
            "semester": 1,
            "marks": 20,
            ...
        }
    ]
    """
    try:
        # Read file
        content = await file.read()
        questions = json.loads(content)
        
        if not isinstance(questions, list):
            raise HTTPException(status_code=400, detail="JSON must be an array of questions")
        
        # Insert questions
        count = await db.insert_many_questions(questions)
        
        return {
            "status": "success",
            "message": f"Imported {count} questions",
            "imported_count": count
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
    except Exception as e:
        logger.error(f"Error importing questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# IMPORT STUDY MATERIALS FROM JSON
# ============================================================================

@router.post("/import/study-materials")
async def import_study_materials(file: UploadFile = File(...)):
    """
    Import study materials from JSON file
    """
    try:
        content = await file.read()
        materials = json.loads(content)
        
        if not isinstance(materials, list):
            raise HTTPException(status_code=400, detail="JSON must be an array of materials")
        
        study_col = db.db["study_materials"]
        result = await study_col.insert_many(materials, ordered=False)
        
        return {
            "status": "success",
            "message": f"Imported {len(result.inserted_ids)} study materials",
            "imported_count": len(result.inserted_ids)
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
    except Exception as e:
        logger.error(f"Error importing study materials: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# EXPORT DATA
# ============================================================================

@router.get("/export/questions")
async def export_questions():
    """
    Export all questions as JSON
    """
    try:
        questions_col = db.db["questions"]
        cursor = questions_col.find({})
        questions = await cursor.to_list(length=None)
        
        # Convert ObjectId to string
        for q in questions:
            if "_id" in q:
                q["_id"] = str(q["_id"])
        
        return {
            "status": "success",
            "total": len(questions),
            "data": questions
        }
        
    except Exception as e:
        logger.error(f"Error exporting questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/study-materials")
async def export_study_materials():
    """
    Export all study materials as JSON
    """
    try:
        study_col = db.db["study_materials"]
        cursor = study_col.find({})
        materials = await cursor.to_list(length=None)
        
        # Convert ObjectId to string
        for m in materials:
            if "_id" in m:
                m["_id"] = str(m["_id"])
        
        return {
            "status": "success",
            "total": len(materials),
            "data": materials
        }
        
    except Exception as e:
        logger.error(f"Error exporting study materials: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# DATABASE STATISTICS
# ============================================================================

@router.get("/stats")
async def get_database_stats():
    """
    Get overall database statistics
    """
    try:
        questions_col = db.db["questions"]
        study_col = db.db["study_materials"]
        progress_col = db.db["student_progress"]
        flashcards_col = db.db["flashcards"]
        
        stats = {
            "questions": {
                "total": await questions_col.count_documents({}),
                "by_subject": await questions_col.distinct("subject"),
                "by_year": sorted(await questions_col.distinct("year"), reverse=True)
            },
            "study_materials": {
                "total": await study_col.count_documents({})
            },
            "student_progress": {
                "total_records": await progress_col.count_documents({}),
                "unique_students": len(await progress_col.distinct("student_id"))
            },
            "flashcards": {
                "total": await flashcards_col.count_documents({})
            }
        }
        
        return {
            "status": "success",
            "statistics": stats
        }
        
    except Exception as e:
        logger.error(f"Error getting statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# DELETE QUESTION AND RELATED DATA
# ============================================================================

@router.delete("/questions/{question_id}")
async def delete_question_and_related(question_id: str):
    """
    Delete a question and all its related data
    (study materials, student progress, flashcards)
    """
    try:
        questions_col = db.db["questions"]
        study_col = db.db["study_materials"]
        progress_col = db.db["student_progress"]
        flashcards_col = db.db["flashcards"]
        
        # Delete question
        q_result = await questions_col.delete_one({"id": question_id})
        
        # Delete related data
        s_result = await study_col.delete_one({"question_id": question_id})
        p_result = await progress_col.delete_many({"question_id": question_id})
        f_result = await flashcards_col.delete_many({"question_id": question_id})
        
        return {
            "status": "success",
            "deleted": {
                "questions": q_result.deleted_count,
                "study_materials": s_result.deleted_count,
                "progress_records": p_result.deleted_count,
                "flashcards": f_result.deleted_count
            }
        }
        
    except Exception as e:
        logger.error(f"Error deleting question: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# UPDATE QUESTION
# ============================================================================

@router.put("/questions/{question_id}")
async def update_question(question_id: str, update_data: dict):
    """
    Update a question
    """
    try:
        questions_col = db.db["questions"]
        
        result = await questions_col.update_one(
            {"id": question_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Question not found")
        
        return {
            "status": "success",
            "message": "Question updated",
            "modified_count": result.modified_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating question: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# UPDATE STUDY MATERIAL
# ============================================================================

@router.put("/study-materials/{question_id}")
async def update_study_material(question_id: str, update_data: dict):
    """
    Update study material for a question
    """
    try:
        study_col = db.db["study_materials"]
        
        result = await study_col.update_one(
            {"question_id": question_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Study material not found")
        
        return {
            "status": "success",
            "message": "Study material updated",
            "modified_count": result.modified_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating study material: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/health")
async def health_check():
    """
    Check admin API health
    """
    try:
        is_connected = await db.check_connection()
        
        return {
            "status": "healthy" if is_connected else "unhealthy",
            "database": "connected" if is_connected else "disconnected"
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# DATABASE MAINTENANCE
# ============================================================================

@router.post("/maintenance/cleanup-duplicates")
async def cleanup_duplicate_records():
    """
    Remove duplicate flashcard or progress records
    """
    try:
        progress_col = db.db["student_progress"]
        
        # Find and keep only latest version of duplicates
        pipeline = [
            {"$group": {
                "_id": {"student_id": "$student_id", "question_id": "$question_id"},
                "ids": {"$push": "$_id"},
                "count": {"$sum": 1}
            }},
            {"$match": {"count": {"$gt": 1}}}
        ]
        
        duplicates = await progress_col.aggregate(pipeline).to_list(None)
        
        deleted_count = 0
        for dup in duplicates:
            ids = dup["ids"][1:]  # Keep first, delete rest
            result = await progress_col.delete_many({"_id": {"$in": ids}})
            deleted_count += result.deleted_count
        
        return {
            "status": "success",
            "message": f"Cleaned up {deleted_count} duplicate records"
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up duplicates: {e}")
        raise HTTPException(status_code=500, detail=str(e))
