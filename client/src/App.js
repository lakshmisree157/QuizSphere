import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import Layout from './components/Layout';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import PDFUpload from './components/PDFUpload';
import Quiz from './components/Quiz';
import QuizResult from './components/QuizResult';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import QuizRetry from './components/QuizRetry';
import QuizStats from './components/QuizStats';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <ThemeProvider theme={theme}>
      <Routes>
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Home />
        } />
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} 
        />
        <Route element={<Layout />}>
          <Route 
            path="/dashboard" 
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/upload" 
            element={<ProtectedRoute><PDFUpload /></ProtectedRoute>} 
          />
          <Route 
            path="/quiz/:testId" 
            element={<ProtectedRoute><Quiz /></ProtectedRoute>} 
          />
          <Route 
            path="/quiz/attempt/:attemptId" 
            element={<ProtectedRoute><Quiz /></ProtectedRoute>} 
          />
          <Route 
            path="/quiz-result/:quizId" 
            element={<ProtectedRoute><QuizResult /></ProtectedRoute>} 
          />
          <Route path="/quiz-retry/:attemptId" element={<ProtectedRoute><QuizRetry /></ProtectedRoute>} />
          <Route path="/quiz-stats/:testId" element={
            <ProtectedRoute>
              <QuizStats />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
