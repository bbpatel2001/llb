# Week 1: Infrastructure Setup Guide

**Timeline**: August 11-17, 2026  
**Status**: Starting now

---

## ✅ Phase 1: Setup & Infrastructure

### Task 1.1: Database Models (COMPLETED ✅)

**What was done:**
- ✅ Created Question model (`backend/src/models/Question.ts`)
- ✅ Created Paper model (`backend/src/models/Paper.ts`)
- ✅ Created ExtractionLog model (`backend/src/models/ExtractionLog.ts`)
- ✅ Updated models index (`backend/src/models/index.ts`)
- ✅ Database config created (`backend/src/config/database.ts`)

**Files Created:**
```
backend/src/
├─ models/
│  ├─ Question.ts ......... ✅ Question schema
│  ├─ Paper.ts ............ ✅ Paper schema
│  ├─ ExtractionLog.ts .... ✅ Extraction tracking
│  └─ index.ts ............ ✅ Model exports
└─ config/
   └─ database.ts ......... ✅ MongoDB connection
```

**Features:**
- Automatic indexing for queries
- Text search support
- Proper relationships (paperId → Paper)
- Timestamps on all docs

---

### Task 1.2: Backend Configuration (COMPLETED ✅)

**What was done:**
- ✅ Updated `backend/src/index.ts` with database connection
- ✅ Added basic API routes
- ✅ Created `.env` file
- ✅ Updated `.env.example`

**API Endpoints Created:**
```
GET  /api/health                      - Health check with DB status
GET  /api                             - API documentation
GET  /api/papers                      - List papers
GET  /api/questions/semester/:semester - Get questions by semester
GET  /api/stats                       - Get statistics
```

**Environment Variables:**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/llb
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

---

### Task 1.3: Python Setup (IN PROGRESS 🔄)

**To Do:**
1. Create Python virtual environment
2. Install dependencies from `scripts/requirements.txt`
3. Test pdfplumber

**Commands:**
```bash
# Windows
cd c:\projects\LLB\scripts
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Verify Installation:**
```python
python
>>> import pdfplumber
>>> import pymongo
>>> import nltk
>>> print("All imports successful!")
```

---

### Task 1.4: MongoDB Setup (NEXT 🔜)

**What to do:**
1. Start MongoDB in Docker
2. Create database connection
3. Verify database access

**Commands:**
```bash
# Start MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Check if running
docker ps | findstr mongodb

# Test connection (from Python)
python
>>> from pymongo import MongoClient
>>> client = MongoClient('mongodb://localhost:27017')
>>> db = client['llb']
>>> print(db.list_collection_names())
```

---

### Task 1.5: Node Modules & Build (NEXT 🔜)

**For Backend:**
```bash
cd backend
npm install
npm run build
```

**For Frontend:**
```bash
cd frontend
npm install
npm run build
```

---

## 📋 Daily Breakdown

### Day 1-2: Database & Models
- [x] Create MongoDB models
- [x] Create database config
- [x] Update backend entry point
- [ ] Test connection

**Status**: 90% complete (just need to test)

### Day 3-4: Python Environment
- [ ] Create virtual environment
- [ ] Install requirements
- [ ] Test imports

**Status**: 0% (ready to start)

### Day 5: Verification
- [ ] Test MongoDB connection
- [ ] Test Backend API
- [ ] Test Python extraction module

**Status**: 0% (ready to start)

---

## 🚀 Immediate Actions (Next 30 minutes)

### Step 1: Start MongoDB
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

**Verify:**
```bash
docker ps | grep mongodb
# Should show: mongodb running on 27017
```

### Step 2: Test Backend Connection
```bash
cd c:\projects\LLB\backend

# Install dependencies (first time only)
npm install

# Check if it compiles
npx tsc --noEmit

# If OK, start dev server
npm run dev
```

**Expected output:**
```
============================================================
LLB Knowledge Platform - Backend Server
============================================================
✓ Server running on http://localhost:5000
✓ Environment: development
✓ API: http://localhost:5000/api
✓ Database: Connected
============================================================
```

### Step 3: Test API
```bash
# In another terminal
curl http://localhost:5000/api/health

# Should return:
{
  "status": "ok",
  "timestamp": "2026-08-11T...",
  "uptime": ...,
  "database": "Connected"
}
```

### Step 4: Setup Python
```bash
cd c:\projects\LLB\scripts

# Create virtual environment
python -m venv venv

# Activate
venv\Scripts\activate

# Install packages
pip install -r requirements.txt

# Test
python -c "import pdfplumber, pymongo, nltk; print('✓ All packages installed')"
```

---

## 📊 Checklist

### Database Setup
- [ ] MongoDB running in Docker
- [ ] Database models created
- [ ] Database config working
- [ ] Connection pooling setup

### Backend Setup
- [ ] Package dependencies installed
- [ ] TypeScript compiles without errors
- [ ] Dev server runs (`npm run dev`)
- [ ] API endpoints responding
- [ ] Database connection successful

### Python Setup
- [ ] Virtual environment created
- [ ] Dependencies installed
- [ ] pdfplumber working
- [ ] MongoDB connection working

### Configuration
- [ ] `.env` file created with correct values
- [ ] MongoDB URI points to local instance
- [ ] API port 5000 available
- [ ] Python venv activated when running scripts

---

## 🆘 Troubleshooting

### MongoDB Connection Fails
```bash
# Check if running
docker ps | grep mongodb

# If not running, start it
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Check logs
docker logs mongodb
```

### Backend won't start
```bash
# Delete node_modules and reinstall
cd backend
rm -r node_modules package-lock.json
npm install
npm run dev
```

### Python import errors
```bash
# Verify virtual environment is activated
python --version  # Should be 3.13+

# Reinstall packages
pip install --upgrade -r requirements.txt
```

### Port already in use
```bash
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <PID> /F
```

---

## ✨ Success Criteria

You'll know Week 1 is complete when:

1. ✅ MongoDB is running and accessible
2. ✅ Backend starts without errors
3. ✅ API endpoints respond
4. ✅ Database connection shows "Connected"
5. ✅ Python environment is ready
6. ✅ All imports work in Python

---

## 📝 Notes

- MongoDB data will be stored in Docker volume (persists)
- Backend API runs on http://localhost:5000
- Frontend will run on http://localhost:3000 (next week)
- Python scripts will extract questions into `extracted_questions/` folder
- Keep terminal windows open for MongoDB and Backend during development

---

## 🎯 Next Week Preview

Once Week 1 is done:
- Run full question extraction
- Verify questions in MongoDB
- Build API routes for filtering/searching
- Start frontend integration

---

**Ready to start?** Begin with **"Immediate Actions"** above!

