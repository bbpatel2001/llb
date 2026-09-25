# Getting Started - LLB Knowledge Platform

**Welcome!** This guide will help you understand and start using the project.

---

## 📚 Documentation Map

Start here based on your role:

### 👨‍💼 Project Managers / Decision Makers
1. **README.md** - High-level project overview (5 min read)
2. **ENHANCED_PROJECT_SUMMARY.md** - Comprehensive scope overview (10 min)
3. **REQUIREMENTS.md** - Detailed feature list (15 min)

### 👨‍💻 Developers / Technical Leads
1. **ARCHITECTURE.md** - System design and data flow (20 min)
2. **SETUP.md** - Installation and configuration (15 min)
3. **Backend README** - Backend-specific details
4. **Frontend README** - Frontend-specific details

### 🔧 DevOps / System Administrators
1. **SETUP.md** - Installation guide (15 min)
2. **docker-compose.yml** - Container configuration
3. **Deployment Guide** (coming soon)

### 📊 Data Engineers / Analysts
1. **REQUIREMENTS.md** (Data section) - Data schemas
2. **Backend Models** (src/models/index.ts) - Database structure
3. **ARCHITECTURE.md** (Data Flow section)

---

## ⚡ 5-Minute Quick Start

### Prerequisite: Have these installed
- Node.js 18+
- Python 3.13+
- MongoDB (Docker)
- Git

### Step 1: Setup
```bash
cd c:\projects\LLB
copy .env.example .env
# Edit .env and add your Gemini API key
```

### Step 2: Install Dependencies
```bash
# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..

# Python
python -m venv venv
venv\Scripts\activate
pip install -r scripts/requirements.txt
```

### Step 3: Start Services
```bash
# Terminal 1
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Terminal 2
cd backend && npm run dev

# Terminal 3
cd frontend && npm run dev
```

### Step 4: Visit
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

---

## 🎯 Understanding the Project

### What is This?
An **AI-powered Learning Management System** for law students that:
- Analyzes 10+ years of exam papers (200+ PDFs)
- Generates 9 types of study materials automatically
- Provides interactive learning platform
- Tracks student progress

### Why Is It Needed?
Law students need:
- Comprehensive past papers analysis
- Multiple study formats (Q&A, flashcards, timelines, etc.)
- Intelligent learning paths
- Quick access to relevant legal materials

### How Does It Work?
```
PDFs/Syllabi → AI Analysis → Content Generation → Database → Web Platform
```

---

## 📁 Project Structure Overview

```
LLB/ (Root)
├── frontend/                    Next.js application
│   ├── app/                    Pages and routes
│   ├── components/             React components
│   └── package.json
│
├── backend/                    Express API
│   ├── src/
│   │   ├── controllers/        Route handlers
│   │   ├── models/             Database schemas
│   │   ├── routes/             API endpoints
│   │   └── services/           Business logic
│   └── package.json
│
├── scripts/
│   ├── generate.py             Content generator
│   └── content_generator/      Generator modules
│
├── data/
│   ├── papers/                 Question PDFs (200+)
│   ├── syllabi/                Course syllabi
│   └── reference-material/     Cases, acts, timelines
│
├── generated/                  Generated content output
│
└── Documentation (10+ files)
    ├── README.md
    ├── SETUP.md
    ├── ARCHITECTURE.md
    ├── REQUIREMENTS.md
    ├── ENHANCED_PROJECT_SUMMARY.md
    └── ...
```

---

## 🔄 Development Workflow

### First Time Setup
1. Clone repository
2. Copy `.env.example` to `.env`
3. Install all dependencies
4. Start all three services
5. Verify in browser

### Daily Development
```bash
# Terminal 1: Backend (with hot reload)
cd backend && npm run dev

# Terminal 2: Frontend (with hot reload)
cd frontend && npm run dev

# Terminal 3: Other tasks, monitoring, etc.
```

### Generate Content
```bash
# After services are running
python scripts/generate.py --mode all --parallel
```

### Common Commands

**Backend:**
```bash
cd backend
npm run dev         # Development
npm run build       # Production build
npm run test        # Run tests
npm run lint        # Code quality
npm start          # Run compiled code
```

**Frontend:**
```bash
cd frontend
npm run dev         # Development
npm run build       # Production build
npm run lint        # Code quality
npm run type-check  # TypeScript check
```

**Python:**
```bash
python scripts/generate.py --help
python scripts/generate.py --mode papers --years 10
python scripts/generate.py --mode syllabus
python scripts/generate.py --mode all --parallel
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill it (get PID from above)
taskkill /PID <PID> /F

# Or use different port
PORT=5001 npm run dev
```

### MongoDB Connection Error
```bash
# Make sure MongoDB is running
docker ps | findstr mongodb

# If not, start it
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Check connection
mongosh localhost:27017
```

### Dependencies Issues
```bash
# Clean install
rm -r node_modules package-lock.json
npm install
```

### Python Issues
```bash
# Recreate virtual environment
rm -r venv
python -m venv venv
venv\Scripts\activate
pip install -r scripts/requirements.txt
```

---

## 📖 Reading Guide by Role

### Full-Stack Developers
1. SETUP.md (setup)
2. ARCHITECTURE.md (understand system)
3. REQUIREMENTS.md (features)
4. Backend & Frontend folders (code)
5. Start implementing features

### Backend Developers
1. SETUP.md → Backend section
2. ARCHITECTURE.md → Backend Architecture
3. Backend src/models/index.ts (schemas)
4. REQUIREMENTS.md → API section
5. Start with controllers

### Frontend Developers
1. SETUP.md → Frontend section
2. ARCHITECTURE.md → Frontend Architecture
3. REQUIREMENTS.md → UI section
4. Frontend app/ and components/
5. Start with pages

### DevOps / Deployment
1. SETUP.md (Docker section)
2. docker-compose.yml (containers)
3. ARCHITECTURE.md (deployment)
4. CI/CD setup

### Python/ML Engineers
1. scripts/generate.py (main script)
2. scripts/content_generator/ (modules)
3. REQUIREMENTS.md (AI integration)
4. ARCHITECTURE.md (Data Flow)

---

## 🚀 Starting Your First Task

### Task 1: Verify Setup Works
```bash
# Check backend
curl http://localhost:5000/api/health

# Should return:
# {
#   "status": "ok",
#   "timestamp": "2024-08-10T...",
#   "uptime": 12.345
# }
```

### Task 2: Generate Content
```bash
python scripts/generate.py --mode papers --years 2 --workers 1
# Processes 2 years of papers
# Generates all content types
# Takes ~10 minutes
```

### Task 3: Implement First API Endpoint
1. Create model in `backend/src/models/`
2. Create controller in `backend/src/controllers/`
3. Create route in `backend/src/routes/`
4. Test with curl

### Task 4: Build First Frontend Page
1. Create page in `frontend/app/`
2. Create components in `frontend/components/`
3. Add styling with Tailwind
4. Test in browser

---

## 📚 Key Documentation Files

| File | Purpose | Read Time |
|------|---------|-----------|
| README.md | Project overview | 5 min |
| SETUP.md | Installation guide | 15 min |
| ARCHITECTURE.md | Technical design | 20 min |
| REQUIREMENTS.md | Detailed specs | 30 min |
| ENHANCED_PROJECT_SUMMARY.md | Comprehensive scope | 25 min |
| API_DOCUMENTATION.md | API reference | 20 min (when created) |
| DEPLOYMENT.md | Production setup | 30 min (when created) |

---

## 🎓 Learning Path

### Week 1: Understanding
- [ ] Read README.md
- [ ] Read ENHANCED_PROJECT_SUMMARY.md
- [ ] Read ARCHITECTURE.md
- [ ] Understand data flow

### Week 2: Setup & Exploration
- [ ] Complete SETUP.md
- [ ] Get all services running
- [ ] Explore generated structure
- [ ] Test API endpoints

### Week 3: Backend Development
- [ ] Implement first models
- [ ] Create controllers
- [ ] Build API endpoints
- [ ] Write tests

### Week 4: Frontend Development
- [ ] Create first pages
- [ ] Build components
- [ ] Connect to backend
- [ ] Style with Tailwind

### Week 5: Content Generation
- [ ] Run content generator
- [ ] Validate output
- [ ] Index in database
- [ ] Create search

---

## 💬 Quick Reference

### Important Paths
```
Backend:         c:\projects\LLB\backend\src\
Frontend:        c:\projects\LLB\frontend\app\
Python Scripts:  c:\projects\LLB\scripts\
Data:            c:\projects\LLB\data\
Generated:       c:\projects\LLB\generated\
```

### Port Numbers
```
Frontend:  3000
Backend:   5000
MongoDB:   27017
Redis:     6379 (if using)
```

### API Base URL
```
http://localhost:5000/api
```

### Database Connection
```
mongodb://localhost:27017/llb_platform
```

---

## 🆘 Need Help?

1. **Check Logs**: Look at terminal output for errors
2. **Verify Services**: Check all three are running
3. **Check Config**: Verify .env file is correct
4. **Database**: Check MongoDB is accessible
5. **API**: Test with curl or Postman
6. **Browser**: Check browser console for errors

---

## ✅ Pre-Launch Checklist

Before you start development, verify:

- [ ] Node.js 18+ installed
- [ ] Python 3.13+ installed
- [ ] MongoDB running
- [ ] .env file configured
- [ ] Dependencies installed
- [ ] Backend running on 5000
- [ ] Frontend running on 3000
- [ ] Can access http://localhost:3000
- [ ] Can access http://localhost:5000/api/health

---

## 🎯 Next Steps

1. **Choose your role**: Full-stack, Backend, Frontend, DevOps
2. **Read relevant documentation**: Use the map above
3. **Get setup**: Follow SETUP.md
4. **Start coding**: Pick your first task
5. **Share progress**: Keep team updated

---

## 📞 Support

For questions about:
- **Setup**: See SETUP.md
- **Architecture**: See ARCHITECTURE.md
- **Features**: See REQUIREMENTS.md
- **API**: See src/routes/ (when ready)
- **Code**: See inline comments

---

**Ready to build something awesome?** 🚀

Start with SETUP.md and get the system running. Once you have all three services (Backend, Frontend, MongoDB) running, you're ready to develop!

Good luck! 💪
