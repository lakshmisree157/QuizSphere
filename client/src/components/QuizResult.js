// client/src/components/QuizResult.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Typography, Box, Button, 
  Paper, CircularProgress, Alert,
  Table, TableBody, TableCell, TableHead, TableRow 
} from '@mui/material';
import { quizStyles } from '../styles/components';

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

        console.log('Fetching quiz result for ID:', quizId);
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/quiz-attempts/${quizId}`,
          { 
            headers: { 
              'Authorization': `Bearer ${token}`
            } 
          }
        );
        
        console.log('Response data:', response.data);
        
        if (!response.data?.success || !response.data?.attempt) {
          throw new Error('Invalid response format');
        }

        setResult(response.data.attempt);
        setError(null);
      } catch (error) {
        console.error('Error details:', error.response || error);
        setError(error.response?.data?.error || 'Failed to fetch result');
        // Do not navigate away immediately, allow user to see error
        // setTimeout(() => navigate('/dashboard'), 3000);
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

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom color="primary">
          Quiz Results
        </Typography>
        
        <Box sx={quizStyles.scoreSection}>
          <Typography variant="h3" color="primary" gutterBottom>
            {result.score}%
          </Typography>
          <Typography variant="h6" gutterBottom>
            {result.answers.filter(a => a.isCorrect).length} out of {result.answers.length} correct
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
              {result.answers.map((answer, index) => (
                  <TableRow 
                    key={index}
                    sx={answer.isCorrect === true ? quizStyles.correctAnswer : quizStyles.wrongAnswer}
                  >
                    <TableCell>{answer.question}</TableCell>
                    <TableCell>{answer.userAnswer || 'No answer'}</TableCell>
                    <TableCell>{answer.correctAnswer}</TableCell>
                    <TableCell align="center">
                      {answer.isCorrect === true ? (
                        <Typography color="success.dark">✓ Correct</Typography>
                      ) : (
                        <Typography color="error.dark">✗ Incorrect</Typography>
                      )}
                    </TableCell>
                  </TableRow>
              ))}
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
            onClick={() => navigate(`/quiz/${result.testId}`)}
          >
            Retake Quiz
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default QuizResult;