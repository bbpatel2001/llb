import axios, { AxiosInstance, AxiosError } from 'axios';
import { isLocale, LOCALE_STORAGE_KEY, Locale } from '@/i18n';

// Use Vite's same-origin proxy in development. Direct browser requests to port 6000
// are blocked by Chromium as an unsafe port; Vite forwards /api to the backend.
const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * API Client Singleton
 */
class ApiClient {
  private static instance: AxiosInstance;

  private constructor() {}

  static getInstance(): AxiosInstance {
    if (!ApiClient.instance) {
      ApiClient.instance = axios.create({
        baseURL: API_URL,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Attach the current bearer token to authenticated API requests.
      ApiClient.instance.interceptors.request.use((config) => {
        const token = localStorage.getItem('llb_access_token');
        const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
        const locale: Locale = isLocale(storedLocale) ? storedLocale : 'en';
        config.headers['Accept-Language'] = locale;
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      });

      // Add response interceptor
      ApiClient.instance.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
          console.error('API Error:', error.message);
          return Promise.reject(error);
        }
      );
    }

    return ApiClient.instance;
  }
}

const api = ApiClient.getInstance();

/**
 * Authentication API
 */
export const authApi = {
  register: (name: string, email: string, password: string) =>
    api.post('/api/auth/register', { name, email, password }),
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  me: () => api.get('/api/auth/me'),
  logout: () => api.post('/api/auth/logout'),
};

/**
 * Flashcards API
 */
export const flashcardsApi = {
  getDecks: (params: { subject?: string; semester?: number; skip?: number; limit?: number } = {}) =>
    api.get('/api/content/flashcards/decks', { params }),
  // Keep the default within the backend's global pagination limit.
  getDeck: (deckId: string, limit = 500) =>
    api.get(`/api/content/flashcards/deck/${deckId}`, { params: { limit } }),
  generate: (subject: string, semester: number, limit = 1000) =>
    api.post('/api/content/flashcards/generate', { subject, semester, limit }),
};

/**
 * Case law API
 */
export const caseLawsApi = {
  getAll: (params: { search?: string; court?: string; skip?: number; limit?: number } = {}) =>
    api.get('/api/content/cases', { params }),
  getById: (caseId: string) => api.get(`/api/content/cases/${caseId}`),
};

/**
 * Quiz API
 */
export const quizzesApi = {
  getAll: (params: { subject?: string; semester?: number; difficulty?: string; skip?: number; limit?: number } = {}) =>
    api.get('/api/quizzes', { params }),
  getById: (quizId: string) => api.get(`/api/quizzes/${quizId}`),
  start: (quizId: string) => api.post(`/api/quizzes/${quizId}/start`),
  submitAnswer: (attemptId: string, questionId: string, selectedAnswer: string, timeSpent = 0) =>
    api.post(`/api/quizzes/attempts/${attemptId}/answer`, { questionId, selectedAnswer, timeSpent }),
  submit: (attemptId: string) => api.post(`/api/quizzes/attempts/${attemptId}/submit`),
  getResults: (attemptId: string) => api.get(`/api/quizzes/attempts/${attemptId}/results`),
  getHistory: (skip = 0, limit = 10) =>
    api.get('/api/quizzes/user/me/attempts', { params: { skip, limit } }),
};

/**
 * Papers API
 */
export const papersApi = {
  getAll: (skip = 0, limit = 20, semester?: number, subject?: string) => {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (semester) params.append('semester', semester.toString());
    if (subject) params.append('subject', subject);
    return api.get(`/api/papers?${params.toString()}`);
  },
  getById: (id: string) => api.get(`/api/papers/${id}`),
};

/**
 * Questions API
 */
export const questionsApi = {
  getAll: (params: { semester?: string; subject?: string; type?: string; search?: string; skip?: number; limit?: number } = {}) =>
    api.get('/api/questions', { params }),
  getBySemester: (semester: number, skip = 0, limit = 50, subject?: string, type?: string) =>
    api.get(`/api/questions/semester/${semester}`, { params: { skip, limit, subject, type } }),
  getById: (id: string) => api.get(`/api/questions/${id}`),
  getByPaper: (paperId: string, skip = 0, limit = 100) =>
    api.get(`/api/papers/${paperId}/questions`, { params: { skip, limit } }),
  getFilters: () => api.get('/api/questions/filters'),
};

/**
 * Answers API
 */
export const answersApi = {
  getByPaper: (paperId: string, type?: string, skip = 0, limit = 50) => {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (type) params.append('type', type);
    return api.get(`/api/answers/paper/${paperId}?${params.toString()}`);
  },
  getByQuestion: (questionId: string, language: Locale = 'en') => api.get(`/api/answers/${questionId}`, { params: { language } }),
  generateShort: (questionId: string, language: Locale = 'en') => api.post('/api/answers/generate/short', { questionId, language }),
  generateLong: (questionId: string, language: Locale = 'en') => api.post('/api/answers/generate/long', { questionId, language }),
  getRatings: (answerId: string) => api.get(`/api/answers/${answerId}/ratings`),
  getPrivateReviews: (answerId: string) => api.get(`/api/answers/${answerId}/ratings/reviews`),
  rate: (answerId: string, rating: number, comment?: string) => api.post(`/api/answers/${answerId}/ratings`, { rating, comment }),
  verify: (answerId: string, data: { verified: boolean; qualityScore?: number; reviewStatus: 'approved' | 'review_required'; reviewNotes?: string }) => api.patch(`/api/answers/${answerId}/verify`, data),
};

/**
 * Stats API
 */
export const statsApi = {
  getOverview: () => api.get(`/api/stats`),
};

/**
 * Plugins API
 */
export const pluginsApi = {
  getAll: () => api.get(`/api/plugins`),
  getByName: (name: string) => api.get(`/api/plugins/${name}`),
  enable: (name: string) => api.post(`/api/plugins/${name}/enable`),
  disable: (name: string) => api.post(`/api/plugins/${name}/disable`),
  execute: (name: string, action: string, data?: unknown) =>
    api.post(`/api/plugins/${name}/execute`, { action, data }),
  getStats: () => api.get(`/api/plugins/stats/overview`),
};

/**
 * Health Check
 */
export const healthApi = {
  check: () => api.get(`/api/health`),
};

export default api;

/**
 * Authenticated study state API
 */
export const studyApi = {
  getSummary: () => api.get('/api/study/summary'),
  getProgress: (targetType?: string, targetId?: string) => api.get('/api/study/progress', { params: { targetType, targetId } }),
  updateProgress: (targetType: string, targetId: string, payload: { viewedIncrement?: number; answeredIncrement?: number; correctIncrement?: number; completedIncrement?: number; timeSpentSeconds?: number; completed?: boolean }) =>
    api.patch(`/api/study/progress/${targetType}/${targetId}`, payload),
  getBookmarks: (targetType?: string) => api.get('/api/study/bookmarks', { params: { targetType } }),
  addBookmark: (targetType: string, targetId: string, label?: string) => api.post('/api/study/bookmarks', { targetType, targetId, label }),
  removeBookmark: (bookmarkId: string) => api.delete(`/api/study/bookmarks/${bookmarkId}`),
  getNotes: (targetType?: string, targetId?: string) => api.get('/api/study/notes', { params: { targetType, targetId } }),
  addNote: (targetType: string, targetId: string, body: string) => api.post('/api/study/notes', { targetType, targetId, body }),
  updateNote: (noteId: string, body: string) => api.patch(`/api/study/notes/${noteId}`, { body }),
  removeNote: (noteId: string) => api.delete(`/api/study/notes/${noteId}`),
  getDueFlashcards: (limit = 50) => api.get('/api/study/flashcards/due', { params: { limit } }),
  saveFlashcardAttempt: (deckId: string, payload: { answers: Array<{ cardId: string; selectedAnswer: string }>; reviewedCards: number; startedAt: string }) =>
    api.post('/api/study/flashcards/attempts', { deckId, ...payload }),
  getFlashcardAttempts: (skip = 0, limit = 20, deckId?: string) =>
    api.get('/api/study/flashcards/attempts', { params: { skip, limit, deckId } }),
  reviewFlashcard: (cardId: string, quality: number, reviewId = crypto.randomUUID()) => api.post(`/api/study/flashcards/${cardId}/review`, { quality, reviewId }),
};

export const adminDashboardApi = {
  getOverview: () => api.get('/api/admin/overview'),
};

/**
 * Admin staged import and review API
 */
export const adminApi = {
  getImports: (status?: string) => api.get('/api/admin/imports', { params: { status } }),
  getImport: (batchId: string) => api.get(`/api/admin/imports/${batchId}`),
  getImportQuestions: (batchId: string, status?: string) => api.get(`/api/admin/imports/${batchId}/questions`, { params: { status } }),
  createImport: (payload: Record<string, unknown>) => api.post('/api/admin/imports', payload),
  reviewImportQuestion: (batchId: string, questionId: string, payload: Record<string, unknown>) => api.patch(`/api/admin/imports/${batchId}/questions/${questionId}`, payload),
  approveImport: (batchId: string) => api.post(`/api/admin/imports/${batchId}/approve`),
  rejectImport: (batchId: string, reason?: string) => api.post(`/api/admin/imports/${batchId}/reject`, { reason }),
  promoteImport: (batchId: string) => api.post(`/api/admin/imports/${batchId}/promote`),
  getFlashcardDeck: (deckId: string, limit = 200) =>
    api.get(`/api/admin/flashcards/deck/${deckId}`, { params: { limit } }),
  createFormattedAnswer: (payload: Record<string, unknown>) => api.post('/api/admin/formatted-answers', payload),
};

/**
 * Published syllabus and topic API
 */
export const syllabiApi = {
  getUniversities: () => api.get('/api/syllabi/universities'),
  getAll: (params: { university?: string; programme?: string; academicYear?: string; semester?: number; courseCategory?: string; subjectCode?: string; syllabusKey?: string; skip?: number; limit?: number } = {}) =>
    api.get('/api/syllabi', { params }),
  getById: (syllabusId: string) => api.get(`/api/syllabi/${syllabusId}`),
  getTopics: (syllabusId: string, parentTopicKey?: string) => api.get(`/api/syllabi/${syllabusId}/topics`, { params: { parentTopicKey } }),
  getQuestions: (syllabusId: string, topicKey: string, skip = 0, limit = 100) =>
    api.get(`/api/syllabi/${syllabusId}/topics/${encodeURIComponent(topicKey)}/questions`, { params: { skip, limit } }),
};

/**
 * Admin syllabus workflow API
 */
export const adminSyllabusApi = {
  getAll: (status?: string) => api.get('/api/admin/syllabi', { params: { status } }),
  getById: (syllabusId: string) => api.get(`/api/admin/syllabi/${syllabusId}`),
  create: (payload: Record<string, unknown>) => api.post('/api/admin/syllabi', payload),
  uploadPdf: (file: File, metadata: { university: string; subject: string; subjectCode: string; semester: number; year: number; title: string; credits?: number }) =>
    api.post('/api/admin/syllabi/pdf', file, {
      timeout: 120000,
      headers: {
        'Content-Type': 'application/pdf',
        'x-syllabus-file-name': file.name,
        'x-syllabus-university': metadata.university,
        'x-syllabus-subject': metadata.subject,
        'x-syllabus-subject-code': metadata.subjectCode,
        'x-syllabus-semester': String(metadata.semester),
        'x-syllabus-year': String(metadata.year),
        'x-syllabus-title': metadata.title,
        ...(metadata.credits === undefined ? {} : { 'x-syllabus-credits': String(metadata.credits) }),
      },
    }),
  publish: (syllabusId: string) => api.post(`/api/admin/syllabi/${syllabusId}/publish`),
  mapQuestionTopics: (questionId: string, mappings: Array<{ syllabusId: string; syllabusVersion: number; topicKey: string }>) =>
    api.put(`/api/admin/questions/${questionId}/topic-mappings`, { mappings }),
};

/**
 * Extended admin and study workflow API
 */
export const adminWorkflowApi = {
  approveSyllabus: (syllabusId: string) => api.post(`/api/admin/syllabi/${syllabusId}/approve`),
  getAuditLogs: (params: { action?: string; resourceType?: string; result?: string; skip?: number; limit?: number } = {}) => api.get('/api/admin/audit-logs', { params }),
  bulkMapQuestionTopics: (mappings: Array<{ questionId: string; mappings: Array<{ syllabusId: string; syllabusVersion: number; topicKey: string }> }>) => api.put('/api/admin/questions/bulk-topic-mappings', { mappings }),
};

export const recommendationsApi = {
  get: (syllabusId?: string, limit = 10) => api.get('/api/study/recommendations', { params: { syllabusId, limit } }),
};
