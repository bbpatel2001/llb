/**
 * MongoDB Schema Design for LLB Question Bank & Study Materials
 * Database: llb_question_bank
 */

// ============================================================================
// COLLECTION 1: questions
// ============================================================================
// Stores extracted exam questions
db.createCollection("questions");

db.questions.createIndex({ "subject": 1, "year": 1 });
db.questions.createIndex({ "year": 1 });
db.questions.createIndex({ "question_text": "text" });
db.questions.createIndex({ "id": 1 }, { unique: true });

// Example Document
{
  "_id": ObjectId("..."),
  "id": "2014_Law_of_Torts_1",
  "paper_code": "101 Law of Torts",
  "question_number": "1",
  "question_text": "Define tort and explain its elements...",
  "subject": "Law of Torts",
  "year": 2014,
  "semester": 1,
  "marks": 20,
  "question_type": "Long Answer",  // Long Answer, Short Answer, MCQ, Case Law, Bare Act
  "language": "Mixed",  // English, Gujarati, Mixed
  "difficulty": "Medium",  // Easy, Medium, Hard
  "topics": ["Negligence", "Duty of Care", "Breach"],
  "raw_marks": "20 Marks",
  "is_repeated": false,
  "similar_questions": ["2015_Law_of_Torts_2", "2017_Law_of_Torts_1"],
  "created_at": ISODate("2024-07-25T10:00:00Z"),
  "updated_at": ISODate("2024-07-25T10:00:00Z")
}

// ============================================================================
// COLLECTION 2: study_materials
// ============================================================================
// Stores generated study materials for each question
db.createCollection("study_materials");

db.study_materials.createIndex({ "question_id": 1 }, { unique: true });
db.study_materials.createIndex({ "subject": 1 });

{
  "_id": ObjectId("..."),
  "question_id": "2014_Law_of_Torts_1",
  "question_text": "Define tort and explain its elements...",
  "subject": "Law of Torts",
  "year": 2014,
  "marks": 20,
  
  // Generated Answers
  "long_answer": "COMPREHENSIVE ANSWER (20 Marks)\n\nIntroduction:\n...",
  "short_answer": "SHORT ANSWER (8 Marks)\n\nTort is defined as...",
  
  // Key Information
  "key_points": ["Negligence", "Duty of Care", "Breach", "Damages"],
  
  // Related Legal References
  "case_laws": [
    {
      "name": "Donoghue v Stevenson",
      "principle": "Duty of Care",
      "holding": "Manufacturers owe a duty of care to consumers",
      "year": 1932,
      "jurisdiction": "UK"
    },
    {
      "name": "Rylands v Fletcher",
      "principle": "Strict Liability",
      "holding": "Liability for escape of dangerous things",
      "year": 1865,
      "jurisdiction": "UK"
    }
  ],
  
  "bare_acts": [
    {
      "title": "Indian Tort Law",
      "sections": ["Chapter 1", "Chapter 2"],
      "summary": "Establishes principles of tortious liability",
      "relevant_sections": [
        { "number": "1", "description": "Definition of tort" },
        { "number": "2", "description": "Elements of liability" }
      ]
    },
    {
      "title": "Motor Vehicles Act, 1988",
      "sections": ["Section 140-146"],
      "summary": "Regulates motor vehicle accidents"
    }
  ],
  
  // MCQ Questions
  "mcq_questions": [
    {
      "id": "mcq_1",
      "question": "Which case established the principle of duty of care?",
      "options": [
        "A) Rylands v Fletcher",
        "B) Donoghue v Stevenson",
        "C) Caswell v Powell",
        "D) Tort Law, 1972"
      ],
      "correct_answer": "B",
      "explanation": "Donoghue v Stevenson established the principle that manufacturers owe duty of care to consumers"
    }
  ],
  
  // Flashcard
  "flashcard": {
    "front": "What is tort?",
    "back": "A tort is a civil wrong (other than breach of contract) which is committed against another person. Elements: Duty, Breach, Causation, Damage"
  },
  
  // Revision Notes
  "revision_notes": "REVISION NOTES\n\n📌 DEFINITION:\n...\n📋 ELEMENTS:\n...",
  
  "created_at": ISODate("2024-07-25T10:00:00Z"),
  "updated_at": ISODate("2024-07-25T10:00:00Z")
}

// ============================================================================
// COLLECTION 3: students_progress
// ============================================================================
// Tracks student learning progress
db.createCollection("students_progress");

db.students_progress.createIndex({ "student_id": 1, "question_id": 1 }, { unique: true });
db.students_progress.createIndex({ "student_id": 1 });

{
  "_id": ObjectId("..."),
  "student_id": "STU001",
  "student_name": "John Doe",
  "question_id": "2014_Law_of_Torts_1",
  "subject": "Law of Torts",
  "status": "in_progress",  // not_started, in_progress, completed, mastered
  "attempts": 2,
  "correct_answers": 1,
  "last_attempted": ISODate("2024-07-25T15:30:00Z"),
  "time_spent_seconds": 450,  // 7.5 minutes
  "notes": "Need to review strict liability concept",
  "rating": 4,  // Self-rating 1-5
  "bookmarked": true,
  "created_at": ISODate("2024-07-25T10:00:00Z")
}

// ============================================================================
// COLLECTION 4: flashcards
// ============================================================================
// Dedicated flashcard collection for spaced repetition
db.createCollection("flashcards");

db.flashcards.createIndex({ "student_id": 1, "deck_id": 1 });
db.flashcards.createIndex({ "next_review": 1 });

{
  "_id": ObjectId("..."),
  "deck_id": "2014_Torts_Flashcards",
  "student_id": "STU001",
  "question_id": "2014_Law_of_Torts_1",
  "front": "What is tort?",
  "back": "A civil wrong (other than breach of contract) which gives the injured person a right of action",
  
  // Spaced Repetition (SM-2 Algorithm)
  "easiness_factor": 2.5,
  "repetitions": 3,
  "interval_days": 7,
  "next_review": ISODate("2024-08-01T10:00:00Z"),
  
  "status": "learning",  // learning, reviewing, mastered
  "correct_reviews": 2,
  "incorrect_reviews": 0,
  
  "created_at": ISODate("2024-07-25T10:00:00Z"),
  "last_reviewed": ISODate("2024-07-25T10:00:00Z")
}

// ============================================================================
// COLLECTION 5: mcq_attempts
// ============================================================================
// Tracks MCQ question attempts
db.createCollection("mcq_attempts");

db.mcq_attempts.createIndex({ "student_id": 1, "question_id": 1 });

{
  "_id": ObjectId("..."),
  "student_id": "STU001",
  "mcq_id": "2014_Torts_MCQ_1",
  "question_id": "2014_Law_of_Torts_1",
  "subject": "Law of Torts",
  "question_text": "Which case established duty of care?",
  "selected_answer": "B",
  "correct_answer": "B",
  "is_correct": true,
  "time_taken_seconds": 45,
  "options": [
    "A) Rylands v Fletcher",
    "B) Donoghue v Stevenson",
    "C) Caswell v Powell",
    "D) Tort Law"
  ],
  "difficulty": "Medium",
  "attempted_at": ISODate("2024-07-25T15:30:00Z")
}

// ============================================================================
// COLLECTION 6: student_goals
// ============================================================================
// Tracks student learning goals
db.createCollection("student_goals");

{
  "_id": ObjectId("..."),
  "student_id": "STU001",
  "goal_name": "Complete Torts Chapter",
  "subject": "Law of Torts",
  "target_questions": 50,
  "target_score": 80,
  "deadline": ISODate("2024-12-31T23:59:59Z"),
  "status": "in_progress",
  "progress_percentage": 35,
  "questions_completed": 18,
  "current_score": 72,
  "created_at": ISODate("2024-07-25T10:00:00Z")
}

// ============================================================================
// COLLECTION 7: study_notes
// ============================================================================
// Stores user-created study notes
db.createCollection("study_notes");

{
  "_id": ObjectId("..."),
  "student_id": "STU001",
  "question_id": "2014_Law_of_Torts_1",
  "subject": "Law of Torts",
  "note_title": "Duty of Care Concept",
  "note_content": "Personal notes on the concept...",
  "tags": ["important", "review_needed", "examination"],
  "color": "yellow",  // Color-coded notes
  "created_at": ISODate("2024-07-25T10:00:00Z"),
  "updated_at": ISODate("2024-07-25T10:00:00Z")
}

// ============================================================================
// COLLECTION 8: quiz_attempts
// ============================================================================
// Tracks quiz/test attempts
db.createCollection("quiz_attempts");

{
  "_id": ObjectId("..."),
  "quiz_id": "2014_Torts_Quiz_1",
  "student_id": "STU001",
  "subject": "Law of Torts",
  "total_questions": 10,
  "correct_answers": 8,
  "score": 80,
  "time_taken_seconds": 600,  // 10 minutes
  "status": "completed",
  "questions_attempted": [
    { "question_id": "...", "correct": true },
    { "question_id": "...", "correct": false }
  ],
  "completed_at": ISODate("2024-07-25T15:30:00Z"),
  "feedback": "Good performance! Review the 2 incorrect questions."
}

// ============================================================================
// INDEXING STRATEGY
// ============================================================================

// Search indexes for full-text search
db.questions.createIndex({ "question_text": "text", "subject": "text" });

// Compound indexes for frequent queries
db.study_materials.createIndex({ "subject": 1, "year": -1 });
db.students_progress.createIndex({ "student_id": 1, "subject": 1, "status": 1 });
db.flashcards.createIndex({ "student_id": 1, "next_review": 1 });

// ============================================================================
// SAMPLE QUERIES
// ============================================================================

// Find all questions for a subject
db.questions.find({ "subject": "Law of Torts" }).sort({ "year": -1 });

// Find repeated questions
db.questions.find({ "is_repeated": true });

// Find study materials with case laws
db.study_materials.find({ "case_laws": { $exists: true, $ne: [] } });

// Find flashcards due for review
db.flashcards.find({ 
  "student_id": "STU001",
  "next_review": { $lte: new Date() }
});

// Get student's subject-wise progress
db.students_progress.aggregate([
  { $match: { "student_id": "STU001" } },
  { $group: {
    _id: "$subject",
    total_attempted: { $sum: 1 },
    completed: { $sum: { $cond: ["$status", 1, 0] } },
    average_score: { $avg: "$correct_answers" }
  }}
]);

// Find MCQ performance by difficulty
db.mcq_attempts.aggregate([
  { $match: { "student_id": "STU001" } },
  { $group: {
    _id: "$difficulty",
    total: { $sum: 1 },
    correct: { $sum: { $cond: ["$is_correct", 1, 0] } },
    percentage: { $avg: { $cond: ["$is_correct", 100, 0] } }
  }}
]);

// ============================================================================
