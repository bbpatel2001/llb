# 🚀 LLB Hybrid Setup Guide - WordPress + Node.js

## ✅ Architecture is Ready!

```
WordPress (Frontend UI)           Node.js Backend (APIs)          MongoDB (Database)
┌──────────────────┐              ┌──────────────────┐            ┌──────────────────┐
│  Theme & Plugin  │ ──HTTP──────>│  Express Server  │ ──Query──>│  Question Data   │
│  Shortcodes      │   (REST)     │  Port 6000       │           │  Answers         │
│  Admin Panel     │              │  APIs            │           │  Quizzes         │
└──────────────────┘              └──────────────────┘            └──────────────────┘
```

---

## 📋 What's Been Created

### 1. **WordPress Plugin Files** (PHP)
- `class-llb-api-client.php` - Connects to Node.js backend
- `class-llb-shortcodes.php` - Display questions/answers/quizzes
- Both loaded in main plugin file

### 2. **WordPress Frontend**
- Display questions with metadata
- Show answers with case references and acts
- Display quizzes
- Show backend status

### 3. **Node.js Backend** (Already exists)
- 26 REST API endpoints
- Answer generation service
- Quiz management service
- Auto-grading system

---

## 🚀 QUICK START (3 Steps)

### Step 1: Start Node.js Backend
```bash
cd C:\projects\LLB\backend

# First time only
npm install
npm run build

# Start backend
npm run dev

# Check: http://localhost:6000/api/health should show ✅ status
```

### Step 2: Configure MongoDB
Choose ONE option:

**Option A: MongoDB Atlas (Cloud - FREE)**
```
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free)
3. Create a cluster
4. Get connection string: mongodb+srv://user:pass@cluster.mongodb.net/llb
5. Copy to: C:\projects\LLB\backend\.env (MONGODB_URI)
```

**Option B: Local MongoDB**
```bash
# Install MongoDB Community Edition
# https://www.mongodb.com/try/download/community

# Start MongoDB
mongosh

# Connection string: mongodb://localhost:27017/llb
```

### Step 3: WordPress Plugin is Ready
- Plugin is already configured to call Node.js on `http://localhost:6000`
- Use shortcodes in WordPress pages:

```
[llb_backend_status]  - Show if backend is online
[llb_question id="123"] - Display a question
[llb_answer question_id="123" type="short"] - Show answer
[llb_quiz id="quiz123"] - Display quiz
```

---

## 📝 How to Use in WordPress

### Display a Question
```html
[llb_question id="507f1f77bcf86cd799439011"]
```

### Display Answer
```html
[llb_answer question_id="507f1f77bcf86cd799439011" type="short"]
```

Available types: `short`, `long`, `mcq`, `case_study`

### Display Quiz
```html
[llb_quiz id="quiz-id-from-node"]
```

### Show Backend Status
```html
[llb_backend_status]
```

---

## 🔌 API Endpoints (Node.js)

All available endpoints:

### **Answer APIs**
- `POST /api/answers/generate/short` - Generate short answer
- `POST /api/answers/generate/long` - Generate long answer
- `POST /api/answers/generate/mcq` - MCQ answer
- `POST /api/answers/generate/case-study` - Case study
- `GET /api/answers/:questionId` - Get all answers
- [11 more endpoints...]

### **Quiz APIs**
- `POST /api/quizzes/create` - Create quiz
- `POST /api/quizzes/auto-generate` - Auto-generate quiz
- `GET /api/quizzes` - List quizzes
- `POST /api/quizzes/:id/start` - Start attempt
- `POST /api/quizzes/attempts/:id/answer` - Submit answer
- `POST /api/quizzes/attempts/:id/submit` - Submit quiz
- `GET /api/quizzes/attempts/:id/results` - Get results
- [4 more endpoints...]

---

## 📊 Complete Workflow

### **Admin Creates Quiz**
```bash
curl -X POST http://localhost:6000/api/quizzes/auto-generate \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Constitutional Law Quiz",
    "subject": "CONSTITUTIONAL LAW",
    "semester": 1,
    "totalQuestions": 10,
    "difficulty": "intermediate",
    "createdBy": "admin-123"
  }'

# Returns: {"quiz": {"_id": "quiz-123", ...}}
```

### **WordPress Shows Quiz**
```html
<!-- In WordPress page -->
[llb_quiz id="quiz-123"]

<!-- Renders button: "Take Quiz" -->
```

### **Student Takes Quiz**
```javascript
// JavaScript calls Node.js API
POST /api/quizzes/quiz-123/start
  → Returns: {"attemptId": "attempt-123"}

POST /api/quizzes/attempts/attempt-123/answer
  → Submit each question answer

POST /api/quizzes/attempts/attempt-123/submit
  → Returns: {"score": 85, "percentage": 85, "feedback": "Good!"}
```

### **WordPress Shows Results**
```html
<!-- Results displayed on page -->
Score: 85/100
Percentage: 85%
Feedback: "Good! You have a solid understanding..."
```

---

## 🛠️ File Structure

```
C:\projects\LLB\
├── backend/                              (Node.js Backend)
│   ├── src/
│   │   ├── models/                       (MongoDB schemas)
│   │   ├── services/                     (Business logic)
│   │   ├── routes/                       (API endpoints)
│   │   └── index.ts                      (Express server)
│   ├── .env                              (Configuration)
│   └── package.json
│
├── plugins/
│   └── llb-knowledge-platform/          (WordPress Plugin)
│       ├── inc/
│       │   ├── class-llb-api-client.php   ← Connects to Node.js
│       │   ├── class-llb-shortcodes.php   ← WordPress shortcodes
│       │   └── ...
│       ├── assets/
│       │   ├── css/llb-frontend.css      ← Styling
│       │   └── js/
│       └── llb-knowledge-platform.php   ← Main plugin
│
└── themes/
    └── education-zone-llb/               (WordPress Theme)
        ├── functions.php
        ├── template-parts/
        └── ...
```

---

## 🔧 Configuration

### WordPress Plugin API Client
Location: `plugins/llb-knowledge-platform/inc/class-llb-api-client.php`

Default API URL: `http://localhost:6000/api`

To change for production:
```php
// In WordPress admin or functions.php
LLB_API_Client::set_api_url( 'https://api.yourdomain.com' );
```

### Node.js Backend Configuration
Location: `backend/.env`

```ini
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/llb

# Server
PORT=6000
NODE_ENV=development

# CORS - Allow WordPress domain
CORS_ORIGIN=http://localhost
```

For production:
```ini
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/llb
PORT=6000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

---

## 🧪 Testing

### 1. Check Backend is Running
```bash
curl http://localhost:6000/api/health
# Should return: {"status": "ok", ...}
```

### 2. Check Connection from WordPress
```php
// In WordPress admin
echo LLB_API_Client::get_backend_status();  
// Should return: "online"
```

### 3. Generate an Answer
```bash
curl -X POST http://localhost:6000/api/answers/generate/short \
  -H "Content-Type: application/json" \
  -d '{"questionId": "some-question-id"}'
```

### 4. Create a Quiz
```bash
curl -X POST http://localhost:6000/api/quizzes/auto-generate \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Quiz",
    "subject": "CONTRACT LAW",
    "semester": 1,
    "totalQuestions": 5,
    "difficulty": "beginner",
    "createdBy": "admin"
  }'
```

---

## 📈 Scaling to Production

### When Ready for Production:

1. **Deploy Node.js Backend**
   - Option: AWS EC2, Heroku, DigitalOcean, Azure
   - See: `backend/SETUP_AND_DEPLOYMENT.md`

2. **Update WordPress Configuration**
   ```php
   LLB_API_Client::set_api_url( 'https://api.yourdomain.com' );
   ```

3. **MongoDB Atlas Connection**
   - Already cloud-hosted, just update connection string

4. **Enable HTTPS**
   - Both WordPress and Node.js need HTTPS

5. **Add Rate Limiting**
   - Protect APIs from abuse

---

## ✅ Checklist

- [ ] Node.js running: `npm run dev` in backend folder
- [ ] MongoDB configured (.env file)
- [ ] Backend health check passes: `http://localhost:6000/api/health`
- [ ] WordPress plugin activated
- [ ] Shortcodes working in WordPress
- [ ] Can create quiz via API
- [ ] Can generate answers via API
- [ ] Quiz attempt workflow tested

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check if port 6000 is in use
netstat -ano | findstr :6000

# Kill process
taskkill /PID <PID> /F

# Start again
npm run dev
```

### MongoDB Connection Failed
```
Error: connect ECONNREFUSED

Solutions:
1. Check MongoDB is running (local) or credentials (Atlas)
2. Verify connection string in .env
3. Check firewall/network access
```

### WordPress Can't Reach Backend
```
In WordPress admin, check: LLB_API_Client::get_backend_status()

Solutions:
1. Verify backend URL is correct
2. Check CORS_ORIGIN in .env matches WordPress domain
3. Verify no firewall blocking port 6000
```

### Shortcode Not Working
```
[llb_question id="123"] shows nothing

Solutions:
1. Check question ID is correct
2. Verify backend is online
3. Check browser console for errors
```

---

## 📚 Additional Resources

- **Backend API Docs**: `backend/BACKEND_COMPLETION_GUIDE.md`
- **Deployment Guide**: `backend/SETUP_AND_DEPLOYMENT.md`
- **Architecture**: `ARCHITECTURE_CLARIFICATION.md`
- **Node.js Docs**: https://nodejs.org/docs
- **MongoDB Docs**: https://docs.mongodb.com

---

## 🎯 Next Steps

1. **Start Backend**: `npm run dev`
2. **Setup MongoDB**: Get connection string
3. **Test APIs**: Verify health endpoint
4. **Use Shortcodes**: In WordPress pages
5. **Create Content**: Questions, quizzes, answers
6. **Deploy**: When ready for production

---

**Status**: ✅ **HYBRID SYSTEM READY TO USE!**

Start Node.js backend and begin creating content! 🚀
