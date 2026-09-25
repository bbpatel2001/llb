# Question Extraction & Database Integration - Action Plan

**Goal**: Extract questions from PDFs → Store in DB → Serve via API → Display in Frontend

---

## 🎯 Phase Overview

```
Week 1          Week 2          Week 3          Week 4
├─Phase 1       ├─Phase 2       ├─Phase 3       ├─Deployment
│ Setup          │ Extraction     │ API & Frontend │ & Optimization
└─Done           └─Done           └─Done           └─Live
```

---

## ⚙️ Phase 1: Setup & Infrastructure (Week 1)

### Step 1.1: Update Database Models ✅ DONE
**Status**: Code created in `backend/src/models/Question.ts`

**Files**:
- ✅ `Question.ts` - Question schema with all fields
- ✅ `Paper.ts` - Paper schema (may need update)

**What to do**:
```bash
cd backend
npm install -S mongoose typescript
```

**Verify**: Models compile without errors
```bash
npx tsc --noEmit
```

---

### Step 1.2: Setup MongoDB Connection
**Location**: `backend/src/config/database.ts`

**Create file**:
```typescript
import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/llb');
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};
```

**In `backend/src/index.ts`**:
```typescript
import { connectDB } from './config/database';

async function main() {
  await connectDB();
  // ... rest of app
}
```

---

### Step 1.3: Setup Python Environment
**Location**: `scripts/`

**Create virtual environment**:
```bash
cd scripts
python -m venv venv
venv\Scripts\activate  # Windows

# OR on Mac/Linux
source venv/bin/activate
```

**Install dependencies**:
```bash
pip install pdfplumber pymongo nltk spacy
python -m spacy download en_core_web_sm
```

---

### Step 1.4: Create Output Directories
```bash
mkdir -p c:\projects\LLB\extracted_questions
mkdir -p c:\projects\LLB\logs
mkdir -p c:\projects\LLB\data\extraction_logs
```

---

## 🔄 Phase 2: Question Extraction (Week 2)

### Step 2.1: Test Extraction Script
**File**: ✅ `scripts/extract_questions.py` (CREATED)

**Test with one paper**:
```bash
cd c:\projects\LLB
python scripts/extract_questions.py
```

**Expected output**:
```
📖 Processing Semester-1...
  ✓ Sem1_TORTS_101 Law of Torts.pdf: 25 questions
  ✓ Sem1_CRIMINAL_102 Criminal Law.pdf: 20 questions
  ...

QUESTION EXTRACTION SUMMARY
Total papers processed: 90/90
Total questions extracted: 2,150
By semester:
  Semester-1: 2,150 questions
```

**Output**: `extracted_questions/sem1_torts.json`, `sem1_criminal.json`, etc.

---

### Step 2.2: Verify Extraction Quality
**Check**: 
1. Open `extracted_questions/sem1_torts.json`
2. Verify question structure
3. Check marks, types, tags

**Example output**:
```json
{
  "questionNumber": "1(a)",
  "questionText": "Define negligence and its essential elements.",
  "marks": 5,
  "type": "SHORT",
  "difficulty": "MEDIUM",
  "tags": ["torts", "negligence"],
  "options": null,
  "correctAnswer": null
}
```

---

### Step 2.3: Connect to MongoDB
**Update script**: `scripts/extract_questions.py` (line ~350)

```python
# Uncomment this line:
pipeline = QuestionExtractorPipeline(
    db_connection_string="mongodb://localhost:27017"
)
```

**Verify MongoDB is running**:
```bash
# Start MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Check connection
docker ps | grep mongodb
```

---

### Step 2.4: Extract All Questions
**Run full extraction**:
```bash
python scripts/extract_questions.py
```

**This will**:
- Process all 212 papers
- Extract ~5,000-8,000 questions
- Store in JSON files
- Insert into MongoDB automatically

**Time**: 2-4 hours (run overnight)

**After completion**, verify in MongoDB:
```bash
# Connect to MongoDB
mongo

# Check
use llb
db.questions.count()  # Should see ~5000+
db.questions.findOne()  # Sample question
```

---

## 🔌 Phase 3: API & Frontend Integration (Week 3)

### Step 3.1: Create Question Routes
**File**: `backend/src/routes/questions.ts`

```typescript
import express from 'express';
import { QuestionService } from '../services/questionService';

const router = express.Router();

// Get questions by semester
router.get('/semester/:semester', async (req, res) => {
  try {
    const { subject, type, difficulty, skip, limit } = req.query;
    const result = await QuestionService.getQuestionsBySemester(
      parseInt(req.params.semester),
      { subject, type, difficulty, skip: parseInt(skip), limit: parseInt(limit) }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get questions by paper
router.get('/paper/:paperId', async (req, res) => {
  try {
    const result = await QuestionService.getQuestionsByPaper(req.params.paperId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search questions
router.get('/search', async (req, res) => {
  try {
    const result = await QuestionService.searchQuestions(req.query.q as string, {
      semester: req.query.semester ? parseInt(req.query.semester as string) : undefined,
      subject: req.query.subject as string,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await QuestionService.getStatistics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

**Register in `backend/src/index.ts`**:
```typescript
import questionsRouter from './routes/questions';

app.use('/api/questions', questionsRouter);
```

---

### Step 3.2: Test API Endpoints
**Start backend**:
```bash
cd backend
npm run dev
```

**Test in browser or curl**:
```bash
# Get Semester-1 questions
curl http://localhost:5000/api/questions/semester/1

# Get by subject
curl http://localhost:5000/api/questions/semester/1?subject=TORTS

# Search
curl "http://localhost:5000/api/questions/search?q=negligence"

# Stats
curl http://localhost:5000/api/questions/stats
```

---

### Step 3.3: Create Frontend Pages

#### Page 1: Browse Questions by Semester
**File**: `frontend/app/study/questions/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [semester, setSemester] = useState(1);
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      const params = new URLSearchParams({ 
        limit: '50' 
      });
      if (subject) params.append('subject', subject);
      
      const res = await fetch(`/api/questions/semester/${semester}?${params}`);
      const data = await res.json();
      setQuestions(data.questions);
      setLoading(false);
    };

    fetchQuestions();
  }, [semester, subject]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Questions</h1>

      <div className="mb-6 flex gap-4">
        <select
          value={semester}
          onChange={(e) => setSemester(parseInt(e.target.value))}
          className="px-4 py-2 border rounded"
        >
          {[1, 2, 3, 4, 5, 6].map(s => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search subject..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="px-4 py-2 border rounded flex-1"
        />
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {questions.map((q: any) => (
            <Link key={q._id} href={`/study/question/${q._id}`}>
              <div className="p-4 border rounded hover:bg-gray-50 cursor-pointer">
                <div className="font-semibold">{q.questionNumber}. {q.questionText}</div>
                <div className="text-sm text-gray-600 mt-2">
                  {q.marks} marks | {q.type}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### Page 2: Question Detail
**File**: `frontend/app/study/question/[id]/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function QuestionPage() {
  const { id } = useParams();
  const [question, setQuestion] = useState<any>(null);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    const fetchQuestion = async () => {
      const res = await fetch(`/api/questions/${id}`);
      const data = await res.json();
      setQuestion(data);

      // Fetch related questions
      const relRes = await fetch(`/api/questions/${id}/related`);
      const relData = await relRes.json();
      setRelated(relData);
    };

    if (id) fetchQuestion();
  }, [id]);

  if (!question) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Question {question.questionNumber}</h1>
        <p className="text-gray-600">
          Semester {question.semester} | {question.subject} | {question.marks} marks
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <p className="text-lg mb-4">{question.questionText}</p>

        {question.type === 'MCQ' && question.options && (
          <div className="space-y-2">
            {question.options.map((opt: any) => (
              <div key={opt.label} className="p-2 border rounded">
                <strong>{opt.label})</strong> {opt.text}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 text-sm">
          Type: {question.type} | Difficulty: {question.difficulty}
        </div>
      </div>

      {related.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4">Related Questions</h3>
          <div className="space-y-2">
            {related.map((q: any) => (
              <div key={q._id} className="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">
                <div>{q.questionNumber}. {q.questionText.substring(0, 50)}...</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Step 3.4: Create Search Interface
**File**: `frontend/app/study/search/page.tsx`

```typescript
'use client';

import { useState } from 'react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`/api/questions/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.questions);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Search Questions</h1>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions..."
            className="flex-1 px-4 py-2 border rounded text-lg"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </form>

      {loading && <div>Searching...</div>}

      <div className="space-y-4">
        {results.map((q: any) => (
          <div key={q._id} className="p-4 border rounded">
            <div className="font-semibold mb-2">{q.questionText}</div>
            <div className="text-sm text-gray-600">
              Q{q.questionNumber} | Sem {q.semester} | {q.marks} marks | {q.type}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 📊 Phase 4: Testing & Deployment (Week 4)

### Step 4.1: End-to-End Testing
```bash
# 1. Start MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# 2. Start Backend
cd backend && npm run dev

# 3. Start Frontend
cd frontend && npm run dev

# 4. Test in browser
# - http://localhost:3000/study/questions
# - http://localhost:3000/study/search
# - http://localhost:3000/study/question/[id]
```

### Step 4.2: Database Backups
```bash
# Export all questions
mongoexport --db llb --collection questions > backup_questions.json

# Export papers
mongoexport --db llb --collection papers > backup_papers.json
```

### Step 4.3: Performance Optimization
- Add database indexes (already in schema)
- Enable pagination (already implemented)
- Add caching with Redis (optional)
- Optimize API response times

### Step 4.4: Deployment
- Deploy backend to Railway/Heroku
- Deploy frontend to Vercel
- Update MongoDB connection string
- Setup production monitoring

---

## ✅ Deliverables Checklist

### By End of Week 1
- [ ] MongoDB models created
- [ ] Database connection setup
- [ ] Python environment ready
- [ ] Directories created

### By End of Week 2
- [ ] Questions extracted from all papers
- [ ] Data stored in MongoDB
- [ ] JSON backups created
- [ ] Extraction logs reviewed

### By End of Week 3
- [ ] Question API routes working
- [ ] Frontend pages built
- [ ] Search functionality working
- [ ] Related questions feature working

### By End of Week 4
- [ ] All systems tested
- [ ] Performance optimized
- [ ] Backups in place
- [ ] Ready for production deployment

---

## 🚀 Quick Start Commands

```bash
# Week 1 Setup
cd backend && npm install
cd ../scripts && pip install -r requirements.txt

# Week 2 Extraction
python scripts/extract_questions.py

# Week 3 Backend
cd backend && npm run dev

# Week 3 Frontend
cd frontend && npm run dev

# Week 4 Test
curl http://localhost:5000/api/questions/semester/1
curl http://localhost:5000/api/questions/stats
```

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB connection fails | Check if running: `docker ps \| grep mongodb` |
| Extraction takes too long | Run on one semester first to test |
| API returns empty | Check if extraction completed and data is in DB |
| Frontend won't fetch | Verify backend is running on port 5000 |

---

**Status**: 🟢 **READY TO IMPLEMENT**

All code is prepared. Start with Phase 1 this week!

