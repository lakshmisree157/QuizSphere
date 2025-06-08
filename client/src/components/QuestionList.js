import React, { useEffect, useState } from 'react';
import { 
  Typography, 
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Box,
  CircularProgress,
  Alert,
  Chip,
  TextField
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';
import { io } from 'socket.io-client';

const QuestionList = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/questions`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        // Organize questions by topic
        const topicSet = new Set();
        response.data.forEach(q => {
          if (q.mainTopic) topicSet.add(q.mainTopic);
        });
        setTopics(Array.from(topicSet));
        setQuestions(response.data);
      } catch (error) {
        console.error('Failed to fetch questions:', error);
        setError('Failed to load questions');
      } finally {
        setLoading(false);
      }
    };

    // Socket connection for real-time updates
    const socket = io(process.env.REACT_APP_API_URL, {
      auth: { token }
    });

    socket.on('questions-generated', (newQuestions) => {
      setQuestions(prevQuestions => {
        const updated = [...newQuestions, ...prevQuestions];
        const topicSet = new Set();
        updated.forEach(q => {
          if (q.mainTopic) topicSet.add(q.mainTopic);
        });
        setTopics(Array.from(topicSet));
        return updated;
      });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    fetchQuestions();

    return () => socket.disconnect();
  }, []);

  const handleAnswerSelect = (questionId, value) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const renderQuestionInput = (question) => {
    switch (question.type) {
      case 'MCQ':
        return (
          <FormControl component="fieldset">
            <RadioGroup
              value={selectedAnswers[question.uniqueId] || ''}
              onChange={(e) => handleAnswerSelect(question.uniqueId, e.target.value)}
            >
              {question.options.map((option, optIndex) => (
                <FormControlLabel
                  key={optIndex}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );
      
      case 'YES_NO':
        return (
          <FormControl component="fieldset">
            <RadioGroup
              value={selectedAnswers[question.uniqueId] || ''}
              onChange={(e) => handleAnswerSelect(question.uniqueId, e.target.value)}
            >
              <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
              <FormControlLabel value="No" control={<Radio />} label="No" />
            </RadioGroup>
          </FormControl>
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
            onChange={(e) => handleAnswerSelect(question.uniqueId, e.target.value)}
          />
        );

      case 'TRUE_FALSE':
        return (
          <FormControl component="fieldset">
            <RadioGroup
              value={selectedAnswers[question.uniqueId] || ''}
              onChange={(e) => handleAnswerSelect(question.uniqueId, e.target.value)}
            >
              <FormControlLabel value="True" control={<Radio />} label="True" />
              <FormControlLabel value="False" control={<Radio />} label="False" />
            </RadioGroup>
          </FormControl>
        );

      case 'SHORT_ANSWER':
        return (
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Enter your answer here..."
            value={selectedAnswers[question.uniqueId] || ''}
            onChange={(e) => handleAnswerSelect(question.uniqueId, e.target.value)}
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {questions.length === 0 ? (
        <Typography color="textSecondary" align="center">
          No questions generated yet. Upload a PDF to get started.
        </Typography>
      ) : (
        <Paper sx={{ mt: 2, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Generated Questions
          </Typography>
          
          {topics.map((topic) => (
            <Box key={topic} sx={{ mb: 3 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                {topic}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {questions
                  .filter(q => q.mainTopic === topic)
                  .map((question, index) => (
                    <Accordion key={question.uniqueId || index}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography>Question {index + 1}</Typography>
                          <Chip
                            label={question.type}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                          {question.subtopic && (
                            <Chip
                              label={question.subtopic}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography gutterBottom>
                          {question.content}
                        </Typography>
                        {renderQuestionInput(question)}
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Typography variant="caption" color="textSecondary">
                            Bloom's Level: {question.bloomLevel}
                          </Typography>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                ))}
              </Box>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default QuestionList;