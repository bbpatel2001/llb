# LLB Knowledge Platform - React Frontend

A modern React application for the LLB Knowledge Platform built with Vite, TypeScript, and Tailwind CSS.

## Features

- 📚 Browse and study from 100+ question papers
- 🃏 Interactive flashcard system with spaced repetition
- 📖 Multiple study formats (long answers, short answers, MCQs, case laws, etc.)
- ⚖️ Case law database and references
- 📊 Dashboard with platform statistics
- 🔍 Search and filter functionality
- 📱 Fully responsive design
- ⚡ Fast performance with Vite

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP client

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your API URL:
```env
# Leave empty to use the Vite proxy (frontend :6001 -> backend :6000)
VITE_API_URL=
# Docker Compose sets this to http://backend:6000; local development uses localhost.
VITE_API_PROXY_TARGET=http://localhost:6000
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:6001`

### Build

Build for production:
```bash
npm run build
```

### Lint

Run ESLint:
```bash
npm run lint
```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout/         # Header, Footer
│   ├── Common/         # Loading, Error states
│   ├── Papers/         # Paper-related components
│   ├── Questions/      # Question components
│   ├── Answers/        # Answer display components
│   ├── Flashcards/     # Flashcard components
│   ├── CaseLaws/       # Case law components
│   └── Dashboard/      # Dashboard components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and API client
├── types/              # TypeScript type definitions
└── App.tsx             # Main app component
```

## Available Pages

- **Home** (`/`) - Landing page with features and statistics
- **Dashboard** (`/dashboard`) - Platform overview and statistics
- **Papers** (`/papers`) - Browse all question papers
- **Study** (`/papers/:paperId` or `/study`) - Study materials for a paper
- **Flashcards** (`/flashcards`) - Interactive flashcard viewer
- **Case Laws** (`/case-laws`) - Browse case laws and judgments

## API Integration

The app connects to the backend API at `http://localhost:6000`. Ensure the backend is running before starting the frontend.

Key API endpoints:
- `GET /api/papers` - List papers
- `GET /api/questions/semester/:id` - Get questions by semester
- `GET /api/answers/paper/:id` - Get answers for a paper
- `GET /api/stats` - Platform statistics

## Component Hierarchy

```
App
├── Header
├── Routes
│   ├── Home
│   ├── Dashboard
│   ├── PapersPage
│   ├── StudyPage
│   ├── FlashcardsPage
│   ├── CaseLawsPage
│   └── NotFound
├── Footer
```

## Styling

Uses Tailwind CSS with a custom color scheme. Primary color is customized in `tailwind.config.js`.

### Color Palette

- **Primary**: Sky blue (#0284c7)
- **Green**: For success states
- **Red**: For error states
- **Gray**: Neutral colors

## Performance

- Optimized with Vite for fast builds
- Lazy loading for components
- Efficient state management with React hooks
- Image optimization in components

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Use descriptive component names
4. Add proper documentation
5. Test before submitting

## License

MIT

## Support

For issues or questions, please create an issue in the repository or contact the development team.
