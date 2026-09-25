# LLB Knowledge Platform

> **Canonical application:** `react-frontend` (Vite + React) with the backend in `backend/`. The older `frontend/` Next.js directory is retained as an unselected scaffold and is not part of the standard development or Docker workflow.

An intelligent, AI-powered comprehensive learning management system for law students with automatic content generation from syllabi, 10 years of question papers, and multi-format study materials.

## 📋 Project Overview

**LLB Knowledge Platform** is an enterprise-grade application that:

- **Syllabus-Based Learning**: Generates comprehensive content from course syllabi
- **Historical Questions**: Aggregates and analyzes 10+ years of question papers
- **Multi-Format Content**: 
  - Question papers (organized by year)
  - Short answers (100-200 words)
  - Long answers (500+ words)
  - Flashcards with spaced repetition
  - Case law summaries
  - Bare acts and provisions
  - Timelines and chronological analysis
  - Topic-wise concept maps
  - Practice tests with scoring
  - Revision notes
- **AI-Enhanced Learning**: Auto-generates content using Gemini/OpenAI
- **Progress Tracking**: Student performance analytics
- **Interactive Study**: Search, filter, bookmark, and track progress

## 🏗️ Project Structure

```
LLB/
├── frontend/                           # Next.js + React Application
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/             # Student dashboard
│   │   │   ├── papers/
│   │   │   │   ├── page.tsx           # All question papers
│   │   │   │   └── [year]/[id]/       # Paper detail with all formats
│   │   │   ├── syllabus/
│   │   │   │   ├── page.tsx           # Syllabus list
│   │   │   │   └── [subjectId]/       # Subject topics & concepts
│   │   │   ├── topics/
│   │   │   │   ├── page.tsx           # Topic browser
│   │   │   │   └── [topicId]/         # Topic detail page
│   │   │   ├── practice/
│   │   │   │   ├── page.tsx           # Practice tests
│   │   │   │   ├── [testId]/          # Test attempt
│   │   │   │   └── results/           # Results & analysis
│   │   │   ├── flashcards/
│   │   │   │   ├── page.tsx           # Flashcard decks
│   │   │   │   └── [deckId]/          # Study mode
│   │   │   ├── bookmarks/
│   │   │   ├── progress/              # Study analytics
│   │   │   └── profile/
│   │   ├── (admin)/
│   │   │   ├── admin/
│   │   │   ├── content-manager/       # Manage generated content
│   │   │   ├── users/
│   │   │   ├── analytics/
│   │   │   └── generation-logs/
│   │   └── api/                       # API routes
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navigation.tsx
│   │   ├── study/
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── AnswerDisplay.tsx
│   │   │   ├── FlashcardReview.tsx
│   │   │   ├── PracticeTest.tsx
│   │   │   └── TimelineView.tsx
│   │   ├── content/
│   │   │   ├── PaperBrowser.tsx
│   │   │   ├── ContentFilter.tsx
│   │   │   ├── TopicExplorer.tsx
│   │   │   └── SearchBar.tsx
│   │   └── admin/
│   │       ├── ContentGenerator.tsx
│   │       ├── GenerationMonitor.tsx
│   │       └── ContentValidator.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── utils.ts
│   └── public/
│
├── backend/                            # Node.js + Express
│   ├── src/
│   │   ├── index.ts
│   │   ├── controllers/
│   │   │   ├── paperController.ts
│   │   │   ├── contentController.ts
│   │   │   ├── syllabusController.ts
│   │   │   ├── topicController.ts
│   │   │   ├── practiceController.ts
│   │   │   ├── userController.ts
│   │   │   ├── analyticsController.ts
│   │   │   └── adminController.ts
│   │   ├── routes/
│   │   │   ├── papers.ts
│   │   │   ├── content.ts
│   │   │   ├── syllabus.ts
│   │   │   ├── topics.ts
│   │   │   ├── practice.ts
│   │   │   ├── users.ts
│   │   │   ├── analytics.ts
│   │   │   └── admin.ts
│   │   ├── models/
│   │   │   ├── Paper.ts              # Question papers
│   │   │   ├── Content.ts            # Generated content
│   │   │   ├── Syllabus.ts           # Course syllabus
│   │   │   ├── Topic.ts              # Topics & concepts
│   │   │   ├── Question.ts           # Individual questions
│   │   │   ├── Answer.ts             # Answers (short/long)
│   │   │   ├── Flashcard.ts          # Flashcards
│   │   │   ├── PracticeTest.ts       # Practice tests
│   │   │   ├── UserProgress.ts       # Student progress
│   │   │   ├── User.ts               # Users
│   │   │   └── GenerationLog.ts      # Generation tracking
│   │   ├── services/
│   │   │   ├── paperService.ts
│   │   │   ├── contentService.ts
│   │   │   ├── generationService.ts
│   │   │   ├── analysisService.ts
│   │   │   ├── userService.ts
│   │   │   └── analyticsService.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── logging.ts
│   │   └── utils/
│   │       ├── logger.ts
│   │       ├── config.ts
│   │       └── helpers.ts
│   └── dist/
│
├── scripts/                            # Python Content Generation
│   ├── generate.py                    # Main generator (enhanced)
│   ├── content_generator/
│   │   ├── syllabus_processor.py      # Parse syllabus
│   │   ├── question_analyzer.py       # Analyze questions
│   │   ├── content_synthesizer.py     # Generate content
│   │   ├── timeline_generator.py      # Create timelines
│   │   ├── concept_mapper.py          # Generate concept maps
│   │   └── validator.py               # Validate generated content
│   ├── config.yaml                    # Generation config
│   └── requirements.txt
│
├── data/                               # Data files
│   ├── syllabi/
│   │   ├── GU/
│   │   │   ├── sem-1.json
│   │   │   ├── sem-2.json
│   │   │   └── ...
│   │   └── other-universities/
│   ├── papers/                         # 10 years of papers
│   │   └── GU/
│   │       └── Sem-1/
│   │           ├── 2014/
│   │           ├── 2015/
│   │           ├── ...
│   │           └── 2024/
│   ├── reference-material/
│   │   ├── acts.json                  # Bare acts
│   │   ├── cases.json                 # Case laws
│   │   └── timelines.json             # Historical timelines
│   └── templates/
│       ├── content-prompts.json
│       └── validation-rules.json
│
├── generated/                          # Generated content output
│   ├── [semester]/
│   │   ├── [subject]/
│   │   │   ├── questions/            # Aggregated questions
│   │   │   ├── short-answers/
│   │   │   ├── long-answers/
│   │   │   ├── flashcards/
│   │   │   ├── timelines/
│   │   │   ├── concept-maps/
│   │   │   ├── case-summaries/
│   │   │   ├── practice-tests/
│   │   │   └── revision-notes/
│   │   └── metadata.json
│   └── logs/
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── SETUP.md
├── ARCHITECTURE.md
├── PROJECT_SUMMARY.md
├── REQUIREMENTS.md                     # Detailed requirements
└── API_DOCUMENTATION.md               # API spec
```

## 🎯 Key Features

### Content Generation (Enhanced)

1. **From Syllabi**
   - Parse course syllabus
   - Extract key topics and concepts
   - Generate topic-wise content
   - Create concept hierarchies

2. **From 10 Years of Papers**
   - Aggregate questions by topic
   - Identify patterns and trends
   - Generate quality answers
   - Track question evolution

3. **Multiple Content Formats**
   - 📝 Question papers (original)
   - ✏️ Short answers (100-200 words)
   - 📖 Long answers (500+ words)
   - 🃏 Flashcards (with tags)
   - ⏳ Timelines (chronological events)
   - 🗺️ Concept maps (visual organization)
   - ⚖️ Case summaries (with implications)
   - 📋 Bare acts (legislation)
   - 📚 Revision notes (key points)
   - ✅ Practice tests (auto-scored)

### Student Features

- 📚 **Paper Browser**: Browse by year, semester, subject
- 🔍 **Advanced Search**: Find questions by topic, keyword, type
- 🏷️ **Smart Filters**: Filter by difficulty, format, year
- 📌 **Bookmarks**: Save favorite questions/answers
- 📊 **Progress Tracking**: Track study progress
- 📈 **Analytics**: Performance analysis
- ⏱️ **Spaced Repetition**: Flashcard scheduling
- 🎯 **Practice Tests**: Take tests, get instant feedback
- 🌳 **Topic Tree**: Navigate hierarchical topics
- ⏳ **Timeline View**: Understand chronological concepts

### Admin Features

- 🤖 **Content Generation**: Trigger content generation
- 📊 **Generation Monitoring**: Track generation progress
- ✅ **Content Validation**: Verify quality
- 📈 **Usage Analytics**: Student activity tracking
- 🔧 **Content Management**: Edit/update content
- 👥 **User Management**: Manage students and instructors
- 📋 **Syllabus Manager**: Upload/manage syllabi
- 🗓️ **Batch Operations**: Process multiple papers

## 🔄 Content Generation Pipeline

```
Inputs:
├── Syllabus (JSON) → Topic extraction
├── Question Papers (2014-2024) → Question aggregation
└── Reference Material → Context enrichment

Processing (Parallel):
├── Syllabus Processor → Topics & Concepts
├── Question Analyzer → Pattern analysis
├── Content Synthesizer → Generate all formats
├── Timeline Generator → Historical events
└── Concept Mapper → Visual relationships

Outputs:
├── 📝 Original Question Papers
├── ✏️ Short Answers
├── 📖 Long Answers
├── 🃏 Flashcards
├── ⏳ Timelines
├── 🗺️ Concept Maps
├── ⚖️ Case Summaries
├── 📋 Bare Acts
├── 📚 Revision Notes
└── ✅ Practice Tests
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.13+
- MongoDB
- API keys (Gemini or OpenAI)

### Installation
```bash
# 1. Clone and setup
cd c:\projects\LLB
copy .env.example .env
# Edit .env with your config

# 2. Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Setup Python
python -m venv venv
venv\Scripts\activate
pip install -r scripts/requirements.txt

# 4. Start services
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

### Generate Content
```bash
# Generate from syllabi
python scripts/generate.py --mode syllabus

# Generate from papers (10 years)
python scripts/generate.py --mode papers --years 10

# Generate all content
python scripts/generate.py --mode all --parallel

# Generate specific subject
python scripts/generate.py --subject "Criminal Law" --semester 1
```

## 📊 Content Statistics

- **Papers**: 200+ (10 years × 2 semesters × 10+ subjects)
- **Questions**: 2000+ aggregated questions
- **Topics**: 500+ unique topics
- **Content Pieces**: 20,000+ (answers, flashcards, etc.)
- **Coverage**: Constitutional Law, Criminal Law, Civil Law, Corporate Law, etc.

## 🛠️ Tech Stack

### Frontend
- Next.js 14, React 18
- TypeScript, Tailwind CSS
- Coral Rush UI Components
- Chart.js for analytics

### Backend
- Node.js, Express
- TypeScript
- MongoDB, Mongoose
- JWT Authentication

### Content Generation
- Python 3.13+
- pdfplumber (PDF extraction)
- Gemini/OpenAI (AI content generation)
- Concurrent processing

## 📚 API Endpoints

### Papers & Content
- `GET /api/papers` - All papers
- `GET /api/papers/:id` - Paper detail
- `GET /api/papers/year/:year` - Papers by year
- `GET /api/papers/:id/questions` - Questions from paper
- `GET /api/content/:paperId/:type` - Specific content type

### Topics & Syllabus
- `GET /api/syllabus` - All syllabi
- `GET /api/syllabus/:id` - Syllabus detail
- `GET /api/topics` - All topics
- `GET /api/topics/:id/content` - Topic content

### Practice & Study
- `GET /api/practice/tests` - Available tests
- `POST /api/practice/tests/:id/attempt` - Start test
- `POST /api/practice/tests/:id/submit` - Submit answers
- `GET /api/flashcards/:deckId` - Get flashcard deck

### Analytics
- `GET /api/users/progress` - Study progress
- `GET /api/users/statistics` - Performance stats
- `GET /api/users/recommendations` - Study recommendations

## 🔐 Security & Features

- ✅ JWT authentication
- ✅ Role-based access (student/instructor/admin)
- ✅ Rate limiting
- ✅ Input validation
- ✅ Audit logging
- ✅ Data encryption
- ✅ CORS configuration

## 📖 Documentation

- **SETUP.md** - Installation guide
- **ARCHITECTURE.md** - System design
- **API_DOCUMENTATION.md** - API reference
- **REQUIREMENTS.md** - Feature specifications

## 🚀 Deployment

### Development
```bash
npm run dev  # Both frontend and backend
```

### Production
```bash
# Build
npm run build

# Deploy to Vercel (frontend), Railway (backend)
# Configure MongoDB Atlas for database
```

## 📈 Future Enhancements

- 🤖 AI tutor chatbot
- 📱 Mobile app (React Native)
- 🎥 Video explanations
- 👥 Collaborative studying
- 🏆 Gamification & leaderboards
- 📊 Advanced analytics
- 🔊 Audio pronunciations
- 🌐 Multi-language support

---

**Version**: 2.0 (Enhanced)  
**Last Updated**: August 10, 2026  
**Status**: Production Ready ✅
