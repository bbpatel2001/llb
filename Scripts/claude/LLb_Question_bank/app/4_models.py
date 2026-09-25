"""
Pydantic models for data validation
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

# ============================================================================
# QUESTION MODELS
# ============================================================================

class QuestionBase(BaseModel):
    """Base question model"""
    question_number: str
    question_text: str
    subject: str
    year: int
    semester: int
    marks: int
    question_type: str  # Long Answer, Short Answer, MCQ, Case Law, Bare Act
    language: str = "English"
    difficulty: str = "Medium"
    topics: List[str] = []
    is_repeated: bool = False
    similar_questions: List[str] = []

class QuestionCreate(QuestionBase):
    """Create question request"""
    id: str
    paper_code: str

class Question(QuestionCreate):
    """Question response model"""
    class Config:
        from_attributes = True

# ============================================================================
# STUDY MATERIAL MODELS
# ============================================================================

class CaseLaw(BaseModel):
    """Case law reference"""
    name: str
    principle: str
    holding: str
    year: Optional[int] = None
    jurisdiction: Optional[str] = None

class BareAct(BaseModel):
    """Bare act reference"""
    title: str
    sections: List[str]
    summary: str
    relevant_sections: Optional[List[Dict]] = None

class MCQOption(BaseModel):
    """MCQ option"""
    id: str
    question: str
    options: List[str]
    correct_answer: str
    explanation: str

class Flashcard(BaseModel):
    """Flashcard model"""
    front: str
    back: str

class StudyMaterialBase(BaseModel):
    """Base study material model"""
    question_id: str
    long_answer: str
    short_answer: str
    key_points: List[str]
    case_laws: List[CaseLaw] = []
    bare_acts: List[BareAct] = []
    mcq_questions: List[MCQOption] = []
    flashcard: Flashcard
    revision_notes: str

class StudyMaterialCreate(StudyMaterialBase):
    """Create study material request"""
    pass

class StudyMaterial(StudyMaterialCreate):
    """Study material response"""
    class Config:
        from_attributes = True

# ============================================================================
# FLASHCARD MODELS
# ============================================================================

class FlashcardReviewRequest(BaseModel):
    """Request to record flashcard review"""
    is_correct: bool
    time_taken_seconds: int
    difficulty: str  # easy, normal, hard

class FlashcardResponse(BaseModel):
    """Flashcard response"""
    id: str
    front: str
    back: str
    easiness_factor: float
    repetitions: int
    interval_days: int
    next_review: datetime
    status: str

# ============================================================================
# STUDENT PROGRESS MODELS
# ============================================================================

class StudentProgressUpdate(BaseModel):
    """Update student progress"""
    status: str  # not_started, in_progress, completed, mastered
    attempts: Optional[int] = None
    correct_answers: Optional[int] = None
    time_spent_seconds: Optional[int] = None
    rating: Optional[int] = None  # 1-5
    bookmarked: Optional[bool] = None
    notes: Optional[str] = None

class StudentProgress(BaseModel):
    """Student progress response"""
    student_id: str
    question_id: str
    subject: str
    status: str
    attempts: int
    correct_answers: int
    last_attempted: datetime
    time_spent_seconds: int

# ============================================================================
# MCQ MODELS
# ============================================================================

class MCQAttemptRequest(BaseModel):
    """Submit MCQ attempt"""
    mcq_id: str
    selected_answer: str
    time_taken_seconds: int

class MCQAttemptResponse(BaseModel):
    """MCQ attempt response"""
    is_correct: bool
    correct_answer: str
    explanation: str
    score: int

# ============================================================================
# QUIZ MODELS
# ============================================================================

class QuizQuestion(BaseModel):
    """Quiz question"""
    question_id: str
    question_text: str
    options: List[str]
    correct_answer: str

class QuizAttemptRequest(BaseModel):
    """Submit quiz"""
    quiz_id: str
    answers: Dict[str, str]  # question_id -> selected_answer
    time_taken_seconds: int

class QuizResult(BaseModel):
    """Quiz result"""
    total_questions: int
    correct_answers: int
    score: int
    percentage: float
    feedback: str

# ============================================================================
# NOTES MODELS
# ============================================================================

class StudyNote(BaseModel):
    """Study note"""
    id: Optional[str] = None
    student_id: str
    question_id: str
    title: str
    content: str
    subject: str
    color: str = "yellow"  # yellow, blue, green, red, purple
    tags: List[str] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class StudyNoteCreate(BaseModel):
    """Create study note"""
    question_id: str
    title: str
    content: str
    color: str = "yellow"
    tags: List[str] = []

# ============================================================================
# DASHBOARD MODELS
# ============================================================================

class DashboardStats(BaseModel):
    """Dashboard statistics"""
    total_questions: int
    completed_questions: int
    progress_percentage: float
    current_streak: int
    average_score: float
    total_study_time_minutes: int

class SubjectProgress(BaseModel):
    """Progress by subject"""
    subject: str
    total_questions: int
    completed: int
    percentage: float
    average_score: float

# ============================================================================
# SEARCH MODELS
# ============================================================================

class SearchRequest(BaseModel):
    """Search request"""
    query: str
    filters: Optional[Dict] = None
    skip: int = 0
    limit: int = 20

class SearchResult(BaseModel):
    """Search result"""
    total: int
    results: List[Question]

# ============================================================================
# PAGINATION MODELS
# ============================================================================

class PaginatedResponse(BaseModel):
    """Paginated response"""
    total: int
    page: int
    page_size: int
    total_pages: int
    data: List

# ============================================================================
# ERROR MODELS
# ============================================================================

class ErrorResponse(BaseModel):
    """Error response"""
    status: str = "error"
    message: str
    status_code: int
    detail: Optional[str] = None

class SuccessResponse(BaseModel):
    """Success response"""
    status: str = "success"
    message: str
    data: Optional[Dict] = None
