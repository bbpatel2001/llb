"""
MongoDB database connection and operations
"""

from motor.motor_asyncio import AsyncClient, AsyncDatabase
from pymongo import ASCENDING, DESCENDING
import logging
from app.config import MONGODB_URL, DATABASE_NAME, COLLECTIONS

logger = logging.getLogger(__name__)

class Database:
    """MongoDB database manager"""
    
    def __init__(self):
        self.client: AsyncClient = None
        self.db: AsyncDatabase = None
    
    async def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = AsyncClient(MONGODB_URL)
            self.db = self.client[DATABASE_NAME]
            
            # Verify connection
            await self.db.command("ping")
            logger.info(f"Connected to MongoDB: {DATABASE_NAME}")
            
            # Create indexes
            await self._create_indexes()
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    async def check_connection(self) -> bool:
        """Check if connected to MongoDB"""
        try:
            if self.db:
                await self.db.command("ping")
                return True
        except Exception as e:
            logger.error(f"Database connection check failed: {e}")
        return False
    
    async def _create_indexes(self):
        """Create database indexes"""
        try:
            # Questions collection
            questions_col = self.db[COLLECTIONS["questions"]]
            await questions_col.create_index([("id", ASCENDING)], unique=True)
            await questions_col.create_index([("subject", ASCENDING), ("year", DESCENDING)])
            await questions_col.create_index([("year", ASCENDING)])
            await questions_col.create_index([("question_text", "text")])
            
            # Study materials collection
            study_col = self.db[COLLECTIONS["study_materials"]]
            await study_col.create_index([("question_id", ASCENDING)], unique=True)
            await study_col.create_index([("subject", ASCENDING)])
            
            # Flashcards collection
            flashcards_col = self.db[COLLECTIONS["flashcards"]]
            await flashcards_col.create_index([("student_id", ASCENDING), ("deck_id", ASCENDING)])
            await flashcards_col.create_index([("next_review", ASCENDING)])
            
            # Student progress collection
            progress_col = self.db[COLLECTIONS["student_progress"]]
            await progress_col.create_index([("student_id", ASCENDING), ("question_id", ASCENDING)], unique=True)
            await progress_col.create_index([("student_id", ASCENDING)])
            
            # MCQ attempts collection
            mcq_col = self.db[COLLECTIONS["mcq_attempts"]]
            await mcq_col.create_index([("student_id", ASCENDING)])
            await mcq_col.create_index([("attempted_at", DESCENDING)])
            
            # Quiz attempts collection
            quiz_col = self.db[COLLECTIONS["quiz_attempts"]]
            await quiz_col.create_index([("student_id", ASCENDING)])
            
            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.error(f"Failed to create indexes: {e}")
    
    async def get_stats(self) -> dict:
        """Get database statistics"""
        try:
            questions_col = self.db[COLLECTIONS["questions"]]
            study_col = self.db[COLLECTIONS["study_materials"]]
            progress_col = self.db[COLLECTIONS["student_progress"]]
            
            stats = {
                "total_questions": await questions_col.count_documents({}),
                "total_study_materials": await study_col.count_documents({}),
                "total_progress_records": await progress_col.count_documents({}),
                "database": DATABASE_NAME,
                "status": "connected"
            }
            
            return stats
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {"status": "error", "message": str(e)}
    
    # ========================================================================
    # QUESTIONS OPERATIONS
    # ========================================================================
    
    async def get_questions(self, skip: int = 0, limit: int = 20, 
                           subject: str = None, year: int = None) -> list:
        """Get questions with optional filters"""
        query = {}
        
        if subject:
            query["subject"] = subject
        if year:
            query["year"] = year
        
        questions_col = self.db[COLLECTIONS["questions"]]
        cursor = questions_col.find(query).skip(skip).limit(limit)
        
        return await cursor.to_list(length=limit)
    
    async def get_question_by_id(self, question_id: str) -> dict:
        """Get single question by ID"""
        questions_col = self.db[COLLECTIONS["questions"]]
        return await questions_col.find_one({"id": question_id})
    
    async def search_questions(self, query: str, skip: int = 0, limit: int = 20) -> list:
        """Full-text search questions"""
        questions_col = self.db[COLLECTIONS["questions"]]
        cursor = questions_col.find(
            {"$text": {"$search": query}}
        ).skip(skip).limit(limit)
        
        return await cursor.to_list(length=limit)
    
    async def insert_question(self, question: dict) -> str:
        """Insert new question"""
        questions_col = self.db[COLLECTIONS["questions"]]
        result = await questions_col.insert_one(question)
        return str(result.inserted_id)
    
    async def insert_many_questions(self, questions: list) -> int:
        """Insert multiple questions"""
        questions_col = self.db[COLLECTIONS["questions"]]
        result = await questions_col.insert_many(questions, ordered=False)
        return len(result.inserted_ids)
    
    async def get_duplicate_questions(self) -> list:
        """Get questions marked as duplicates"""
        questions_col = self.db[COLLECTIONS["questions"]]
        cursor = questions_col.find({"is_repeated": True})
        return await cursor.to_list(length=None)
    
    # ========================================================================
    # STUDY MATERIALS OPERATIONS
    # ========================================================================
    
    async def get_study_material(self, question_id: str) -> dict:
        """Get study material for a question"""
        study_col = self.db[COLLECTIONS["study_materials"]]
        return await study_col.find_one({"question_id": question_id})
    
    async def insert_study_material(self, material: dict) -> str:
        """Insert study material"""
        study_col = self.db[COLLECTIONS["study_materials"]]
        result = await study_col.insert_one(material)
        return str(result.inserted_id)
    
    async def get_long_answer(self, question_id: str) -> str:
        """Get long answer for a question"""
        study_col = self.db[COLLECTIONS["study_materials"]]
        doc = await study_col.find_one(
            {"question_id": question_id},
            {"long_answer": 1}
        )
        return doc.get("long_answer") if doc else None
    
    async def get_short_answer(self, question_id: str) -> str:
        """Get short answer for a question"""
        study_col = self.db[COLLECTIONS["study_materials"]]
        doc = await study_col.find_one(
            {"question_id": question_id},
            {"short_answer": 1}
        )
        return doc.get("short_answer") if doc else None
    
    # ========================================================================
    # FLASHCARDS OPERATIONS
    # ========================================================================
    
    async def get_due_flashcards(self, student_id: str, limit: int = 10) -> list:
        """Get flashcards due for review"""
        from datetime import datetime
        flashcards_col = self.db[COLLECTIONS["flashcards"]]
        
        cursor = flashcards_col.find({
            "student_id": student_id,
            "next_review": {"$lte": datetime.utcnow()}
        }).limit(limit)
        
        return await cursor.to_list(length=limit)
    
    async def insert_flashcard(self, flashcard: dict) -> str:
        """Insert new flashcard"""
        flashcards_col = self.db[COLLECTIONS["flashcards"]]
        result = await flashcards_col.insert_one(flashcard)
        return str(result.inserted_id)
    
    async def update_flashcard_review(self, flashcard_id: str, update_data: dict) -> bool:
        """Update flashcard after review"""
        from bson import ObjectId
        flashcards_col = self.db[COLLECTIONS["flashcards"]]
        
        result = await flashcards_col.update_one(
            {"_id": ObjectId(flashcard_id)},
            {"$set": update_data}
        )
        
        return result.modified_count > 0
    
    # ========================================================================
    # STUDENT PROGRESS OPERATIONS
    # ========================================================================
    
    async def get_student_progress(self, student_id: str) -> list:
        """Get student's progress on all questions"""
        progress_col = self.db[COLLECTIONS["student_progress"]]
        cursor = progress_col.find({"student_id": student_id})
        return await cursor.to_list(length=None)
    
    async def get_progress_by_subject(self, student_id: str, subject: str) -> list:
        """Get student's progress on a specific subject"""
        progress_col = self.db[COLLECTIONS["student_progress"]]
        cursor = progress_col.find({
            "student_id": student_id,
            "subject": subject
        })
        return await cursor.to_list(length=None)
    
    async def update_progress(self, student_id: str, question_id: str, 
                             update_data: dict) -> bool:
        """Update student progress on a question"""
        progress_col = self.db[COLLECTIONS["student_progress"]]
        
        result = await progress_col.update_one(
            {"student_id": student_id, "question_id": question_id},
            {"$set": update_data},
            upsert=True
        )
        
        return result.modified_count > 0 or result.upserted_id is not None
    
    async def get_dashboard_stats(self, student_id: str) -> dict:
        """Get student dashboard statistics"""
        progress_col = self.db[COLLECTIONS["student_progress"]]
        
        completed = await progress_col.count_documents({
            "student_id": student_id,
            "status": "completed"
        })
        
        total = await progress_col.count_documents({
            "student_id": student_id
        })
        
        return {
            "total_questions": total,
            "completed_questions": completed,
            "progress_percentage": (completed / total * 100) if total > 0 else 0
        }

# ============================================================================
# GLOBAL DATABASE INSTANCE
# ============================================================================

db = Database()
