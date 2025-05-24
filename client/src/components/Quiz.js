import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Typography, Box, Button, Radio, 
  RadioGroup, FormControlLabel, Paper, CircularProgress, Alert,
  LinearProgress,
  TextField,
  Chip
} from '@mui/material';
import { quizStyles } from '../styles/components';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SendIcon from '@mui/icons-material/Send';

const Quiz = () => {
  const { testId, attemptId } = useParams();
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

        if (attemptId) {
          // Fetch quiz attempt questions
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/quiz-attempts/${attemptId}/questions`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );

          console.log('Attempt questions response:', response.data); // Debug log

          if (!response.data?.success || !response.data?.questions) {
            throw new Error('No questions available in attempt');
          }

          // Ensure each question has options
          const questionsWithOptions = response.data.questions.map(q => ({
            ...q,
            options: q.options || (q.type === 'MCQ' ? [] : q.type === 'YES_NO' ? ['Yes', 'No'] : [])
          }));

          setQuestions(questionsWithOptions);
          console.log('Processed questions:', questionsWithOptions); // Debug log

          // Pre-fill selected answers from attempt
          const preSelected = {};
          questionsWithOptions.forEach(q => {
            if (q.userAnswer) {
              preSelected[q.uniqueId] = q.userAnswer;
            }
          });
          setSelectedAnswers(preSelected);
        } else if (testId) {
          // Fetch test questions
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/tests/${testId}/questions`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );

          console.log('Test questions response:', response.data); // Debug log

          if (!response.data?.success || !response.data?.questions) {
            throw new Error('No questions available');
          }

          // Ensure each question has options
          const allQuestions = response.data.questions.map(q => ({
            ...q,
            options: q.options || (q.type === 'MCQ' ? [] : q.type === 'YES_NO' ? ['Yes', 'No'] : [])
          }));

          // Randomly select questions
          const selectedQuestions = allQuestions
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(10, allQuestions.length));

          console.log('Selected questions with options:', selectedQuestions); // Debug log
          setQuestions(selectedQuestions);
        } else {
          throw new Error('No testId or attemptId provided');
        }
      } catch (error) {
        console.error('Error fetching questions:', error); // Debug log
        setError(error.response?.data?.error || error.message || 'Failed to fetch questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [testId, attemptId, navigate]);

  const handleSubmit = async () => {
    try {
      console.log('=== Quiz Submission Started ===');
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        navigate('/login');
        return;
      }

      // Validate answers before submission
      const unansweredQuestions = questions.filter(q => !selectedAnswers[q.uniqueId]);
      if (unansweredQuestions.length > 0) {
        console.log('Unanswered questions:', unansweredQuestions.length);
        setError(`Please answer all questions before submitting. ${unansweredQuestions.length} questions remaining.`);
        return;
      }

      const endTime = Date.now();
      const timeSpent = Math.floor((endTime - startTime) / 1000);

      console.log('Preparing submission:', {
        testId,
        questionsCount: questions.length,
        timeSpent,
        selectedAnswersCount: Object.keys(selectedAnswers).length
      });

      const answers = questions.map(q => ({
        questionId: q.uniqueId,
        question: q.content,
        userAnswer: selectedAnswers[q.uniqueId] || '',
        correctAnswer: q.correctAnswer,
        type: q.type,
        options: q.options || [],
        isCorrect: selectedAnswers[q.uniqueId] === q.correctAnswer
      }));

      console.log('Making POST request to submit quiz');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/quiz-attempts`,
        {
          testId,
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

      console.log('Quiz submission response:', response.data);

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to submit quiz');
      }

      const attemptId = response.data?.attemptId;
      if (!attemptId) {
        console.error('No attemptId in response:', response.data);
        throw new Error('No attempt ID received from server');
      }

      console.log('Received attemptId:', attemptId);

      // Add a small delay to ensure the attempt is saved
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify the attempt exists before navigating
      try {
        console.log('Verifying attempt with ID:', attemptId);
        const verifyResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/quiz-attempts/${attemptId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        console.log('Verification response:', verifyResponse.data);
        
        if (!verifyResponse.data?.success || !verifyResponse.data?.attempt) {
          throw new Error('Attempt verification failed');
        }
        
        // Use replace instead of navigate to prevent back button issues
        console.log('Attempt verified, navigating to result page with ID:', attemptId);
        navigate(`/quiz-result/${attemptId}`, { replace: true });
      } catch (verifyError) {
        console.error('Error verifying attempt:', verifyError);
        throw new Error('Failed to verify quiz attempt. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setError(error.response?.data?.error || error.message || 'Failed to submit quiz. Please try again.');
    }
  };

  const renderQuestionInput = (question) => {
    console.log('Rendering question:', question); // Debug log for current question

    switch (question.type) {
      case 'MCQ':
        if (!question.options || question.options.length === 0) {
          console.warn('MCQ question has no options:', question); // Debug log
          return <Alert severity="warning">No options available for this question</Alert>;
        }
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
        console.warn('Unknown question type:', question.type); // Debug log
        return <Alert severity="error">Unknown question type: {question.type}</Alert>;
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={currentQ.type}
              size="small"
              color="secondary"
              variant="outlined"
            />
            <LinearProgress 
              variant="determinate" 
              value={((currentQuestion + 1) / questions.length) * 100} 
              sx={{ width: '40%' }}
              color="secondary"
            />
          </Box>
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
              onClick={handleSubmit}
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
    </Container>
  );
};

export default Quiz;
