import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6000/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Questions API
export const questionsApi = {
  getAll: (params?: any) => apiClient.get('/questions', { params }),
  getById: (id: string) => apiClient.get(`/questions/${id}`),
  getBySemester: (semester: number, params?: any) => 
    apiClient.get(`/questions/semester/${semester}`, { params }),
  getBySubject: (subject: string, params?: any) => 
    apiClient.get(`/questions/subject/${subject}`, { params }),
  search: (query: string, params?: any) => 
    apiClient.get(`/questions/search`, { params: { ...params, query } }),
};

// Content API - Answers
export const answersApi = {
  generateShort: (questionId: string) => 
    apiClient.post('/content/answers/generate/short', { questionId }),
  generateLong: (questionId: string) => 
    apiClient.post('/content/answers/generate/long', { questionId }),
  getByQuestion: (questionId: string) => 
    apiClient.get(`/content/answers/${questionId}`),
  getBySemester: (semester: number, params?: any) => 
    apiClient.get(`/content/answers-by-semester/${semester}`, { params }),
};

// Content API - Flashcards
export const flashcardsApi = {
  generate: (subject: string, semester: number, limit?: number) => 
    apiClient.post('/content/flashcards/generate', { subject, semester, limit }),
  getDecks: (params?: any) => 
    apiClient.get('/content/flashcards/decks', { params }),
  getByDeck: (deckId: string, params?: any) => 
    apiClient.get(`/content/flashcards/deck/${deckId}`, { params }),
};

// Content API - Timelines
export const timelinesApi = {
  generate: (subject: string, topic: string) => 
    apiClient.post('/content/timelines/generate', { subject, topic }),
  getAll: (params?: any) => 
    apiClient.get('/content/timelines', { params }),
  getById: (id: string) => 
    apiClient.get(`/content/timelines/${id}`),
};

// Content API - Case Laws
export const casesApi = {
  create: (data: any) => 
    apiClient.post('/content/cases', data),
  getAll: (params?: any) => 
    apiClient.get('/content/cases', { params }),
  getById: (id: string) => 
    apiClient.get(`/content/cases/${id}`),
};

// Content API - Stats
export const contentApi = {
  getStats: () => 
    apiClient.get('/content/stats'),
};

export default apiClient;
