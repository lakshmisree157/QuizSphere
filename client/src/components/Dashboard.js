import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Button, Box, Paper,
  Table, TableBody, TableCell, TableHead, TableRow,
  Grid, CircularProgress, Alert 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { dashboardStyles } from '../styles/components';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import QuizIcon from '@mui/icons-material/Quiz';
import ReplayIcon from '@mui/icons-material/Replay';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

const Dashboard = () => {
  const [tests, setTests] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" m={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<UploadFileIcon />}
                sx={dashboardStyles.uploadButton}
                onClick={() => navigate('/upload')}
              >
                Upload New PDF
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
                      <TableCell>Questions</TableCell>
                      <TableCell>Created At</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tests.map((test) => (
                      <TableRow 
                        key={test._id} 
                        sx={dashboardStyles.tableRowHover}
                      >
                        <TableCell>{test.testName}</TableCell>
                        <TableCell>{test.questions?.length || 0}</TableCell>
                        <TableCell>
                          {new Date(test.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<QuizIcon />}
                            onClick={() => navigate(`/quiz/${test._id}`)}
                            disabled={!test.questions?.length}
                            sx={{ mr: 1 }}
                          >
                            Take Quiz
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {quizAttempts.map((attempt) => (
                      <TableRow 
                        key={attempt._id} 
                        sx={dashboardStyles.tableRowHover}
                      >
                        <TableCell>{attempt.testId?.testName || 'Unknown Test'}</TableCell>
                        <TableCell>{attempt.score}%</TableCell>
                        <TableCell>
                          {new Date(attempt.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={() => navigate(`/quiz-result/${attempt._id}`)}
                            sx={{ mr: 1 }}
                          >
                            View Results
                          </Button>
                          <Button
                            variant="contained"
                            startIcon={<ReplayIcon />}
                            onClick={() => navigate(`/quiz-retry/${attempt._id}`)}
                            sx={{ mr: 1 }}
                          >
                            Retake
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this quiz attempt?')) {
                                try {
                                  const token = localStorage.getItem('token');
                                  console.log(`Deleting quiz attempt ${attempt._id} with token ${token}`);
                                  const response = await fetch(`${process.env.REACT_APP_API_URL}/api/quiz-attempts/${attempt._id}`, {
                                    method: 'DELETE',
                                    headers: {
                                      'Authorization': `Bearer ${token}`
                                    }
                                  });
                                  console.log('Delete response status:', response.status);
                                  if (!response.ok) {
                                    throw new Error('Delete request failed');
                                  }
                                  // Refresh quiz attempts after deletion
                                  setQuizAttempts(prev => prev.filter(a => a._id !== attempt._id));
                                } catch (error) {
                                  console.error('Failed to delete quiz attempt:', error);
                                  alert('Failed to delete quiz attempt');
                                }
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
    </Container>
  );
};

export default Dashboard;