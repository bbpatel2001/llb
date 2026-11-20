import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, type ReactNode } from 'react';
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
  PasswordResetPage,
  QuizPage,
  StudyStatePage,
  AdminReviewPage,
  AdminSyllabusPage,
  AdminBulkMappingPage,
  AdminAuditPage,
  AdminFlashcardsPage,
  AdminUsersPage,
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

function NonAdminClipboardGuard() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role === 'admin') return undefined;

    const blockClipboardAction = (event: Event) => event.preventDefault();
    const blockClipboardShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && ['c', 'x', 'v'].includes(event.key.toLowerCase())) {
        event.preventDefault();
      }
    };

    document.addEventListener('copy', blockClipboardAction);
    document.addEventListener('cut', blockClipboardAction);
    document.addEventListener('paste', blockClipboardAction);
    document.addEventListener('contextmenu', blockClipboardAction);
    document.addEventListener('keydown', blockClipboardShortcut);

    return () => {
      document.removeEventListener('copy', blockClipboardAction);
      document.removeEventListener('cut', blockClipboardAction);
      document.removeEventListener('paste', blockClipboardAction);
      document.removeEventListener('contextmenu', blockClipboardAction);
      document.removeEventListener('keydown', blockClipboardShortcut);
    };
  }, [user]);

  return null;
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LocaleProvider>
        <AuthProvider>
          <NonAdminClipboardGuard />
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
            <Route path="/admin/users" element={<AdminUsersPage />} />
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
            <Route path="/flashcards" element={<AuthenticatedRoute><FlashcardsPage /></AuthenticatedRoute>} />
            <Route path="/flashcard-history" element={<AuthenticatedRoute><FlashcardHistoryPage /></AuthenticatedRoute>} />
            <Route path="/case-laws" element={<CaseLawsPage />} />
            <Route path="/quizzes" element={<AuthenticatedRoute><QuizPage /></AuthenticatedRoute>} />
            <Route path="/quiz-history" element={<AuthenticatedRoute><QuizHistoryPage /></AuthenticatedRoute>} />
            <Route path="/quizzes/:quizId" element={<AuthenticatedRoute><QuizPage /></AuthenticatedRoute>} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/reset-password" element={<PasswordResetPage />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </AppShell>
        </AuthProvider>
      </LocaleProvider>
    </BrowserRouter>
  );
}

export default App;
