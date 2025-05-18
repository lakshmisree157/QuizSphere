export const API_ENDPOINTS = {
  BASE_URL: process.env.REACT_APP_API_URL,
  TESTS: {
    GET_QUESTIONS: (testId) => `/api/tests/${testId}/questions`,
    LIST: '/api/tests',
    UPLOAD: '/api/questions/upload'
  },
  QUIZ_ATTEMPTS: {
    CREATE: '/api/quiz-attempts',
    GET: (id) => `/api/quiz-attempts/${id}`,
    LIST: '/api/quiz-attempts'
  },
  AUTH: {
    LOGIN: '/api/auth/login',
    VERIFY: '/api/auth/verify'
  }
};

export const ERROR_MESSAGES = {
  FETCH_QUESTIONS: 'Failed to fetch questions. Please try again.',
  TEST_NOT_FOUND: 'Test not found.',
  INVALID_TEST: 'Invalid test data.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.'
};