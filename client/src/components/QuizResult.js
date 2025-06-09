import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Card,
  CardContent,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import { quizStyles } from '../styles/components';
import { API_ROUTES } from '../config/api';



const QuizResult = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('all');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedbacks, setFeedbacks] = useState({}); // Store feedback keyed by questionId
  const [loadingFeedbacks, setLoadingFeedbacks] = useState({}); // Track loading state per question

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        console.log('=== Quiz Result Fetch Started ===');
        console.log('Quiz ID from URL:', quizId);
        
        // Validate quizId before making the request
        if (!quizId) {
          console.error('No quizId provided in URL');
          setError('No quiz attempt ID provided');
          setLoading(false);
          navigate('/dashboard');
          return;
        }

        if (quizId === 'undefined' || quizId === 'null') {
          console.error('Invalid quizId format:', quizId);
          setError('Invalid quiz attempt ID format');
          setLoading(false);
          navigate('/dashboard');
          return;
        }

        // Validate quizId format (should be a MongoDB ObjectId)
        if (!/^[0-9a-fA-F]{24}$/.test(quizId)) {
          console.error('Invalid quizId format (not a valid MongoDB ObjectId):', quizId);
          setError('Invalid quiz attempt ID format');
          setLoading(false);
          navigate('/dashboard');
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          navigate('/login');
          return;
        }

        console.log('Making request to fetch quiz attempt with ID:', quizId);
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/quiz-attempts/${quizId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        console.log('Quiz attempt response:', response.data);

        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Failed to fetch quiz attempt');
        }

        if (!response.data?.attempt) {
          console.error('No attempt data in response:', response.data);
          throw new Error('No attempt data received');
        }

        console.log('Successfully fetched attempt:', {
          attemptId: response.data.attempt._id,
          testId: response.data.attempt.testId?._id,
          score: response.data.attempt.score
        });

        setAttempt(response.data.attempt);

        // Fetch feedback for all questions
        const answersToFetch = response.data.attempt.answers;

        for (const answer of answersToFetch) {
          setLoadingFeedbacks(prev => ({ ...prev, [answer.questionId]: true }));
          try {
            const feedbackResponse = await axios.post(
              API_ROUTES.FEEDBACK.GENERATE,
              {
                userAnswer: answer.userAnswer || '',
                correctAnswer: answer.correctAnswer || ''
              },
              {
                headers: { 'Authorization': `Bearer ${token}` }
              }
            );
            if (feedbackResponse.data?.feedback) {
              setFeedbacks(prev => ({ ...prev, [answer.questionId]: feedbackResponse.data.feedback }));
            } else {
              setFeedbacks(prev => ({ ...prev, [answer.questionId]: 'No feedback available.' }));
            }
          } catch (error) {
            setFeedbacks(prev => ({ ...prev, [answer.questionId]: 'Failed to fetch feedback.' }));
          } finally {
            setLoadingFeedbacks(prev => ({ ...prev, [answer.questionId]: false }));
          }
        }

      } catch (err) {
        console.error('Error fetching quiz attempt:', err);
        const errorMessage = err.response?.data?.error || err.message || 'Failed to load quiz results';
        setError(errorMessage);
        
        // If it's an invalid ID error or not found, redirect to dashboard
        if (err.response?.status === 400 || err.response?.status === 404) {
          console.log('Invalid ID or not found error, redirecting to dashboard');
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [quizId, navigate]);

  const handleRetry = () => {
    navigate(`/quiz-retry/${quizId}`);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleDeleteAllAttempts = async () => {
    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/quiz-attempts/test/${attempt.testId._id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        navigate('/dashboard');
      } else {
        throw new Error('Failed to delete attempts');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete attempts');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const calculateTypeStats = () => {
    if (!attempt) return {};
    
    const stats = {
      MCQ: { total: 0, correct: 0 },
      YES_NO: { total: 0, correct: 0 },
      DESCRIPTIVE: { total: 0, correct: 0 },
      TRUE_FALSE: { total: 0, correct: 0 },
      FILL_IN_BLANK: { total: 0, correct: 0 },
      SHORT_ANSWER: { total: 0, correct: 0 }
      // Add more types as needed

    };

    attempt.answers.forEach(answer => {
      const type = (answer.type || 'MCQ').toUpperCase().trim();
      if (!stats[type]) {
        stats[type] = { total: 0, correct: 0 };
      }
      stats[type].total++;
      if (answer.isCorrect) {
        stats[type].correct++;
      }
    });

    return stats;
  };

  const getFilteredAnswers = () => {
    if (!attempt) return [];
    if (selectedTab === 'all') return attempt.answers;
    return attempt.answers.filter(answer => answer.type === selectedTab);
  };

  const renderPerformanceBreakdown = () => {
    const stats = calculateTypeStats();
    const totalCorrect = Object.values(stats).reduce((sum, stat) => sum + stat.correct, 0);
    const totalQuestions = Object.values(stats).reduce((sum, stat) => sum + stat.total, 0);

    return (
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Performance Breakdown
          </Typography>
        </Grid>
        {Object.entries(stats).map(([type, stat]) => (
          stat.total > 0 && (
            <Grid item xs={12} sm={4} key={type}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Chip label={type} size="small" color="secondary" />
                    <Typography variant="h6" color="text.primary">
                      {Math.round((stat.correct / stat.total) * 100)}%
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {stat.correct} correct out of {stat.total} questions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )
        ))}
        <Grid item xs={12}>
          <Card 
            variant="outlined" 
            sx={{ 
              bgcolor: 'primary.main',
              border: '1px solid',
              borderColor: 'primary.main'
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                Overall Score: {Math.round((totalCorrect / totalQuestions) * 100)}%
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                {totalCorrect} correct out of {totalQuestions} questions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderAnswerDisplay = (answer) => {
    const isCorrect = answer.isCorrect;
    const questionType = answer.type || 'MCQ'; // Default to MCQ if type not specified

    return (
      <Box sx={{ mt: 1, pl: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Chip
            label={questionType}
            size="small"
            color="secondary"
            variant="outlined"
          />
          {isCorrect ? (
            <CheckCircleIcon color="success" />
          ) : (
            <CancelIcon color="error" />
          )}
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Your answer: {answer.userAnswer || 'No answer provided'}
        </Typography>
        
        {!isCorrect && (
          <Typography variant="body2" color="success.main">
            Correct answer: {answer.correctAnswer}
          </Typography>
        )}
        
        {(questionType === 'DESCRIPTIVE' || questionType === 'MCQ' || questionType === 'YES_NO' || questionType === 'TRUE_FALSE' || questionType === 'FILL_IN_BLANK' || questionType === 'SHORT_ANSWER') && (
          <>
            
            {loadingFeedbacks[answer.questionId] ? (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  Loading feedback...
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="primary.main" sx={{ mt: 1 }}>
                {feedbacks[answer.questionId] || 'No feedback available.'}
              </Typography>
            )}
          </>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert 
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          }
        >
          {error}
          {error.includes('Invalid quiz ID') && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Redirecting to dashboard...
            </Typography>
          )}
        </Alert>
      </Container>
    );
  }

  if (!attempt) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info">No quiz attempt found</Alert>
      </Container>
    );
  }

  const filteredAnswers = getFilteredAnswers();

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, ...quizStyles.questionCard }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Quiz Results
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Share Results">
              <IconButton onClick={() => setShowShareDialog(true)}>
                <ShareIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete All Attempts">
              <IconButton 
                color="error" 
                onClick={() => setShowDeleteDialog(true)}
                disabled={deleting}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {renderPerformanceBreakdown()}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={selectedTab} 
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All Questions" value="all" />
            <Tab label="Multiple Choice" value="MCQ" />
            <Tab label="Yes/No" value="YES_NO" />
            <Tab label="Descriptive" value="DESCRIPTIVE" />
          </Tabs>
        </Box>

        <List>
          {filteredAnswers.map((answer, index) => (
            <React.Fragment key={answer.questionId}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  bgcolor: answer.isCorrect ? 'success.light' : 'error.light',
                  mb: 1,
                  borderRadius: 1,
                  flexDirection: 'column',
                  alignItems: 'flex-start'
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                      Question {index + 1}: {answer.question}
                    </Typography>
                  }
                  secondary={renderAnswerDisplay(answer)}
                />
              </ListItem>
              {index < filteredAnswers.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={handleBackToDashboard}
          >
            Back to Dashboard
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleting}
            >
              Delete All Attempts
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRetry}
            >
              Retry Quiz
            </Button>
          </Box>
        </Box>
      </Paper>

      <Dialog
        open={showShareDialog}
        onClose={() => setShowShareDialog(false)}
      >
        <DialogTitle>Share Results</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Share your quiz results with others!
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              Score: {Math.round((attempt.answers.filter(a => a.isCorrect).length / attempt.answers.length) * 100)}%
            </Typography>
            <Typography variant="body2">
              Time: {Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowShareDialog(false)}>Close</Button>
          <Button 
            onClick={() => {
              navigator.clipboard.writeText(
                `I scored ${Math.round((attempt.answers.filter(a => a.isCorrect).length / attempt.answers.length) * 100)}% on my quiz!`
              );
              setShowShareDialog(false);
            }}
            color="primary"
          >
            Copy to Clipboard
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showDeleteDialog}
        onClose={() => !deleting && setShowDeleteDialog(false)}
      >
        <DialogTitle>Delete All Attempts?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete all attempts for this test? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowDeleteDialog(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteAllAttempts}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete All'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QuizResult;