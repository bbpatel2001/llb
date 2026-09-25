# LLB Knowledge Platform - React Frontend Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend running on `http://localhost:6000`

### Installation & Run (3 Steps)

```bash
# 1. Navigate to react-frontend
cd c:\projects\LLB\react-frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Frontend will be available at: **http://localhost:6001**

---

## 📁 Project Structure

```
react-frontend/
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── Layout/              # Header, Footer
│   │   ├── Common/              # LoadingSpinner, ErrorMessage
│   │   ├── Papers/              # PaperCard, PaperList, PaperFilters
│   │   ├── Questions/           # QuestionCard, QuestionList
│   │   ├── Answers/             # AnswerView, AnswerList
│   │   ├── Flashcards/          # FlashcardCard, FlashcardViewer
│   │   ├── CaseLaws/            # CaseLawCard, CaseLawList
│   │   └── Dashboard/           # StatsCard
│   ├── pages/                   # Page components (routes)
│   │   ├── Home.tsx             # Landing page
│   │   ├── PapersPage.tsx       # Browse papers
│   │   ├── StudyPage.tsx        # Study materials
│   │   ├── FlashcardsPage.tsx   # Flashcard viewer
│   │   ├── CaseLawsPage.tsx     # Case laws
│   │   ├── DashboardPage.tsx    # Statistics
│   │   └── NotFound.tsx         # 404 page
│   ├── hooks/                   # Custom React hooks
│   │   └── useApi.ts            # API calls hook
│   ├── lib/                     # Utilities
│   │   ├── api.ts               # API client (axios)
│   │   └── utils.ts             # Helper functions
│   ├── types/                   # TypeScript types
│   │   └── index.ts             # Type definitions
│   ├── App.tsx                  # Main app with routes
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles + Tailwind
├── public/
├── index.html                   # HTML template
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite config
├── tailwind.config.js           # Tailwind config
├── postcss.config.js            # PostCSS config
└── .env.local                   # Environment variables
```

---

## 🎨 Available Pages & Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Home | Landing page, features overview |
| `/dashboard` | DashboardPage | Statistics and platform overview |
| `/papers` | PapersPage | Browse all question papers |
| `/papers/:paperId` | StudyPage | Study materials for specific paper |
| `/study` | StudyPage | General study materials |
| `/flashcards` | FlashcardsPage | Interactive flashcard viewer |
| `/case-laws` | CaseLawsPage | Browse case laws |
| `*` | NotFound | 404 page |

---

## 🔌 API Integration

Backend must be running at: `http://localhost:6000`

### API Endpoints Used

**Papers API**
- `GET /api/papers` - List papers with pagination
- `GET /api/papers?semester=1&skip=0&limit=20`

**Questions API**
- `GET /api/questions/semester/:semester` - Get questions by semester

**Answers API**
- `GET /api/answers/paper/:paperId` - Get answers for a paper
- `GET /api/answers/paper/:paperId?type=long` - Filter by answer type

**Statistics API**
- `GET /api/stats` - Get platform statistics

**Health Check**
- `GET /api/health` - Server health status

### API Client Usage

```typescript
import { papersApi, questionsApi, answersApi, statsApi } from '@/lib/api';

// Get papers
const response = await papersApi.getAll(skip, limit, semester);

// Get questions
const questions = await questionsApi.getBySemester(1);

// Get answers
const answers = await answersApi.getByPaper(paperId, type);

// Get stats
const stats = await statsApi.getOverview();
```

---

## 🛠️ Development Commands

```bash
# Start dev server (auto-reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Fix linting errors
npm run lint -- --fix
```

---

## 🎯 Key Components

### Layout Components
- **Header** - Navigation bar with logo and menu
- **Footer** - Footer with links and info

### Common Components
- **LoadingSpinner** - Loading state indicator
- **ErrorMessage** - Error display with retry
- **EmptyState** - No data state

### Feature Components
- **PaperCard** - Single paper preview
- **PaperList** - Grid of papers
- **PaperFilters** - Search and filter papers
- **QuestionCard** - Single question with details
- **QuestionList** - List of questions
- **AnswerView** - Display single answer
- **AnswerList** - List of answers
- **FlashcardCard** - Flip card with Q&A
- **FlashcardViewer** - Carousel of flashcards
- **CaseLawCard** - Case law preview
- **CaseLawList** - Grid of case laws
- **StatsCard** - Statistics display

---

## 🎨 Styling

Uses **Tailwind CSS** for styling.

### Color Scheme
```
Primary: #0284c7 (Sky Blue)
Green:   #16a34a
Blue:    #2563eb
Purple:  #7c3aed
Red:     #dc2626
Gray:    #6b7280
```

### Common Tailwind Classes
```
Button: px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700
Card:   bg-white rounded-lg shadow hover:shadow-lg
Input:  px-4 py-2 border border-gray-300 rounded-lg focus:ring-2
```

---

## 🔐 Environment Variables

Create `.env.local`:
```env
VITE_API_URL=http://localhost:6000
VITE_APP_NAME=LLB Knowledge Platform
VITE_APP_ENV=development
```

---

## 📦 Dependencies

### Core
- react@18.2.0
- react-dom@18.2.0
- react-router-dom@6.20.0

### Styling
- tailwindcss@3.4.0
- lucide-react@0.294.0 (Icons)

### Utilities
- axios@1.6.0 (HTTP client)
- clsx@2.0.0 (Class names)

### Dev Tools
- typescript@5.2.2
- vite@5.0.8
- eslint@8.55.0

---

## 🚀 Deployment

### Production Build
```bash
npm run build
```

Outputs to `dist/` directory.

### Deploy to Vercel
```bash
vercel
```

### Deploy to Netlify
```bash
netlify deploy --prod --dir dist
```

---

## 🐛 Troubleshooting

### Port 3000 already in use?
```bash
# Change port in vite.config.ts
server: {
  port: 3001
}
```

### API connection failed?
- Ensure backend is running on port 6000
- Check `VITE_API_URL` in `.env.local`
- Check browser console for CORS errors

### Build fails?
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
npm run build
```

### Hot reload not working?
- Restart dev server
- Clear browser cache
- Check for port conflicts

---

## 📱 Responsive Design

- Mobile (< 640px): Single column, hamburger menu
- Tablet (640px - 1024px): 2 columns, responsive layouts
- Desktop (> 1024px): Full grid, optimized spacing

---

## ⚡ Performance Tips

1. **Code Splitting** - Routes are naturally split with React Router
2. **Lazy Loading** - Components load on demand
3. **Image Optimization** - Use responsive images
4. **Caching** - Browser caches static assets
5. **Bundle Size** - Monitor with `npm run build`

---

## 🔍 Code Quality

- **TypeScript** - Full type safety
- **ESLint** - Code linting and standards
- **Prettier** - Code formatting (configure in `.prettierrc`)

---

## 📚 Useful Resources

- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [React Router Docs](https://reactrouter.com)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [TypeScript Docs](https://www.typescriptlang.org)

---

## 🆘 Getting Help

1. Check the console for error messages
2. Review `.env.local` configuration
3. Ensure backend is running and healthy
4. Check API endpoints in browser DevTools
5. Review component documentation in README

---

## ✅ Checklist Before Deployment

- [ ] Build succeeds (`npm run build`)
- [ ] No console errors in dev mode
- [ ] All routes work correctly
- [ ] Backend API is accessible
- [ ] Environment variables are set
- [ ] Mobile responsive design looks good
- [ ] Linting passes (`npm run lint`)
- [ ] Tests pass (if applicable)

---

## 🎉 Next Steps

1. ✅ Frontend is ready!
2. Ensure backend is running
3. Start dev server: `npm run dev`
4. Visit http://localhost:6001
5. Explore the platform!

---

**Happy Coding! 🚀**
