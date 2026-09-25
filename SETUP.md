# Setup Guide - LLB Knowledge Platform

Complete setup instructions for developing and running the LLB Knowledge Platform.

## 📋 Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **Python** 3.13+ ([download](https://www.python.org/))
- **MongoDB** (local or [Atlas](https://www.mongodb.com/cloud/atlas))
- **Git**
- **Code Editor** (VS Code recommended)

## 🚀 Quick Start (5 minutes)

### 1. Clone & Setup

```bash
cd c:\projects\LLB

# Copy environment template
copy .env.example .env
# Edit .env with your configuration
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..

# Python (optional, for content generation)
python -m venv venv
venv\Scripts\activate
pip install -r scripts/requirements.txt
```

### 3. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

**Terminal 3 - MongoDB** (if running locally):
```bash
# Windows with MongoDB installed
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

Visit `http://localhost:3000` in your browser.

---

## 🔧 Detailed Setup

### MongoDB Setup

#### Option A: Local MongoDB

1. [Download MongoDB Community](https://www.mongodb.com/try/download/community)
2. Install and run
3. Update `.env`:
   ```
   BACKEND_MONGODB_URI=mongodb://localhost:27017/llb_platform
   ```

#### Option B: MongoDB Atlas (Cloud)

1. Create account at [mongodb.com](https://www.mongodb.com/)
2. Create cluster and get connection string
3. Update `.env`:
   ```
   BACKEND_MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/llb_platform?retryWrites=true&w=majority
   ```

#### Option C: Docker

```bash
# Start MongoDB container
docker run -d \
  -p 27017:27017 \
  --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:7.0

# Update .env
# BACKEND_MONGODB_URI=mongodb://root:password@localhost:27017/llb_platform?authSource=admin
```

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
copy .env.example .env

# Edit .env with your configuration:
# - MONGODB_URI
# - JWT_SECRET (generate a secure random string)
# - PORT (default: 5000)

# Start development server
npm run dev

# In another terminal, test the API
curl http://localhost:5000/api/health
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
copy .env.example .env.local

# Edit .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Start development server
npm run dev

# Open http://localhost:3000
```

### Python Content Generation

```bash
# Create virtual environment
python -m venv venv

# Activate
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r scripts/requirements.txt

# Set up API keys
# Add to your .env file:
# GEMINI_API_KEY=your_key_from_https://aistudio.google.com/app/apikey
# or
# OPENAI_API_KEY=your_key_from_https://platform.openai.com/api-keys

# Generate content
python scripts/generate.py

# Or generate specific content
python scripts/generate.py --tasks mcqs flashcards

# See all options
python scripts/generate.py --help
```

---

## 📁 Environment Variables

### Backend (.env or backend/.env)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/llb_platform
JWT_SECRET=your_super_secret_key_here_min_32_chars
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
CONTENT_DIR=../generated
```

### Frontend (.env.local or frontend/.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Generation (.env in root)

```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-1.5-flash
```

---

## ✅ Verify Installation

### Check Backend
```bash
cd backend
npm run build

# Test API
curl http://localhost:5000/api/health
```

Output should be:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 12.345
}
```

### Check Frontend
```bash
cd frontend
npm run build
```

Should complete without errors.

### Check MongoDB Connection
```bash
# In backend terminal, check logs for:
# ✓ Connected to MongoDB
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (Windows)
taskkill /PID <PID> /F

# Or use different port
PORT=5001 npm run dev
```

### MongoDB Connection Failed

1. Verify MongoDB is running: `mongosh` or `mongo` command
2. Check connection string in .env
3. For Atlas, whitelist your IP
4. Check credentials are correct

### Node Modules Issues

```bash
# Clean install
rm -r node_modules package-lock.json
npm install
```

### Port 3000 conflicts

```bash
cd frontend
PORT=3001 npm run dev
```

### CORS Errors

Make sure `CORS_ORIGIN` in backend matches your frontend URL:
```env
# If frontend is on http://localhost:3001
CORS_ORIGIN=http://localhost:3001
```

---

## 🐳 Docker Setup

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Remove volumes (careful - deletes database)
docker-compose down -v
```

---

## 📚 Next Steps

1. **Generate Content**: Run `python scripts/generate.py`
2. **Create API Endpoints**: Add routes in `backend/src/routes/`
3. **Build UI Components**: Create components in `frontend/components/`
4. **Deploy**: Push to production services (Vercel, Railway, etc.)

See `DEVELOPMENT.md` for coding guidelines and architecture.

---

## 💡 Tips

- **Hot Reload**: Both frontend and backend support hot reload during development
- **Database Admin**: Use MongoDB Compass for GUI database management
- **API Testing**: Use Postman or curl for API testing
- **Logs**: Check terminal output for detailed error messages
- **Type Checking**: Run `npm run type-check` to verify TypeScript types

---

## 🆘 Need Help?

1. Check logs in terminal for error messages
2. Review environment variables in .env files
3. Verify all services are running (MongoDB, Backend, Frontend)
4. Check network connectivity
5. Clear browser cache (Ctrl+Shift+Delete)

Good luck! 🚀
