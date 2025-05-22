import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Typography, Box, Button, 
  Paper, CircularProgress, Alert,
  Table, TableBody, TableCell, TableHead, TableRow 
} from '@mui/material';
import { quizStyles } from '../styles/components';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const QuizResult = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      if (!quizId) {
        setError('Quiz ID is missing');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/quiz-attempts/${quizId}`,
          { 
            headers: { 
              'Authorization': `Bearer ${token}`
            } 
          }
        );
        
        console.log('API response data:', response.data);

        if (!response.data?.success || !response.data?.attempt) {
          throw new Error('Invalid response format');
        }

        setResult(response.data.attempt);
        setError(null);
      } catch (error) {
        console.error('Fetch error:', error);
        setError(error.response?.data?.error || 'Failed to fetch result');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [quizId, navigate]);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" m={4}>
          <CircularProgress size={40} thickness={4} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box m={4}>
          <Alert 
            severity="error" 
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(231, 76, 60, 0.15)'
            }}
          >
            {error}
          </Alert>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button 
              variant="contained"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  if (!result) {
    return (
      <Container maxWidth="lg">
        <Box m={4}>
          <Alert 
            severity="info"
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(52, 152, 219, 0.15)'
            }}
          >
            No results found
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => navigate('/dashboard')}
            sx={{ mt: 2 }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  // Helper to extract option letter from userAnswer string
  const extractOptionLetter = (answer) => {
    if (!answer) return '';
    const match = answer.match(/^[A-Z]/i);
    return match ? match[0].toUpperCase() : '';
  };

  // Determine correctness by comparing option letters
  const isAnswerCorrect = (userAnswer, correctAnswer) => {
    return extractOptionLetter(userAnswer) === correctAnswer.toUpperCase();
  };

  // Format score for display
  const formatScore = (score) => {
    if (score === undefined || score === null) return '0%';
    return score.toFixed(2) + '%';
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom color="primary">
          Quiz Results
        </Typography>
        
        <Box sx={quizStyles.scoreSection}>
          <Typography variant="h3" color="primary" gutterBottom>
            {Math.round((result.answers.filter(a => isAnswerCorrect(a.userAnswer, a.correctAnswer)).length / result.answers.length) * 100)}%
          </Typography>
          <Typography variant="h6" gutterBottom>
            {result.answers.filter(a => isAnswerCorrect(a.userAnswer, a.correctAnswer)).length} out of {result.answers.length} correct
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Time Taken: {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
          Detailed Results
        </Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={quizStyles.resultTable}>
            <TableHead>
              <TableRow>
                <TableCell>Question</TableCell>
                <TableCell>Your Answer</TableCell>
                <TableCell>Correct Answer</TableCell>
                <TableCell align="center">Result</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.answers.map((answer, index) => {
                const correct = isAnswerCorrect(answer.userAnswer, answer.correctAnswer);
                return (
                  <TableRow 
                    key={index}
                    sx={correct ? quizStyles.correctAnswer : quizStyles.wrongAnswer}
                  >
                    <TableCell>{answer.question}</TableCell>
                    <TableCell>{answer.userAnswer || 'No answer'}</TableCell>
                    <TableCell>{answer.correctAnswer}</TableCell>
                    <TableCell align="center">
                      {correct ? (
                        <Typography color="success.dark" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckCircleIcon sx={{ mr: 1 }} /> Correct
                        </Typography>
                      ) : (
                        <Typography color="error.dark" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CancelIcon sx={{ mr: 1 }} /> Incorrect
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
          <Button 
            variant="contained"
            color="primary"
            onClick={() => {
              if (result.testId && result.testId._id) {
                navigate(`/quiz/${result.testId._id}`);
              } else {
                console.error('Invalid testId for navigation:', result.testId);
              }
            }}
          >
            Retake Quiz
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default QuizResult;
