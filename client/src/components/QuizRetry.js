// client/src/components/QuizRetry.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Typography, Box, Button, Radio, 
  RadioGroup, FormControlLabel, Paper, CircularProgress, Alert,
  LinearProgress 
} from '@mui/material';
import { quizStyles } from '../styles/components';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SendIcon from '@mui/icons-material/Send';

const QuizRetry = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch questions from the previous attempt
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/quiz-attempts/${attemptId}/questions`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (!response.data?.success || !response.data?.questions) {
          throw new Error('No questions available');
        }

        setQuestions(response.data.questions);
      } catch (error) {
        setError(error.response?.data?.error || 'Failed to fetch questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [attemptId, navigate]);

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const endTime = Date.now();
      const timeSpent = Math.floor((endTime - startTime) / 1000);

      const answers = questions.map(q => ({
        questionId: q.uniqueId,
        question: q.content,
        userAnswer: selectedAnswers[q.uniqueId] || '',
        correctAnswer: q.correctAnswer,
        isCorrect: selectedAnswers[q.uniqueId] === q.correctAnswer
      }));

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/quiz-attempts`,
        {
          testId: questions[0]?.testId,
          answers,
          timeSpent
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data?.success && response.data?.attemptId) {
        navigate(`/quiz-result/${response.data.attemptId}`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to submit quiz. Please try again.');
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" m={4}><CircularProgress /></Box>;
  if (error) return <Box m={4}><Alert severity="error">{error}</Alert></Box>;
  if (questions.length === 0) return <Box m={4}><Alert severity="info">No questions available</Alert></Box>;

  const currentQ = questions[currentQuestion];

  return (
    <Container>
      <Paper elevation={3} sx={{ p: 3, mt: 3, ...quizStyles.questionCard }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            Question {currentQuestion + 1} of {questions.length}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={((currentQuestion + 1) / questions.length) * 100} 
            sx={{ width: '40%' }}
            color="secondary"
          />
        </Box>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          {currentQ.content}
        </Typography>

        <RadioGroup
          value={selectedAnswers[currentQ.uniqueId] || ''}
          onChange={(e) => setSelectedAnswers({
            ...selectedAnswers,
            [currentQ.uniqueId]: e.target.value
          })}
        >
          {currentQ.options.map((option, index) => (
            <FormControlLabel
              key={index}
              value={option}
              control={<Radio />}
              label={option}
            />
          ))}
        </RadioGroup>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            startIcon={<NavigateBeforeIcon />}
            onClick={() => setCurrentQuestion(prev => prev - 1)}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          {currentQuestion === questions.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              endIcon={<SendIcon />}
              onClick={handleSubmit}
            >
              Submit Quiz
            </Button>
          ) : (
            <Button
              variant="contained"
              endIcon={<NavigateNextIcon />}
              onClick={() => setCurrentQuestion(prev => prev + 1)}
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default QuizRetry;