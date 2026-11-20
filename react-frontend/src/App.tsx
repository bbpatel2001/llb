import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/context/AuthContext';
import { LocaleProvider } from '@/context/LocaleContext';
import { AppShell } from '@/components';
import {
  Home,
  PapersPage,
  StudyPage,
  StudyHubPage,
  StudyArticlesPage,
  FlashcardsPage,
  CaseLawsPage,
  DashboardPage,
  QuestionsPage,
  QuestionDetailPage,
  AuthPage,
  QuizPage,
  StudyStatePage,
  AdminReviewPage,
  AdminSyllabusPage,
  AdminBulkMappingPage,
  AdminAuditPage,
  AdminFlashcardsPage,
  AdminDashboardPage,
  AdminAnswerComposerPage,
  QuizHistoryPage,
  FlashcardHistoryPage,
  RecommendationsPage,
  SyllabusPage,
  SyllabusDetailPage,
  LawMappingPage,
  LawMappingDetailPage,
  ArticlesPage,
  ArticleDetailPage,
  BlogsPage,
  BlogDetailPage,
  NotFound,
} from '@/pages';

function AuthenticatedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-8 text-center text-gray-600">Checking sign-in…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LocaleProvider>
        <AuthProvider>
          <AppShell>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/my-study" element={<StudyStatePage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/answers/new" element={<AdminAnswerComposerPage />} />
            <Route path="/admin/review" element={<AdminReviewPage />} />
            <Route path="/admin/syllabi" element={<AdminSyllabusPage />} />
            <Route path="/admin/mappings" element={<AdminBulkMappingPage />} />
            <Route path="/admin/audit" element={<AdminAuditPage />} />
            <Route path="/admin/flashcards" element={<AdminFlashcardsPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/syllabi" element={<AuthenticatedRoute><SyllabusPage /></AuthenticatedRoute>} />
            <Route path="/syllabi/:syllabusId" element={<AuthenticatedRoute><SyllabusDetailPage /></AuthenticatedRoute>} />
            <Route path="/law-mapping" element={<LawMappingPage />} />
            <Route path="/law-mapping/:slug" element={<LawMappingDetailPage />} />
            <Route path="/articles" element={<ArticlesPage />} />
            <Route path="/articles/:slug" element={<ArticleDetailPage />} />
            <Route path="/blogs" element={<BlogsPage />} />
            <Route path="/blogs/:slug" element={<BlogDetailPage />} />
            <Route path="/papers" element={<AuthenticatedRoute><PapersPage /></AuthenticatedRoute>} />
            <Route path="/questions" element={<AuthenticatedRoute><QuestionsPage /></AuthenticatedRoute>} />
            <Route path="/questions/:questionId" element={<AuthenticatedRoute><QuestionDetailPage /></AuthenticatedRoute>} />
            <Route path="/papers/:paperId" element={<AuthenticatedRoute><StudyPage /></AuthenticatedRoute>} />
            <Route path="/study" element={<StudyHubPage />} />
            <Route path="/study/articles" element={<StudyArticlesPage />} />
            <Route path="/flashcards" element={<FlashcardsPage />} />
            <Route path="/flashcard-history" element={<FlashcardHistoryPage />} />
            <Route path="/case-laws" element={<CaseLawsPage />} />
            <Route path="/quizzes" element={<QuizPage />} />
            <Route path="/quiz-history" element={<QuizHistoryPage />} />
            <Route path="/quizzes/:quizId" element={<QuizPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </AppShell>
        </AuthProvider>
      </LocaleProvider>
    </BrowserRouter>
  );
}

export default App;
