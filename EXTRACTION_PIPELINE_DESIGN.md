# Question Extraction Pipeline Design

**Objective**: Extract questions from PDF papers → Parse → Store in DB → Serve via API

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      PDF Question Papers                         │
│              (papers/LLB_Papers/Semester-N/)                     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              PDF Text Extraction (pdfplumber)                    │
│  Extract text → Clean → Identify question boundaries             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              Question Parser & Classifier                        │
│  - Identify question type (short/long/MCQ/case study)            │
│  - Extract question text                                         │
│  - Extract marks/points                                          │
│  - Detect subject area                                           │
│  - Group related questions                                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              Data Validation & Enrichment                        │
│  - Validate extracted data                                       │
│  - AI-powered subject classification (optional)                  │
│  - Duplicate detection                                           │
│  - Quality scoring                                               │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              MongoDB Database Storage                            │
│  Collections: Papers, Questions, Subjects, Metadata              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              Backend API (Express/Node.js)                       │
│  GET /api/questions?semester=1&subject=TORTS&type=SHORT         │
│  GET /api/questions/:id                                         │
│  GET /api/papers/:id/questions                                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              Frontend Application (Next.js/React)                │
│  Display questions properly formatted                            │
│  Study materials generated from questions                        │
│  Search & filter functionality                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### Collections

#### 1. **Papers**
```javascript
{
  _id: ObjectId,
  semester: 1-6,
  subject: "TORTS" | "CRIMINAL" | etc,
  title: "Law of Torts - 2020 (GU)",
  fileName: "Sem1_TORTS_101 Law of Torts including M.V. Accident.pdf",
  year: 2020,
  university: "GU" | "TRICHY" | etc,
  totalQuestions: 25,
  totalMarks: 100,
  extractedAt: Date,
  status: "PROCESSING" | "COMPLETED" | "FAILED",
  extractionNotes: "Successfully extracted 25 questions",
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. **Questions**
```javascript
{
  _id: ObjectId,
  paperId: ObjectId,           // Reference to Paper
  semester: 1-6,
  subject: "TORTS",
  questionNumber: "1(a)",      // From paper format
  type: "SHORT" | "LONG" | "MCQ" | "CASE_STUDY" | "DESCRIPTIVE",
  marks: 2 | 5 | 10 | 15,
  questionText: "Explain the concept of negligence...",
  options: [                   // Only for MCQ
    { label: "A", text: "Option A" },
    { label: "B", text: "Option B" },
    ...
  ],
  correctAnswer: "A",          // Only for MCQ
  difficulty: "EASY" | "MEDIUM" | "HARD",
  tags: ["tort", "negligence", "breach_of_duty"],
  source: {
    fileName: "Sem1_TORTS_101...",
    year: 2020,
    university: "GU"
  },
  extractionQuality: 0-100,    // Confidence score
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. **ExtractionLogs**
```javascript
{
  _id: ObjectId,
  paperId: ObjectId,
  fileName: "Sem1_TORTS_101...",
  semester: 1,
  subject: "TORTS",
  status: "SUCCESS" | "PARTIAL" | "FAILED",
  questionCount: {
    found: 25,
    parsed: 23,
    stored: 23
  },
  errors: ["Failed to parse question 5", ...],
  duration: 45000,            // milliseconds
  startedAt: Date,
  completedAt: Date
}
```

#### 4. **Subjects** (Reference)
```javascript
{
  _id: ObjectId,
  name: "TORTS",
  displayName: "Law of Torts",
  semesters: [1, 2, 3],       // Which semesters have this
  questionsCount: 245,
  papersCount: 12,
  description: "Study of civil wrongs...",
  keywords: ["tort", "negligence", "defamation", ...]
}
```

---

## 🔄 Extraction Process Flow

### Phase 1: PDF Text Extraction
```python
import pdfplumber

def extract_text_from_pdf(pdf_path):
    """Extract all text from PDF"""
    with pdfplumber.open(pdf_path) as pdf:
        text = ""
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text
```

### Phase 2: Question Detection
```python
def detect_questions(text):
    """
    Identify question boundaries
    Patterns to look for:
    - Question numbers (1, 1(a), Q.1, Question 1)
    - Common question markers (Explain, Define, Discuss, etc)
    - Answer marks (2 marks, (5), [10] marks)
    """
    questions = []
    # Parse questions with regex/NLP
    return questions
```

### Phase 3: Question Classification
```python
def classify_question(question_text):
    """
    Determine question type:
    - SHORT ANSWER: "State", "Define", "Name" (2-5 marks)
    - LONG ANSWER: "Discuss", "Explain in detail" (10+ marks)
    - MCQ: Has options A/B/C/D
    - CASE STUDY: Long scenario then questions
    - DESCRIPTIVE: Mixed content
    """
    if has_options(question_text):
        return "MCQ"
    elif is_long_question(question_text):
        return "LONG"
    elif is_short_question(question_text):
        return "SHORT"
    # ... etc
```

### Phase 4: Data Storage
```python
def store_questions(questions, paper_id):
    """
    Store in MongoDB:
    1. Create Paper document
    2. Create Question documents (bulk insert)
    3. Create ExtractionLog
    4. Update Subject counts
    """
    paper = db.papers.insert_one({
        "paperId": paper_id,
        "totalQuestions": len(questions),
        ...
    })
    
    db.questions.insert_many(questions)
    
    db.extractionLogs.insert_one({
        "paperId": paper_id,
        "status": "SUCCESS",
        ...
    })
```

---

## 🛠️ Implementation Stack

### Tools Required
```
PDF Processing:    pdfplumber, PyPDF2
Text Processing:   NLTK, spaCy, regex
Data Validation:   Pydantic, jsonschema
Database:          MongoDB, Mongoose (Node.js)
Backend:           Express, Node.js, TypeScript
API:               RESTful with pagination
```

### Installation
```bash
# Python
pip install pdfplumber nltk spacy pymongo pydantic

# Node.js
npm install mongoose express typescript

# Download NLP models
python -m spacy download en_core_web_sm
```

---

## 📝 Extraction Scenarios

### Scenario 1: Simple Question Paper
```
Question 1: Define negligence. (2 marks)
Answer: Negligence is the breach of duty of care...

Question 2: Explain the concept of tort. (5 marks)
Answer: A tort is a civil wrong...

Question 3: Discuss the role of tort law. (10 marks)
Answer: Tort law plays a crucial role...
```

**Extraction Logic**:
- Detect question number (1, 2, 3)
- Extract question text until next question
- Detect marks in parentheses
- Classify by marks (2 = SHORT, 5-10 = LONG, 15+ = DESCRIPTIVE)

### Scenario 2: MCQ Format
```
Question 1: Negligence requires:
A) Only breach of duty
B) Breach of duty AND damage
C) Only damage
D) None of the above

Correct Answer: B
```

**Extraction Logic**:
- Detect options (A, B, C, D)
- Identify correct answer line
- Classify as MCQ
- Store with correct answer

### Scenario 3: Case Study
```
Read the following case and answer the questions:

Case: X was injured due to negligence of Y...

Questions:
a) Identify the tort committed
b) What are the damages?
c) Explain the remedies
```

**Extraction Logic**:
- Detect "Read the case" pattern
- Extract case text
- Identify sub-questions (a, b, c)
- Link to main case
- Classify as CASE_STUDY

---

## 🚀 Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Database schema design
- [ ] MongoDB connection & models
- [ ] PDF extraction script (basic)
- [ ] Question parser (regex-based)

### Phase 2: Intelligent Parsing (Week 2)
- [ ] Advanced NLP-based parsing
- [ ] Question type classification
- [ ] Subject detection
- [ ] Batch processing

### Phase 3: API & Storage (Week 2-3)
- [ ] Store questions in DB
- [ ] Create REST API endpoints
- [ ] Add search/filter functionality
- [ ] Pagination and optimization

### Phase 4: Frontend Integration (Week 3)
- [ ] Display questions properly
- [ ] Build study interface
- [ ] Add filters & search
- [ ] Create content from questions

---

## 🔌 API Endpoints

```
# Get all questions for a semester
GET /api/questions?semester=1
GET /api/questions?semester=1&subject=TORTS
GET /api/questions?semester=1&type=SHORT

# Get specific question
GET /api/questions/:id

# Get paper and its questions
GET /api/papers/:id
GET /api/papers/:id/questions

# Search questions
GET /api/search?q=negligence
GET /api/search?q=negligence&semester=1&subject=TORTS

# Statistics
GET /api/stats/subjects
GET /api/stats/papers
GET /api/stats/questions
```

---

## 💾 Data Storage Strategy

### Directory Structure
```
database/
├─ questions_extracted/          ← JSON exports
│  ├─ semester_1_torts.json      ← Before DB
│  ├─ semester_1_criminal.json
│  └─ ...
└─ extraction_logs/
   ├─ 2026-08-11_sem1.log
   └─ ...
```

### Backup Strategy
```
# Backup all questions
mongoexport --db llb --collection questions > backup_questions.json

# Backup paper metadata
mongoexport --db llb --collection papers > backup_papers.json

# Restore if needed
mongoimport --db llb --collection questions backup_questions.json
```

---

## 🎯 Expected Results

### After Full Extraction

From **212 organized papers**, expect:

| Metric | Estimate |
|--------|----------|
| Total Questions | 5,000 - 8,000 |
| Short Answers | 2,000 - 3,000 |
| Long Answers | 1,500 - 2,500 |
| MCQs | 500 - 1,000 |
| Case Studies | 200 - 500 |
| Unique Subjects | 31 |
| Database Size | 500 MB - 1 GB |

---

## ⚠️ Challenges & Solutions

### Challenge 1: OCR/Text Extraction Quality
**Solution**: Use pdfplumber (good for PDF with text), fallback to OCR for scans

### Challenge 2: Question Format Variations
**Solution**: Build flexible regex patterns + NLP-based detection

### Challenge 3: Incorrect Parsing
**Solution**: Manual review queue + confidence scores + human validation

### Challenge 4: Duplicate Questions
**Solution**: Fuzzy matching + hash-based deduplication

### Challenge 5: Subject Classification
**Solution**: Rule-based + ML-based with fallback to GENERAL

---

## 📊 Quality Metrics

Track extraction quality:
```javascript
{
  totalPapers: 212,
  processedPapers: X,
  successfulExtractions: Y,
  successRate: (Y/X) * 100,
  averageQuestionsPerPaper: 25,
  extractionErrors: Z,
  manualReviewRequired: W,
  qualityScore: 0-100
}
```

---

## 🎓 Benefits of This Approach

✅ **Structured Data**: Questions in database, not PDFs  
✅ **Searchable**: Full-text search across all questions  
✅ **Reusable**: Generate content from questions (flashcards, tests)  
✅ **Scalable**: Easy to add more papers  
✅ **Interactive**: Study mode, practice tests, etc.  
✅ **Analytics**: Track which questions are studied  
✅ **AI-Ready**: Feed questions to LLM for answers  

---

## 🚀 Ready to Build?

This approach:
1. Extracts questions from PDFs
2. Stores them properly in DB
3. Makes them searchable and filterable
4. Enables content generation
5. Provides APIs for frontend

Should I start building the extraction pipeline? 🤖

