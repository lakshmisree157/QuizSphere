const BASE_URL = process.env.REACT_APP_API_URL;

export const API_ROUTES = {
  AUTH: {
    LOGIN: `${BASE_URL}/api/auth/login`,
    REGISTER: `${BASE_URL}/api/auth/register`,
    VERIFY: `${BASE_URL}/api/auth/verify`
  },
  TESTS: {
    LIST: `${BASE_URL}/api/tests`,
    GET: (id) => `${BASE_URL}/api/tests/${id}`,
    QUESTIONS: (id) => `${BASE_URL}/api/tests/${id}/questions`,
    UPLOAD: `${BASE_URL}/api/questions/upload`
  },
  QUIZ_ATTEMPTS: {
    LIST: `${BASE_URL}/api/quiz-attempts`,
    GET: (id) => `${BASE_URL}/api/quiz-attempts/${id}`,
    CREATE: `${BASE_URL}/api/quiz-attempts`
  }
};