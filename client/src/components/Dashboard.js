import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Button, Box, Paper,
  Table, TableBody, TableCell, TableHead, TableRow,
  Grid, CircularProgress, Alert, Chip, Dialog,
  DialogTitle, DialogContent, DialogContentText,
  DialogActions, Card, CardContent, IconButton,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { dashboardStyles } from '../styles/components';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import QuizIcon from '@mui/icons-material/Quiz';
import ReplayIcon from '@mui/icons-material/Replay';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BarChartIcon from '@mui/icons-material/BarChart';
import InfoIcon from '@mui/icons-material/Info';
import { Edit as EditIcon, PlayArrow as PlayArrowIcon } from '@mui/icons-material';

const Dashboard = () => {
  const [tests, setTests] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const [testsResponse, attemptsResponse] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/tests`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/api/quiz-attempts`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        setTests(testsResponse.data?.tests || []);
        setQuizAttempts(attemptsResponse.data?.attempts || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error.response?.data?.error || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleDeleteAttempt = async () => {
    if (!selectedAttempt) return;

    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/quiz-attempts/${selectedAttempt._id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setQuizAttempts(prev => prev.filter(a => a._id !== selectedAttempt._id));
      } else {
        throw new Error('Failed to delete attempt');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete attempt');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
      setSelectedAttempt(null);
    }
  };

  const getQuestionTypeStats = (questions) => {
    const stats = {
      MCQ: 0,
      YES_NO: 0,
      DESCRIPTIVE: 0,
      TRUE_FALSE: 0,
      SHORT_ANSWER: 0
    };

    questions?.forEach(q => {
      const type = (q.type || 'MCQ').toUpperCase().trim();
      if (!stats.hasOwnProperty(type)) {
        stats[type] = 0;
      }
      stats[type]++;
    });

    return stats;
  };

  const getAttemptStats = (testId) => {
    const testAttempts = quizAttempts.filter(a => a.testId._id === testId);
    if (testAttempts.length === 0) return null;

    const totalAttempts = testAttempts.length;
    const avgScore = testAttempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts;
    const bestScore = Math.max(...testAttempts.map(a => a.score));
    const latestAttempt = new Date(Math.max(...testAttempts.map(a => new Date(a.createdAt))));

    return {
      totalAttempts,
      avgScore: Math.round(avgScore),
      bestScore,
      latestAttempt
    };
  };

  const renderQuestionTypeChips = (questions) => {
    const stats = getQuestionTypeStats(questions);
    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        {Object.entries(stats).map(([type, count]) => (
          count > 0 && (
            <Chip
              key={type}
              label={`${type}: ${count}`}
              size="small"
              color="secondary"
              variant="outlined"
            />
          )
        ))}
      </Box>
    );
  };

  const renderTestCard = (test) => {
    const stats = getQuestionTypeStats(test.questions);
    const attemptStats = getAttemptStats(test._id);

    return (
      <Card key={test._id} sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                {test.testName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {test.description}
              </Typography>
              {renderQuestionTypeChips(test.questions)}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="View Statistics">
                <IconButton
                  onClick={() => navigate(`/quiz-stats/${test._id}`)}
                  color="primary"
                >
                  <BarChartIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit Quiz">
                <IconButton
                  onClick={() => navigate(`/edit-quiz/${test._id}`)}
                  color="primary"
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Start Quiz">
                <IconButton
                  onClick={() => navigate(`/quiz/${test._id}`)}
                  color="success"
                >
                  <PlayArrowIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {attemptStats && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Performance Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Best Score
                  </Typography>
                  <Typography variant="h6">
                    {attemptStats.bestScore}%
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Average Score
                  </Typography>
                  <Typography variant="h6">
                    {attemptStats.avgScore}%
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Total Attempts
                  </Typography>
                  <Typography variant="h6">
                    {attemptStats.totalAttempts}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
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
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4">
                Quiz Dashboard
              </Typography>
              <Button
                variant="contained"
                startIcon={<UploadFileIcon />}
                onClick={() => navigate('/upload')}
              >
                Upload PDF
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>Available Tests</Typography>
            {tests.length > 0 ? (
              <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Test Name</TableCell>
                      <TableCell>Question Types</TableCell>
                      <TableCell>Total Questions</TableCell>
                      <TableCell>Performance</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tests.map((test) => {
                      const stats = getAttemptStats(test._id);
                      return (
                        <TableRow 
                          key={test._id} 
                          sx={dashboardStyles.tableRowHover}
                        >
                          <TableCell>{test.testName}</TableCell>
                          <TableCell>
                            {renderQuestionTypeChips(test.questions)}
                          </TableCell>
                          <TableCell>{test.questions?.length || 0}</TableCell>
                          <TableCell>
                            {stats ? (
                              <Box>
                                <Typography variant="body2">
                                  Attempts: {stats.totalAttempts}
                                </Typography>
                                <Typography variant="body2">
                                  Avg Score: {stats.avgScore}%
                                </Typography>
                                <Typography variant="body2">
                                  Best Score: {stats.bestScore}%
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No attempts yet
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Take Quiz">
                                <Button
                                  variant="contained"
                                  color="primary"
                                  startIcon={<QuizIcon />}
                                  onClick={() => navigate(`/quiz/${test._id}`)}
                                  disabled={!test.questions?.length}
                                >
                                  Take Quiz
                                </Button>
                              </Tooltip>
                              {stats && (
                                <Tooltip title="View Statistics">
                                  <IconButton
                                    color="primary"
                                    onClick={() => navigate(`/quiz-stats/${test._id}`)}
                                  >
                                    <BarChartIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Paper>
            ) : (
              <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1">
                  No tests available. Upload a PDF to create a test.
                </Typography>
              </Paper>
            )}
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>Recent Quiz Attempts</Typography>
            {quizAttempts.length > 0 ? (
              <Paper elevation={3} sx={{ p: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Test Name</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Question Types</TableCell>
                      <TableCell>Time Spent</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {quizAttempts.map((attempt) => {
                      const typeStats = getQuestionTypeStats(attempt.answers);
                      return (
                        <TableRow 
                          key={attempt._id} 
                          sx={dashboardStyles.tableRowHover}
                        >
                          <TableCell>{attempt.testId?.testName || 'Unknown Test'}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography
                                variant="body1"
                                sx={{
                                  color: attempt.score >= 70 ? 'success.main' :
                                         attempt.score >= 50 ? 'warning.main' : 'error.main'
                                }}
                              >
                                {attempt.score}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {renderQuestionTypeChips(attempt.answers)}
                          </TableCell>
                          <TableCell>
                            {Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s
                          </TableCell>
                          <TableCell>
                            {new Date(attempt.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="View Results">
                                <Button
                                  variant="outlined"
                                  startIcon={<VisibilityIcon />}
                                  onClick={() => {
                                    console.log('Attempt data before navigation:', {
                                      attemptId: attempt._id,
                                      testId: attempt.testId?._id,
                                      score: attempt.score
                                    });
                                    if (!attempt._id) {
                                      console.error('No attempt ID available for navigation');
                                      return;
                                    }
                                    navigate(`/quiz-result/${attempt._id}`);
                                  }}
                                >
                                  View
                                </Button>
                              </Tooltip>
                              <Tooltip title="Retake Quiz">
                                <Button
                                  variant="contained"
                                  startIcon={<ReplayIcon />}
                                  onClick={() => navigate(`/quiz/${attempt.testId?._id || ''}`)}
                                >
                                  Retake
                                </Button>
                              </Tooltip>
                              <Tooltip title="Delete Attempt">
                                <IconButton
                                  color="error"
                                  onClick={() => {
                                    setSelectedAttempt(attempt);
                                    setShowDeleteDialog(true);
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Paper>
            ) : (
              <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
                <Typography>No quiz attempts yet.</Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>

      <Dialog
        open={showDeleteDialog}
        onClose={() => !deleting && setShowDeleteDialog(false)}
      >
        <DialogTitle>Delete Quiz Attempt?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this quiz attempt? This action cannot be undone.
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
            onClick={handleDeleteAttempt}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;