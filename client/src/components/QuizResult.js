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

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        // Validate quizId before making the request
        if (!quizId) {
          setError('No quiz attempt ID provided');
          setLoading(false);
          navigate('/dashboard');
          return;
        }

        if (quizId === 'undefined' || quizId === 'null') {
          setError('Invalid quiz attempt ID format');
          setLoading(false);
          navigate('/dashboard');
          return;
        }

        // Validate quizId format (should be a MongoDB ObjectId)
        if (!/^[0-9a-fA-F]{24}$/.test(quizId)) {
          setError('Invalid quiz attempt ID format');
          setLoading(false);
          navigate('/dashboard');
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/quiz-attempts/${quizId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Failed to fetch quiz attempt');
        }

        if (!response.data?.attempt) {
          throw new Error('No attempt data received');
        }

        setAttempt(response.data.attempt);

      } catch (err) {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to load quiz results';
        setError(errorMessage);
        
        // If it's an invalid ID error or not found, redirect to dashboard
        if (err.response?.status === 400 || err.response?.status === 404) {
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
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#2c3e50' }}>
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
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                Overall Score: {Math.round((totalCorrect / totalQuestions) * 100)}%
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
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
    const questionType = answer.type || 'MCQ';

    return (
      <Box sx={{ mt: 1, pl: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Chip
            label={questionType}
            size="small"
            sx={{ 
              backgroundColor: '#f8f9fa',
              color: '#495057',
              fontWeight: 500,
              border: '1px solid #dee2e6'
            }}
          />
          {isCorrect ? (
            <CheckCircleIcon sx={{ color: '#28a745' }} />
          ) : (
            <CancelIcon sx={{ color: '#dc3545' }} />
          )}
        </Box>
        
        <Typography variant="body2" sx={{ color: '#2c3e50', fontWeight: 600, mb: 1 }}>
          Your answer: {answer.userAnswer || 'No answer provided'}
        </Typography>
        
        {!isCorrect && (
          <Typography variant="body2" sx={{ color: '#dc3545', fontWeight: 600, mb: 1 }}>
            Correct answer: {answer.correctAnswer}
          </Typography>
        )}
        
        {answer.feedback && answer.feedback.text && (
          <Typography variant="body2" sx={{ mt: 1, color: '#17a2b8', fontStyle: 'italic', fontWeight: 500 }}>
            {answer.feedback.text}
          </Typography>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} sx={{ color: '#667eea' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert 
          severity="error"
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-icon': { color: '#dc3545' }
          }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => navigate('/dashboard')}
              sx={{ color: '#dc3545' }}
            >
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
        <Alert severity="info" sx={{ borderRadius: 2 }}>No quiz attempt found</Alert>
      </Container>
    );
  }

  const filteredAnswers = getFilteredAnswers();

  const getCardStyle = (isCorrect) => ({
    backgroundColor: isCorrect ? '#f8fff9' : '#fff8f8',
    border: `2px solid ${isCorrect ? '#28a745' : '#dc3545'}`,
    borderRadius: 6, // Reduced from 12 for less curviness
    marginBottom: 8, // Reduced from 24 for less space between boxes
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      transform: 'translateY(-1px)'
    }
  });

  const getChipColor = (isCorrect) => ({
    backgroundColor: isCorrect ? '#d4edda' : '#f8d7da',
    color: isCorrect ? '#155724' : '#721c24',
    fontWeight: 600,
    border: `1px solid ${isCorrect ? '#c3e6cb' : '#f5c6cb'}`
  });

  const getIconColor = (isCorrect) => (isCorrect ? '#28a745' : '#dc3545');

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          borderRadius: 3,
          border: '1px solid #e0e0e0',
          backgroundColor: '#ffffff'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, color: '#2c3e50' }}>
            Quiz Results
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Share Results">
              <IconButton 
                onClick={() => setShowShareDialog(true)}
                sx={{ 
                  color: '#667eea',
                  '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' }
                }}
              >
                <ShareIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete All Attempts">
              <IconButton 
                onClick={() => setShowDeleteDialog(true)}
                disabled={deleting}
                sx={{ 
                  color: '#dc3545',
                  '&:hover': { backgroundColor: 'rgba(220, 53, 69, 0.1)' }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {renderPerformanceBreakdown()}

        <Box sx={{ borderBottom: 2, borderColor: '#e0e0e0', mb: 3 }}>
          <Tabs 
            value={selectedTab} 
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                color: '#6c757d',
                fontWeight: 500,
                textTransform: 'none',
                fontSize: '1rem',
                '&.Mui-selected': {
                  color: '#667eea',
                  fontWeight: 600
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#667eea',
                height: 3
              }
            }}
          >
            <Tab label="All Questions" value="all" />
            <Tab label="Multiple Choice" value="MCQ" />
            <Tab label="Yes/No" value="YES_NO" />
            <Tab label="Descriptive" value="DESCRIPTIVE" />
          </Tabs>
        </Box>

        <List sx={{ p: 0 }}>
          {filteredAnswers.map((answer, index) => (
            <React.Fragment key={answer.questionId}>
              <Paper elevation={0} sx={getCardStyle(answer.isCorrect)}>
                <Box sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Chip
                      label={answer.type}
                      size="small"
                      sx={getChipColor(answer.isCorrect)}
                    />
                    {answer.isCorrect ? (
                      <CheckCircleIcon sx={{ color: getIconColor(true), fontSize: 28 }} />
                    ) : (
                      <CancelIcon sx={{ color: getIconColor(false), fontSize: 28 }} />
                    )}
                  </Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 2, 
                      color: '#2c3e50',
                      lineHeight: 1.4
                    }}
                  >
                    {`Question ${index + 1}: ${answer.question}`}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      mb: 2, 
                      color: '#495057',
                      fontWeight: 500
                    }}
                  >
                    Your answer: {answer.userAnswer || 'No answer provided'}
                  </Typography>
                  {!answer.isCorrect && (
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: '#dc3545', 
                        fontWeight: 600, 
                        mb: 2 
                      }}
                    >
                      Correct answer: {answer.correctAnswer}
                    </Typography>
                  )}
                  {answer.feedback && answer.feedback.text && (
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        mt: 2, 
                        color: '#17a2b8', 
                        fontStyle: 'italic',
                        fontWeight: 500,
                        backgroundColor: '#f8f9fa',
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid #e9ecef'
                      }}
                    >
                      {answer.feedback.text}
                    </Typography>
                  )}
                </Box>
              </Paper>
              {index < filteredAnswers.length - 1 && (
                <Divider sx={{ my: 1, borderColor: '#e0e0e0' }} /> // Reduced vertical margin
              )}
            </React.Fragment>
          ))}
        </List>

        <Box sx={{ mt: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={handleBackToDashboard}
            sx={{ 
              borderColor: '#6c757d',
              color: '#6c757d',
              fontWeight: 600,
              borderRadius: 2,
              px: 4,
              py: 1.5,
              '&:hover': {
                borderColor: '#495057',
                backgroundColor: 'rgba(108, 117, 125, 0.04)'
              }
            }}
          >
            Back to Dashboard
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleting}
              sx={{ 
                borderColor: '#dc3545',
                color: '#dc3545',
                fontWeight: 600,
                borderRadius: 2,
                px: 4,
                py: 1.5,
                '&:hover': {
                  borderColor: '#c82333',
                  backgroundColor: 'rgba(220, 53, 69, 0.04)'
                }
              }}
            >
              Delete All Attempts
            </Button>
            <Button
              variant="contained"
              onClick={handleRetry}
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontWeight: 600,
                borderRadius: 2,
                px: 4,
                py: 1.5,
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)'
                }
              }}
            >
              Retry Quiz
            </Button>
          </Box>
        </Box>
      </Paper>

      <Dialog
        open={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#2c3e50' }}>Share Results</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#6c757d', mb: 2 }}>
            Share your quiz results with others!
          </DialogContentText>
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50', mb: 1 }}>
              Score: {Math.round((attempt.answers.filter(a => a.isCorrect).length / attempt.answers.length) * 100)}%
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#2c3e50' }}>
              Time: {Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setShowShareDialog(false)}
            sx={{ color: '#6c757d', fontWeight: 600 }}
          >
            Close
          </Button>
          <Button 
            onClick={() => {
              navigator.clipboard.writeText(
                `I scored ${Math.round((attempt.answers.filter(a => a.isCorrect).length / attempt.answers.length) * 100)}% on my quiz!`
              );
              setShowShareDialog(false);
            }}
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
              }
            }}
          >
            Copy to Clipboard
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showDeleteDialog}
        onClose={() => !deleting && setShowDeleteDialog(false)}
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#2c3e50' }}>Delete All Attempts?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#6c757d' }}>
            Are you sure you want to delete all attempts for this test? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setShowDeleteDialog(false)}
            disabled={deleting}
            sx={{ color: '#6c757d', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteAllAttempts}
            disabled={deleting}
            sx={{ 
              backgroundColor: '#dc3545',
              color: 'white',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#c82333'
              }
            }}
          >
            {deleting ? 'Deleting...' : 'Delete All'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QuizResult;