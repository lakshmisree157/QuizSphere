import React, { useState } from 'react';
import {
  Container, Typography, Box, Paper, TextField, Button,
  IconButton, FormControl, InputLabel, Select, MenuItem,
  Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [testName, setTestName] = useState('');
  const [questions, setQuestions] = useState([{
    content: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    bloomLevel: 1,
    type: 'MCQ'
  }]);

  const handleAddQuestion = () => {
    setQuestions([...questions, {
      content: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      bloomLevel: 1,
      type: 'MCQ'
    }]);
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tests`,
        {
          testName,
          questions: questions.map(q => ({
            ...q,
            uniqueId: crypto.randomUUID()
          }))
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.test) {
        navigate(`/quiz/${response.data.test._id}`);
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create New Quiz
        </Typography>

        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <TextField
            label="Test Name"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            fullWidth
            required
            sx={{ mb: 3 }}
          />

          {questions.map((question, qIndex) => (
            <Paper key={qIndex} elevation={2} sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label={`Question ${qIndex + 1}`}
                    value={question.content}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[qIndex].content = e.target.value;
                      setQuestions(newQuestions);
                    }}
                    fullWidth
                    multiline
                    rows={2}
                  />
                </Grid>

                {question.options.map((option, oIndex) => (
                  <Grid item xs={6} key={oIndex}>
                    <TextField
                      label={`Option ${oIndex + 1}`}
                      value={option}
                      onChange={(e) => {
                        const newQuestions = [...questions];
                        newQuestions[qIndex].options[oIndex] = e.target.value;
                        setQuestions(newQuestions);
                      }}
                      fullWidth
                    />
                  </Grid>
                ))}

                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Correct Answer</InputLabel>
                    <Select
                      value={question.correctAnswer}
                      label="Correct Answer"
                      onChange={(e) => {
                        const newQuestions = [...questions];
                        newQuestions[qIndex].correctAnswer = e.target.value;
                        setQuestions(newQuestions);
                      }}
                    >
                      {question.options.map((option, index) => (
                        <MenuItem key={index} value={option}>
                          {option || `Option ${index + 1}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Bloom's Level</InputLabel>
                    <Select
                      value={question.bloomLevel}
                      label="Bloom's Level"
                      onChange={(e) => {
                        const newQuestions = [...questions];
                        newQuestions[qIndex].bloomLevel = e.target.value;
                        setQuestions(newQuestions);
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6].map((level) => (
                        <MenuItem key={level} value={level}>
                          Level {level}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {questions.length > 1 && (
                  <Grid item xs={12}>
                    <IconButton
                      color="error"
                      onClick={() => {
                        const newQuestions = questions.filter((_, i) => i !== qIndex);
                        setQuestions(newQuestions);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                )}
              </Grid>
            </Paper>
          ))}

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              onClick={handleAddQuestion}
            >
              Add Question
            </Button>

            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!testName || questions.some(q => !q.content || !q.correctAnswer)}
            >
              Create Quiz
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateQuiz;