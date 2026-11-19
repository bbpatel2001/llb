import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
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
            <Route path="/syllabi" element={<SyllabusPage />} />
            <Route path="/syllabi/:syllabusId" element={<SyllabusDetailPage />} />
            <Route path="/law-mapping" element={<LawMappingPage />} />
            <Route path="/law-mapping/:slug" element={<LawMappingDetailPage />} />
            <Route path="/articles" element={<ArticlesPage />} />
            <Route path="/articles/:slug" element={<ArticleDetailPage />} />
            <Route path="/blogs" element={<BlogsPage />} />
            <Route path="/blogs/:slug" element={<BlogDetailPage />} />
            <Route path="/papers" element={<PapersPage />} />
            <Route path="/questions" element={<QuestionsPage />} />
            <Route path="/questions/:questionId" element={<QuestionDetailPage />} />
            <Route path="/papers/:paperId" element={<StudyPage />} />
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
