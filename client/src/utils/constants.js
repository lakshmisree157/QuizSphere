export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    VERIFY: '/api/auth/verify'
  },
  TESTS: {
    LIST: '/api/tests',
    GET_QUESTIONS: (testId) => `/api/tests/${testId}/questions`,
    UPLOAD: '/api/questions/upload'
  },
  QUIZ: {
    ATTEMPTS: '/api/quiz-attempts',
    GET_ATTEMPT: (attemptId) => `/api/quiz-attempts/${attemptId}`,
    SUBMIT: '/api/quiz-attempts'
  }
};