# Setup, Deployment & Troubleshooting Guide

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 16+ installed
- MongoDB 4.4+ running locally or remote connection string
- npm or yarn package manager

### Step-by-Step Setup

**1. Navigate to backend directory**
```bash
cd backend
```

**2. Install dependencies**
```bash
npm install
```

**3. Create .env file**
```bash
# backend/.env
MONGODB_URI=mongodb://localhost:27017/llb
PORT=6000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

**4. Build TypeScript**
```bash
npm run build
```

**5. Start development server**
```bash
npm run dev
```

Server will start on `http://localhost:6000`

**6. Verify backend is running**
```bash
curl http://localhost:6000/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-08-12T10:30:00Z",
  "uptime": 123.45,
  "database": "Connected",
  "plugins": {
    "total": 4,
    "enabled": 4,
    "plugins": [...]
  }
}
```

---

## 📦 Database Setup

### Option 1: MongoDB Community Edition (Local)

**Windows:**
1. Download from https://www.mongodb.com/try/download/community
2. Run installer
3. MongoDB runs on `mongodb://localhost:27017`

**Alternative with Docker:**
```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest
```

### Option 2: MongoDB Atlas (Cloud)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Update `.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/llb
```

### Initialize Database

**1. Create indexes** (automatic on first run)
**2. Load test data** (optional):

```bash
# Create script: backend/scripts/seed-data.ts
npx ts-node scripts/seed-data.ts
```

### Create the initial administrator

Public registration intentionally creates only standard `student` accounts. Do not add `role=admin` to the registration request: the server ignores client-supplied privilege escalation and the Admin routes require the `admin` role.

After configuring `backend/.env` with the correct `MONGODB_URI` and a secure `JWT_SECRET`, create the first administrator from the backend directory:

```bash
cd backend
npm run admin:create
```

The command interactively asks for the administrator name, email, password, and a confirmation phrase. Password input is hidden. It creates a new active, verified `admin` account using the existing bcrypt password hook. It will not overwrite, promote, reactivate, or change the password of an existing account. If the email already belongs to an active administrator, the command is an idempotent no-op; for any other existing account it exits without changes.

For automated deployments, provide `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` through the deployment platform's secret manager, and set `ADMIN_CONFIRM=CREATE ADMIN`. Do not put the password in source control, a Dockerfile, a committed `.env` file, or a normal shell command that will be saved in history. Clear injected environment variables after the one-shot command when your deployment system does not manage them automatically.

The role boundaries are:

- `student`: default public-registration role with standard learner features.
- `instructor`: privileged role for features explicitly allowing instructors.
- `admin`: required for the `/admin` dashboard and every `/api/admin/*` endpoint.

The backend reloads the current role and active status from MongoDB on every authenticated request, so changing an account's role or deactivating it takes effect even if an older token exists.

---

## 🚀 Production Deployment

### Option 1: AWS EC2

**1. Launch EC2 instance (Ubuntu 22.04)**
```bash
# SSH into instance
ssh -i key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
sudo apt-get install -y mongodb-server

# Clone repository
git clone your-repo-url
cd LLB/backend
```

**2. Install PM2 for process management**
```bash
sudo npm install -g pm2

# Start application
pm2 start npm --name "llb-backend" -- run dev

# Make it persistent
pm2 startup
pm2 save
```

**3. Set up Nginx reverse proxy**
```bash
sudo apt-get install -y nginx

# Create config file
sudo nano /etc/nginx/sites-available/default
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:6000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**4. Enable HTTPS with Let's Encrypt**
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 2: Docker Deployment

**1. Create Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 6000

CMD ["npm", "start"]
```

**2. Create docker-compose.yml**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./backend
    ports:
      - "6000:6000"
    environment:
      MONGODB_URI: mongodb://admin:password@mongodb:27017/llb
      NODE_ENV: production
    depends_on:
      - mongodb
    volumes:
      - ./backend:/app

volumes:
  mongodb_data:
```

**3. Deploy**
```bash
docker-compose up -d
```

### Option 3: Heroku

**1. Create Procfile** (backend/Procfile)
```
web: npm run build && npm start
```

**2. Deploy**
```bash
heroku login
heroku create your-app-name
heroku config:set MONGODB_URI=your-mongodb-uri
git push heroku main
```

---

## 🔧 Troubleshooting

### Issue: MongoDB Connection Failed

**Error:**
```
MongoDB connection failed: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
1. Check MongoDB is running:
   ```bash
   # Windows
   mongosh
   
   # Linux
   sudo systemctl status mongod
   ```

2. Verify connection string in `.env`

3. If using MongoDB Atlas, check:
   - IP whitelist includes your IP (0.0.0.0/0 for development only)
   - Connection string is correct
   - Network connectivity

### Issue: Port Already in Use

**Error:**
```
listen EADDRINUSE: address already in use :::6000
```

**Solution:**
```bash
# Windows - Find and kill process on port 6000
netstat -ano | findstr :6000
taskkill /PID <PID> /F

# Linux
lsof -i :6000
kill -9 <PID>

# Or use different port
PORT=6001 npm run dev
```

### Issue: CORS Error

**Error:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:**
1. Check `.env` CORS_ORIGIN matches frontend:
   ```
   CORS_ORIGIN=http://localhost:3000
   ```

2. For production, set specific domain:
   ```
   CORS_ORIGIN=https://yourdomain.com
   ```

3. Update index.ts if needed:
   ```typescript
   app.use(cors({
     origin: [
       'http://localhost:3000',
       'https://yourdomain.com'
     ],
     credentials: true
   }));
   ```

### Issue: TypeScript Compilation Errors

**Solution:**
```bash
# Clean build
rm -rf dist
npm run build

# Check for type errors
npm run build -- --noEmit

# Reset node_modules if needed
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Out of Memory

**Error:**
```
JavaScript heap out of memory
```

**Solution:**
```bash
# Increase Node memory limit
NODE_OPTIONS=--max-old-space-size=4096 npm run dev
```

### Issue: Answer Generation is Slow

**Solution:**
1. Add caching layer (Redis):
   ```bash
   npm install redis
   ```

2. Index database queries:
   ```bash
   # In MongoDB Compass or shell
   db.answers.createIndex({ questionId: 1, type: 1 })
   ```

3. Implement pagination for large results

---

## 📊 Monitoring & Logs

### View Application Logs

**Development:**
```bash
npm run dev 2>&1 | tee app.log
```

**Production (PM2):**
```bash
pm2 logs llb-backend
pm2 logs llb-backend --err
```

**Docker:**
```bash
docker-compose logs -f backend
```

### Monitor Performance

```bash
# Check memory usage
pm2 monit

# MongoDB connection pool
# Add to mongoose connection
mongoose.set('debug', process.env.NODE_ENV === 'development');
```

### Database Monitoring

```bash
# Connect to MongoDB and check stats
mongosh

# View collection sizes
db.answers.stats()
db.quizzes.stats()

# View slow queries
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().limit(10).sort({ts: -1})
```

---

## 🔄 Updates & Maintenance

### Deploy New Version

**Development to Production:**
```bash
# 1. Build locally
npm run build

# 2. Test locally
npm run dev

# 3. Commit and push
git add .
git commit -m "Feature: Add new quiz statistics"
git push

# 4. Pull on production server
ssh user@server "cd ~/LLB/backend && git pull origin main"

# 5. Install new dependencies if needed
npm install

# 6. Rebuild
npm run build

# 7. Restart service
pm2 restart llb-backend
```

### Database Backup

```bash
# Backup MongoDB (local)
mongodump --out ./backup/$(date +%Y%m%d)

# Restore from backup
mongorestore --dir ./backup/20260812

# With Atlas, automatic backups included
```

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update specific package
npm update express

# Update all (carefully!)
npm update
npm run build
npm test  # if tests exist
```

---

## 🧪 Testing

### Manual API Testing

**Using cURL:**
```bash
# Generate short answer
curl -X POST http://localhost:6000/api/answers/generate/short \
  -H "Content-Type: application/json" \
  -d '{"questionId": "test-question-id"}'

# Create quiz
curl -X POST http://localhost:6000/api/quizzes/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Quiz",
    "subject": "TEST",
    "semester": 1,
    "difficulty": "beginner",
    "questionIds": ["q1", "q2"],
    "createdBy": "test-admin"
  }'
```

**Using Postman:**
1. Import the API collection (if provided)
2. Set base URL: `http://localhost:6000`
3. Test each endpoint

---

## 📋 Checklist Before Production

- [ ] Environment variables configured in production
- [ ] MongoDB backup strategy in place
- [ ] HTTPS/SSL certificate installed
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Error logging setup
- [ ] Performance monitoring active
- [ ] Database indexes created
- [ ] Node.js version consistent
- [ ] npm dependencies pinned to versions
- [ ] Build process automated
- [ ] Recovery plan documented

---

## 🎯 Performance Optimization Tips

### Database Optimization
```typescript
// Use lean() for read-only queries
const answers = await Answer.find({}).lean();

// Use select to limit fields
const answers = await Answer.find({}).select('text keyPoints -_id');

// Use aggregation for complex queries
await Answer.aggregate([
  { $match: { type: 'long' } },
  { $group: { _id: '$difficulty', count: { $sum: 1 } } }
]);
```

### API Optimization
```typescript
// Add caching
import Redis from 'redis';
const redis = new Redis();

// Cache quiz list
const cacheKey = `quizzes:${subject}:${semester}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Compress responses
app.use(compression());

// Add pagination
const skip = (page - 1) * limit;
const answers = await Answer.find().skip(skip).limit(limit);
```

### Frontend Optimization
```typescript
// Lazy load routes
const AnswerView = lazy(() => import('./components/AnswerView'));

// Image optimization
<Image
  src="/banner.jpg"
  alt="Banner"
  width={1200}
  height={600}
  priority
/>
```

---

## 📞 Support Resources

- **Node.js Docs**: https://nodejs.org/docs/
- **MongoDB Manual**: https://docs.mongodb.com/manual/
- **Express.js Guide**: https://expressjs.com/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Mongoose Docs**: https://mongoosejs.com/

---

**Last Updated:** August 12, 2026  
**Status:** Production Ready ✅
