# System Architecture - LLB Knowledge Platform

High-level architecture and design decisions.

## 🏗️ Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Browser                               │
│              (Next.js + React + Coral Rush UI)                   │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend API Server                              │
│         (Node.js + Express + TypeScript)                         │
│  ┌────────────┬──────────────┬────────────┐                     │
│  │ Routes     │ Controllers  │ Services   │                     │
│  │ Middleware │ Models       │ Utils      │                     │
│  └────────────┴──────────────┴────────────┘                     │
└────────────────────┬────────────────────────────────────────────┘
                     │ MongoDB Driver
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              MongoDB Database                                     │
│  ┌──────────────┬──────────────┬─────────────┐                 │
│  │ Papers       │ Users        │ Bookmarks   │                 │
│  │ Answers      │ Sessions     │ Progress    │                 │
│  └──────────────┴──────────────┴─────────────┘                 │
└─────────────────────────────────────────────────────────────────┘

Content Generation Pipeline:
┌─────────────────────────────────────────────────────────────────┐
│                 PDF Question Papers                               │
│              (papers/GU/Sem-*/[year])                            │
└────────────────────┬────────────────────────────────────────────┘
                     │ pdfplumber
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Python Generator                                 │
│              (scripts/generate.py)                               │
│  Concurrent processing of multiple PDFs                         │
└────────────────────┬────────────────────────────────────────────┘
                     │ Generated JSON/Markdown
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│            Generated Content Storage                              │
│         (generated/[paper]/[content_type].json)                  │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Component Structure

### Frontend (Next.js + React)

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Homepage
│   ├── papers/
│   │   ├── page.tsx            # Papers list
│   │   └── [id]/
│   │       └── page.tsx        # Paper detail
│   └── study/
│       ├── page.tsx            # Study dashboard
│       └── [paperid]/
│           ├── long-answers/
│           ├── short-answers/
│           ├── mcqs/
│           ├── flashcards/
│           ├── case-laws/
│           └── revision-notes/
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── PaperCard.tsx
│   ├── QuestionList.tsx
│   └── ...
├── lib/
│   ├── api.ts                  # API client
│   ├── utils.ts                # Utilities
│   └── types.ts                # TypeScript types
└── globals.css                 # Tailwind config
```

### Backend (Node.js + Express)

```
backend/
├── src/
│   ├── index.ts                # Entry point
│   ├── controllers/
│   │   ├── paperController.ts
│   │   ├── answerController.ts
│   │   ├── authController.ts
│   │   └── ...
│   ├── routes/
│   │   ├── papers.ts
│   │   ├── answers.ts
│   │   ├── auth.ts
│   │   └── index.ts
│   ├── models/
│   │   ├── Paper.ts
│   │   ├── Answer.ts
│   │   ├── User.ts
│   │   └── ...
│   ├── services/
│   │   ├── paperService.ts
│   │   ├── contentService.ts
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   └── utils/
│       ├── logger.ts
│       ├── config.ts
│       └── helpers.ts
└── dist/                       # Compiled output
```

### Python Generator

```
scripts/
├── generate.py                 # Main generator
│   ├── PDF extraction
│   ├── LLM prompts
│   ├── Concurrent processing
│   └── Output formatting
└── requirements.txt            # Python dependencies
```

## 🔄 Data Flow

### Content Generation Flow

```
1. User selects PDF papers
2. Python script extracts text from PDFs
3. Text split into chunks (14K chars max)
4. For each chunk:
   - Fire 7 tasks in parallel (MCQs, flashcards, etc.)
   - Call LLM API (Gemini or OpenAI)
   - Parse response JSON
   - Save to generated/ directory
5. Generated JSON indexed by paper
```

### Study Flow

```
1. User visits frontend (localhost:3000)
2. Frontend loads papers from backend API
3. User selects paper
4. Frontend requests paper details:
   GET /api/papers/:id
5. Backend loads JSON from generated/ directory
6. Returns formatted data to frontend
7. Frontend renders study materials
8. User can bookmark, search, filter
```

### Authentication Flow

```
1. User registers: POST /api/auth/register
2. Backend creates user in MongoDB
3. User logs in: POST /api/auth/login
4. Backend verifies password, generates JWT
5. Frontend stores JWT in localStorage
6. Frontend sends JWT in Authorization header
7. Backend middleware validates token
8. User-specific data (bookmarks, progress) returned
```

## 💾 Database Schema

### Core Collections

#### Papers
```typescript
{
  _id: ObjectId,
  title: String,
  semester: Number,
  year: Number,
  university: String,
  fileName: String,
  generatedPath: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Answers
```typescript
{
  _id: ObjectId,
  paperId: ObjectId,
  type: "long" | "short" | "mcq" | "flashcard" | "case_law" | "bare_act" | "revision_note",
  question: String,
  answer: String,
  metadata: Object,
  createdAt: Date
}
```

#### Users
```typescript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  role: "student" | "admin",
  createdAt: Date,
  updatedAt: Date
}
```

#### Bookmarks
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  answerId: ObjectId,
  paperId: ObjectId,
  type: String,
  createdAt: Date
}
```

## 🔐 Security

### Authentication
- JWT-based authentication
- Bcrypt password hashing
- Token expiry (7 days default)

### Authorization
- Role-based access control (RBAC)
- Student vs Admin roles
- Protected API endpoints

### Data Protection
- CORS enabled (configured origin only)
- Helmet.js for security headers
- Input validation on all endpoints
- SQL/NoSQL injection prevention

## ⚡ Performance Considerations

### Frontend
- Next.js static generation for faster loads
- Client-side caching for API responses
- Lazy loading for large content lists
- Tailwind CSS for minimal bundle size

### Backend
- MongoDB indexing on frequently queried fields
- Connection pooling
- Response compression
- Pagination for large result sets

### Content Generation
- Concurrent PDF processing (2 workers default)
- Parallel task execution (7 tasks per PDF)
- Text chunking to respect LLM limits
- Caching of generated content

## 📊 API Endpoints

### Public Endpoints
- `GET /api/papers` - List all papers
- `GET /api/papers/:id` - Get paper details
- `GET /api/papers/:id/long-answers`
- `GET /api/papers/:id/short-answers`
- `GET /api/papers/:id/mcqs`
- `GET /api/papers/:id/flashcards`
- `GET /api/papers/:id/case-laws`
- `GET /api/papers/:id/bare-acts`
- `GET /api/papers/:id/revision-notes`

### Auth Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout

### User Endpoints (Protected)
- `GET /api/users/profile` - Get user profile
- `POST /api/users/bookmarks` - Add bookmark
- `GET /api/users/bookmarks` - List bookmarks
- `DELETE /api/users/bookmarks/:id` - Remove bookmark

## 🚀 Deployment Architecture

```
Development:
  Frontend: http://localhost:3000 (npm run dev)
  Backend: http://localhost:5000 (npm run dev)
  DB: mongodb://localhost:27017

Staging:
  Frontend: Vercel Preview Deployment
  Backend: Railway Preview
  DB: MongoDB Atlas Test Cluster

Production:
  Frontend: Vercel Production
  Backend: Railway Production
  DB: MongoDB Atlas Production Cluster
```

## 🔄 CI/CD Pipeline (Recommended)

```yaml
On Push to Main:
  1. Run Tests (Backend)
  2. Build Backend (npm run build)
  3. Build Frontend (npm run build)
  4. Run Linter (npm run lint)
  5. Deploy to Production (if all pass)
```

## 📈 Scaling Considerations

### Database
- Add MongoDB replica sets for high availability
- Implement caching layer (Redis)
- Archive old generated content

### API
- Load balancing with multiple instances
- CDN for static assets
- API rate limiting

### Frontend
- CDN distribution
- Static generation (ISR)
- Image optimization

### Content Generation
- Distributed job queue (Bull, RabbitMQ)
- Background workers
- Result caching

## 🎯 Future Enhancements

- [ ] Real-time collaborative studying
- [ ] AI tutor chatbot
- [ ] Personalized study recommendations
- [ ] Progress tracking and analytics
- [ ] Mobile app
- [ ] Offline support (PWA)
- [ ] Video explanations
- [ ] Mock tests with scoring

---

See `DEVELOPMENT.md` for development guidelines and `SETUP.md` for installation instructions.
