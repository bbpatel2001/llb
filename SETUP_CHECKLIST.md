# Setup Checklist - Infrastructure Ready

**Goal**: Get the LLB Platform running in 30 minutes  
**Status**: Code & Documentation ✅ Complete

---

## ✅ Phase 1: Preparation (5 minutes)

- [ ] Download/clone the project
- [ ] Navigate to `c:\projects\LLB`
- [ ] Open terminal/command prompt
- [ ] Verify Docker is installed: `docker --version`
- [ ] Verify Node.js is installed: `node --version`
- [ ] Verify Python is installed: `python --version`

---

## ✅ Phase 2: Start MongoDB (5 minutes)

```bash
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

**Verification:**
```bash
docker ps | grep mongodb
# Should show "mongodb" running on port 27017
```

**Status**: [ ] Complete

---

## ✅ Phase 3: Setup Python Environment (10 minutes)

```bash
cd c:\projects\LLB\scripts

# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate  # Windows
# OR
source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt
```

**Verification:**
```bash
python -c "import pdfplumber, pymongo; print('✓ OK')"
```

**Status**: [ ] Complete

---

## ✅ Phase 4: Install Backend Dependencies (5 minutes)

```bash
cd c:\projects\LLB\backend

# Install npm packages
npm install
```

**Verification:**
```bash
npm ls express mongoose 2>/dev/null | grep -c "installed"
# Should show modules installed
```

**Status**: [ ] Complete

---

## ✅ Phase 5: Start Backend Server (2 minutes)

```bash
cd c:\projects\LLB\backend

# Start development server
npm run dev
```

**Expected Output:**
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

**Troubleshooting**: If MongoDB not showing "Connected", restart it:
```bash
docker restart mongodb
```

**Status**: [ ] Complete

---

## ✅ Phase 6: Test API Endpoints (3 minutes)

Open a **NEW terminal window** (keep backend running) and test:

### Test 1: Health Check
```bash
curl http://localhost:5000/api/health
```

**Expected**: `{"status":"ok", "database":"Connected", ...}`

**Status**: [ ] Complete

### Test 2: Get Papers
```bash
curl http://localhost:5000/api/papers
```

**Expected**: `{"papers":[], "total":0, ...}`

**Status**: [ ] Complete

### Test 3: API Documentation
```bash
curl http://localhost:5000/api
```

**Expected**: API endpoints listed

**Status**: [ ] Complete

---

## ✅ Phase 7: Verify File Structure

Check that these files exist:

**Backend:**
- [ ] `backend/src/config/database.ts`
- [ ] `backend/src/models/Question.ts`
- [ ] `backend/src/models/Paper.ts`
- [ ] `backend/src/models/ExtractionLog.ts`
- [ ] `backend/src/index.ts`

**Python:**
- [ ] `scripts/extract_questions.py`
- [ ] `scripts/requirements.txt`
- [ ] `scripts/venv/` (after pip install)

**Configuration:**
- [ ] `.env` (with MongoDB URI)
- [ ] `.env.example`

**Documentation:**
- [ ] `START_HERE_INFRASTRUCTURE.md`
- [ ] `WEEK1_SETUP_GUIDE.md`
- [ ] `EXTRACTION_ACTION_PLAN.md`

---

## ✅ Phase 8: Database Connection Test

With backend running, test MongoDB connection:

```python
python
>>> from pymongo import MongoClient
>>> client = MongoClient('mongodb://localhost:27017')
>>> db = client['llb']
>>> db.test.insert_one({"test": "data"})
>>> print("✓ MongoDB Connected!")
```

**Status**: [ ] Complete

---

## ✅ Final Checklist

### Services Running
- [ ] MongoDB running on port 27017
- [ ] Backend running on port 5000
- [ ] Python venv activated
- [ ] All dependencies installed

### APIs Working
- [ ] GET /api/health returns ✓
- [ ] GET /api/papers returns ✓
- [ ] GET /api/stats returns ✓
- [ ] Database shows "Connected"

### Files Ready
- [ ] All backend models created
- [ ] All API routes configured
- [ ] Python extraction script ready
- [ ] Configuration files present

### Documentation Reviewed
- [ ] START_HERE_INFRASTRUCTURE.md read
- [ ] WEEK1_SETUP_GUIDE.md available
- [ ] EXTRACTION_ACTION_PLAN.md available

---

## 🎯 Success Criteria

You've completed setup when:

✅ MongoDB is running  
✅ Backend server started successfully  
✅ API /health endpoint responds with "Connected"  
✅ Python environment ready with all packages  
✅ All files verified  

---

## ⏱️ Timeline Summary

```
| Task                    | Time  | Status |
|-------------------------|-------|--------|
| Preparation             | 5 min | [ ]    |
| MongoDB setup           | 5 min | [ ]    |
| Python environment      | 10 min| [ ]    |
| Backend install         | 5 min | [ ]    |
| Start backend           | 2 min | [ ]    |
| Test APIs               | 3 min | [ ]    |
| Verify files            | 2 min | [ ]    |
| Database test           | 2 min | [ ]    |
|                         |       |        |
| TOTAL                   | 34 min| [ ]    |
```

---

## 🆘 If Something Goes Wrong

### MongoDB Issues
**Problem**: "Cannot connect to MongoDB"  
**Solution**:
```bash
# Check if running
docker ps | grep mongodb

# Restart if needed
docker restart mongodb

# Or start fresh
docker rm mongodb
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

### Backend Issues
**Problem**: "npm install fails" or "Build errors"  
**Solution**:
```bash
cd backend
rm -r node_modules package-lock.json
npm install
npm run dev
```

### Python Issues
**Problem**: "Import errors" or "pip install fails"  
**Solution**:
```bash
cd scripts
rm -r venv
python -m venv venv
venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Port Already in Use
**Problem**: "Port 5000 already in use"  
**Solution**:
```bash
# Find process
netstat -ano | findstr :5000

# Kill process
taskkill /PID <PID> /F

# Start backend again
npm run dev
```

---

## 📚 What to Do Next

### After Setup is Complete
1. Read **WEEK1_SETUP_GUIDE.md** (comprehensive guide)
2. Read **EXTRACTION_PIPELINE_DESIGN.md** (architecture)
3. Read **EXTRACTION_ACTION_PLAN.md** (4-week plan)

### Next Week (Week 2)
1. Run Python extraction script
2. Extract questions from all 212 papers
3. Verify data in MongoDB
4. Test API with real data

### Week 3
1. Build advanced API routes
2. Create frontend pages
3. Implement search functionality

### Week 4
1. Performance optimization
2. Production deployment
3. Launch!

---

## 💡 Tips

- **Keep MongoDB running**: Don't close that terminal
- **Keep backend running**: Don't close that terminal either
- **Use new terminals**: Always open a new terminal for testing
- **Check logs**: Read error messages carefully
- **Document issues**: Take notes for troubleshooting

---

## ✨ Summary

**Time to complete**: ~30-35 minutes  
**Difficulty**: Easy (just follow the steps)  
**Outcome**: Fully functional backend with MongoDB & Python ready  
**Next step**: Extract questions from papers!

---

## 📞 Support

- **Setup Guide**: WEEK1_SETUP_GUIDE.md
- **Architecture**: EXTRACTION_PIPELINE_DESIGN.md
- **Roadmap**: EXTRACTION_ACTION_PLAN.md
- **Quick Start**: START_HERE_INFRASTRUCTURE.md

---

**Ready to begin? Start with Phase 1!** ✅

