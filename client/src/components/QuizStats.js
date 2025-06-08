import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { quizStyles } from '../styles/components';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const QuizStats = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('=== Quiz Stats Fetch Started ===');
        console.log('Test ID:', testId);
        
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          navigate('/login');
          return;
        }

        console.log('Making request to fetch test stats');
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/tests/${testId}/stats`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        console.log('Test stats response:', response.data);

        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Failed to fetch test stats');
        }

        const { stats } = response.data;
        
        // Set test data
        setTest({
          _id: testId,
          testName: stats.testName,
          questions: Object.entries(stats.questionTypeBreakdown).map(([type, count]) => ({
            type,
            count
          }))
        });

        // Set attempts data
        setAttempts(stats.recentAttempts.map(attempt => ({
          _id: attempt._id,
          score: attempt.score,
          timeSpent: attempt.timeSpent,
          createdAt: attempt.date,
          answers: attempt.answers || []
        })));

        console.log('Stats data processed:', {
          testName: stats.testName,
          questionTypes: Object.keys(stats.questionTypeBreakdown),
          attemptCount: stats.recentAttempts.length
        });

      } catch (error) {
        console.error('Error fetching stats data:', error);
        setError(error.response?.data?.error || error.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [testId, navigate]);

  const getQuestionTypeStats = () => {
    const stats = {
      MCQ: { total: 0, correct: 0 },
      YES_NO: { total: 0, correct: 0 },
      DESCRIPTIVE: { total: 0, correct: 0 },
      TRUE_FALSE: { total: 0, correct: 0 },
      SHORT_ANSWER: { total: 0, correct: 0 },
      FILL_IN_BLANK: { total: 0, correct: 0 }
    };

    attempts.forEach(attempt => {
      attempt.answers.forEach(answer => {
        const type = answer.type || 'MCQ';
        if (!stats[type]) {
          stats[type] = { total: 0, correct: 0 };
        }
        stats[type].total++;
        if (answer.isCorrect) {
          stats[type].correct++;
        }
      });
    });

    return Object.entries(stats).map(([type, data]) => ({
      type,
      total: data.total,
      correct: data.correct,
      percentage: data.total > 0 ? (data.correct / data.total) * 100 : 0
    }));
  };

  const getScoreDistribution = () => {
    const distribution = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };

    attempts.forEach(attempt => {
      const score = attempt.score;
      if (score <= 20) distribution['0-20']++;
      else if (score <= 40) distribution['21-40']++;
      else if (score <= 60) distribution['41-60']++;
      else if (score <= 80) distribution['61-80']++;
      else distribution['81-100']++;
    });

    return Object.entries(distribution).map(([range, count]) => ({
      range,
      count,
      percentage: (count / attempts.length) * 100
    }));
  };

  const getAverageTimePerQuestion = () => {
    if (attempts.length === 0) return 0;
    const totalTime = attempts.reduce((sum, a) => sum + a.timeSpent, 0);
    const totalQuestions = attempts.reduce((sum, a) => sum + a.answers.length, 0);
    return totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0;
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

  if (!test) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">Test not found</Alert>
      </Container>
    );
  }

  const typeStats = getQuestionTypeStats();
  const scoreDistribution = getScoreDistribution();
  const avgTimePerQuestion = getAverageTimePerQuestion();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>

        <Typography variant="h4" gutterBottom>
          {test.testName} - Statistics
        </Typography>

        <Grid container spacing={3}>
          {/* Overview Cards */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Attempts
                </Typography>
                <Typography variant="h3">
                  {attempts.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Average Score
                </Typography>
                <Typography variant="h3">
                  {attempts.length > 0
                    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
                    : 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Avg Time per Question
                </Typography>
                <Typography variant="h3">
                  {avgTimePerQuestion}s
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Question Type Performance */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Performance by Question Type
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="percentage" name="Correct %" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ mt: 2 }}>
                {typeStats.map((stat) => (
                  <Box key={stat.type} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">
                        {stat.type}
                      </Typography>
                      <Typography variant="body2">
                        {Math.round(stat.percentage)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={stat.percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: stat.percentage >= 70 ? 'success.main' :
                                  stat.percentage >= 50 ? 'warning.main' : 'error.main'
                        }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Score Distribution */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Score Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={scoreDistribution}
                      dataKey="count"
                      nameKey="range"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {scoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ mt: 2 }}>
                {scoreDistribution.map((dist) => (
                  <Box key={dist.range} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">
                        {dist.range}%
                      </Typography>
                      <Typography variant="body2">
                        {dist.count} attempts ({Math.round(dist.percentage)}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={dist.percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'grey.200'
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Recent Attempts */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Attempts
              </Typography>
              <Grid container spacing={2}>
                {attempts.slice(0, 5).map((attempt) => (
                  <Grid item xs={12} key={attempt._id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="subtitle1">
                                Score: {attempt.score}%
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(attempt.createdAt).toLocaleString()}
                              </Typography>
                            </Box>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                console.log('Attempt data from stats before navigation:', {
                                  attemptId: attempt._id,
                                  testId: attempt.testId?._id,
                                  score: attempt.score
                                });
                                if (!attempt._id) {
                                  console.error('No attempt ID available for navigation from stats');
                                  return;
                                }
                                navigate(`/quiz-result/${attempt._id}`);
                              }}
                            >
                              View Details
                            </Button>
                          </Box>

                          <Divider />

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {attempt.answers.map((answer, index) => (
                              <Box key={index} sx={{ 
                                p: 1, 
                                bgcolor: 'background.default',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: answer.isCorrect ? 'success.light' : 'error.light'
                              }}>
                                <Typography variant="body2" gutterBottom>
                                  Q{index + 1}: {answer.question}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                  <Chip
                                    label={answer.type}
                                    size="small"
                                    color={answer.isCorrect ? 'success' : 'error'}
                                    variant="outlined"
                                  />
                                  {answer.type === 'MCQ' && (
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                      {answer.options.map((option, optIndex) => (
                                        <Chip
                                          key={optIndex}
                                          label={option}
                                          size="small"
                                          variant="outlined"
                                          color={
                                            option === answer.correctAnswer ? 'success' :
                                            option === answer.userAnswer ? 'error' : 'default'
                                          }
                                        />
                                      ))}
                                    </Box>
                                  )}
                                  {answer.type === 'YES_NO' && (
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <Chip
                                        label={`Your Answer: ${answer.userAnswer}`}
                                        size="small"
                                        color={answer.isCorrect ? 'success' : 'error'}
                                        variant="outlined"
                                      />
                                      <Chip
                                        label={`Correct Answer: ${answer.correctAnswer}`}
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                      />
                                    </Box>
                                  )}
                                  {answer.type === 'DESCRIPTIVE' && (
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <Typography variant="body2" color="text.secondary">
                                        Your Answer: {answer.userAnswer || 'No answer provided'}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default QuizStats; 