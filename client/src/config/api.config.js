const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    VERIFY: `${API_BASE_URL}/api/auth/verify`,
  },
  TESTS: {
    LIST: `${API_BASE_URL}/api/tests`,
    DETAILS: (id) => `${API_BASE_URL}/api/tests/${id}`,
    QUESTIONS: (id) => `${API_BASE_URL}/api/tests/${id}/questions`,
  },
  QUIZ_ATTEMPTS: {
    LIST: `${API_BASE_URL}/api/quiz-attempts`,
    DETAILS: (id) => `${API_BASE_URL}/api/quiz-attempts/${id}`,
    CREATE: `${API_BASE_URL}/api/quiz-attempts`,
  },
  QUESTIONS: {
    UPLOAD: `${API_BASE_URL}/api/questions/upload`,
  }
};