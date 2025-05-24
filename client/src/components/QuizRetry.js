import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Typography, Box, Button, Radio, 
  RadioGroup, FormControlLabel, Paper, CircularProgress, Alert,
  TextField, Chip, LinearProgress, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SendIcon from '@mui/icons-material/Send';
import TimerIcon from '@mui/icons-material/Timer';
import { quizStyles } from '../styles/components';

const QuizRetry = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

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

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    try {
      setShowSubmitDialog(false);
      const token = localStorage.getItem('token');
      const endTime = Date.now();
      const timeSpent = Math.floor((endTime - startTime) / 1000);

      const answers = questions.map(q => ({
        questionId: q.uniqueId,
        question: q.content,
        userAnswer: selectedAnswers[q.uniqueId] || '',
        correctAnswer: q.correctAnswer,
        isCorrect: selectedAnswers[q.uniqueId] === q.correctAnswer,
        type: q.type
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
      console.error('Error submitting quiz:', error);
      setError(error.response?.data?.error || 'Failed to submit quiz. Please try again.');
    }
  };

  const renderQuestionInput = (question) => {
    switch (question.type) {
      case 'MCQ':
        return (
          <RadioGroup
            value={selectedAnswers[question.uniqueId] || ''}
            onChange={(e) => setSelectedAnswers({
              ...selectedAnswers,
              [question.uniqueId]: e.target.value
            })}
          >
            {question.options.map((option, index) => (
              <FormControlLabel
                key={index}
                value={option}
                control={<Radio />}
                label={option}
              />
            ))}
          </RadioGroup>
        );
      
      case 'YES_NO':
        return (
          <RadioGroup
            value={selectedAnswers[question.uniqueId] || ''}
            onChange={(e) => setSelectedAnswers({
              ...selectedAnswers,
              [question.uniqueId]: e.target.value
            })}
          >
            <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
            <FormControlLabel value="No" control={<Radio />} label="No" />
          </RadioGroup>
        );
      
      case 'DESCRIPTIVE':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            placeholder="Enter your answer here..."
            value={selectedAnswers[question.uniqueId] || ''}
            onChange={(e) => setSelectedAnswers({
              ...selectedAnswers,
              [question.uniqueId]: e.target.value
            })}
          />
        );
      
      default:
        return null;
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" m={4}><CircularProgress /></Box>;
  if (error) return <Box m={4}><Alert severity="error">{error}</Alert></Box>;
  if (questions.length === 0) return <Box m={4}><Alert severity="info">No questions available</Alert></Box>;

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <Container>
      <Paper elevation={3} sx={{ p: 3, mt: 3, ...quizStyles.questionCard }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            Question {currentQuestion + 1} of {questions.length}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimerIcon color="action" />
              <Typography variant="body2" color="text.secondary">
                {formatTime(timeElapsed)}
              </Typography>
            </Box>
            <Chip
              label={currentQ.type}
              size="small"
              color="secondary"
              variant="outlined"
            />
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            color="secondary"
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Progress: {answeredCount} of {questions.length} questions answered
          </Typography>
        </Box>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          {currentQ.content}
        </Typography>

        {renderQuestionInput(currentQ)}

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
              onClick={() => setShowSubmitDialog(true)}
              disabled={!selectedAnswers[currentQ.uniqueId]}
            >
              Submit Quiz
            </Button>
          ) : (
            <Button
              variant="contained"
              endIcon={<NavigateNextIcon />}
              onClick={() => setCurrentQuestion(prev => prev + 1)}
              disabled={!selectedAnswers[currentQ.uniqueId]}
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>

      <Dialog
        open={showSubmitDialog}
        onClose={() => setShowSubmitDialog(false)}
      >
        <DialogTitle>Submit Quiz?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have answered {answeredCount} out of {questions.length} questions.
            Are you sure you want to submit your quiz?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QuizRetry; 