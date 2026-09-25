# ⚡ LLB Platform - QUICK START (5 Minutes)

## 🎯 In 5 Minutes - Get Everything Running!

### Step 1: Backend (Terminal 1) - 1 minute
```bash
cd c:\projects\LLB\backend
npm install  # Only first time (or skip if already done)
npm run dev
```
✅ Backend ready at: http://localhost:6000

### Step 2: Frontend (Terminal 2) - 1 minute
```bash
cd c:\projects\LLB\react-frontend
npm install  # Only first time
npm run dev
```
✅ Frontend ready at: http://localhost:6001

### Step 3: MongoDB (Terminal 3 or Service) - 1 minute
```bash
# Make sure MongoDB is running locally
# Option A: If service is installed, it auto-starts
# Option B: Run manually
mongod
```
✅ Database ready at: mongodb://localhost:27017

### Step 4: Configure Environment - 1 minute
```bash
# Make sure .env files are set up
# Backend: c:\projects\LLB\backend\.env
# Frontend: c:\projects\LLB\react-frontend\.env.local
```

### Step 5: Access Platform - 1 minute
Open browser: **http://localhost:6001**

✅ **DONE!** Platform is running! 🎉

---

## 🎮 What Can You Do Now?

### 🏠 Home Page (/)
- See platform overview
- View features
- Check statistics

### 📚 Papers (/papers)
- Browse all papers
- Filter by semester
- Search for papers

### 📖 Study (/papers/:paperId)
- View study materials
- Filter by content type
- Read answers

### 🃏 Flashcards (/flashcards)
- Study with interactive cards
- Flip to see answers
- Navigate through deck

### ⚖️ Case Laws (/case-laws)
- Browse case laws
- Search cases
- Read judgments

### 📊 Dashboard (/dashboard)
- View statistics
- See question breakdown
- Check subjects

---

## 🛠️ Important Commands

### Frontend
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Check code quality
```

### Backend
```bash
npm run dev      # Start dev server
npm run build    # Build TypeScript
npm run start    # Run compiled version
npm run lint     # Check code quality
```

---

## 📁 Project Locations

```
Frontend:  c:\projects\LLB\react-frontend
Backend:   c:\projects\LLB\backend
Data:      c:\projects\LLB\data
Generated: c:\projects\LLB\extracted_questions
```

---

## 🌐 URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:6001 |
| Backend | http://localhost:6000 |
| API | http://localhost:6000/api |
| Health | http://localhost:6000/api/health |
| MongoDB | mongodb://localhost:27017 |

---

## ✅ Checklist

- [ ] Backend running on port 6000
- [ ] Frontend running on port 6001
- [ ] MongoDB running on port 27017
- [ ] Can open http://localhost:6001 in browser
- [ ] Papers page loads
- [ ] Dashboard shows statistics

---

## 🐛 Troubleshooting

### Port Already in Use?
```bash
# Find process on port
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Node Modules Error?
```bash
cd react-frontend
rm -r node_modules
npm install
npm run dev
```

### API Connection Failed?
- Check backend is running (port 6000)
- Check .env.local has correct API_URL
- Check CORS is enabled in backend

### MongoDB Connection Error?
- Make sure MongoDB is running
- Check port 27017 is not in use
- Try: `docker run -d -p 27017:27017 mongo:7.0`

---

## 📊 Platform Features

✅ **Core Features**
- Browse 200+ question papers
- Access 20,000+ study materials
- Multiple content formats
- Interactive flashcards
- Case law references
- Search & filter

✅ **Study Tools**
- Long answers
- Short answers
- MCQs
- Flashcards
- Case laws
- Revision notes

✅ **User Experience**
- Responsive design
- Fast loading
- Easy navigation
- Professional UI

---

## 🎓 Study Path

1. **Start**: Visit home page
2. **Browse**: Go to /papers
3. **Select**: Pick a paper
4. **Study**: Read study materials
5. **Learn**: Use flashcards
6. **Reference**: Check case laws
7. **Track**: View dashboard

---

## 💡 Tips

1. **Papers**: Filter by semester to find relevant papers
2. **Study**: Use flashcards daily for spaced repetition
3. **Search**: Use search to find specific topics
4. **Dashboard**: Check stats to understand coverage
5. **Mobile**: Platform is fully responsive on mobile

---

## 📚 Documentation

- Main: `00_START_HERE.md`
- Setup: `REACT_FRONTEND_SETUP.md`
- Full: `FULL_PLATFORM_SUMMARY.md`
- Quick: `QUICK_START.md` (This file)

---

## 🚀 Next Steps

### For Development
1. ✅ Run the platform (see above)
2. Start exploring features
3. Modify components as needed
4. Test with real data
5. Deploy when ready

### For Deployment
1. Build frontend: `npm run build`
2. Deploy to Vercel/Netlify
3. Deploy backend to Railway/Heroku
4. Configure MongoDB Atlas
5. Update environment variables

---

## 🎯 Success Checklist

- [ ] All 3 services running
- [ ] Can access http://localhost:6001
- [ ] Papers page shows content
- [ ] Flashcards work
- [ ] Dashboard loads stats
- [ ] No console errors

---

## ⚡ Performance Tips

- Use Chrome DevTools to check loading times
- Monitor API response times in Network tab
- Clear browser cache if things seem slow
- Rebuild if you make code changes

---

## 🤝 Support

If something doesn't work:
1. Check terminal output for errors
2. Verify ports are correct
3. Check MongoDB connection
4. Review .env files
5. Check browser console
6. Read documentation files

---

## 🎉 You're Ready!

**Your LLB Knowledge Platform is ready to use!**

```bash
# Quick start (copy & paste):
cd c:\projects\LLB\backend && npm run dev &
cd c:\projects\LLB\react-frontend && npm run dev &
docker run -d -p 27017:27017 --name mongodb mongo:7.0
# Then open: http://localhost:6001
```

**Happy Learning!** 🎓📚

---

**Last Updated**: August 12, 2026  
**Version**: 1.0  
**Status**: ✅ Ready to Go!
