import React, { useState } from 'react';
import {
  Container, Typography, Box, Paper, TextField, Button,
  IconButton, FormControl, InputLabel, Select, MenuItem,
  Grid, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Snackbar, Tooltip, Card,
  CardContent, DragIndicator
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PreviewIcon from '@mui/icons-material/Preview';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [testName, setTestName] = useState('');
  const [questions, setQuestions] = useState([{
    content: '',
    type: 'MCQ',
    options: ['', '', '', ''],
    correctAnswer: '',
    bloomLevel: 1
  }]);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [showValidation, setShowValidation] = useState(false);

  const handleAddQuestion = () => {
    setQuestions([...questions, {
      content: '',
      type: 'MCQ',
      options: ['', '', '', ''],
      correctAnswer: '',
      bloomLevel: 1
    }]);
  };

  const handleDuplicateQuestion = (index) => {
    const newQuestions = [...questions];
    const duplicatedQuestion = {
      ...newQuestions[index],
      content: `${newQuestions[index].content} (Copy)`
    };
    newQuestions.splice(index + 1, 0, duplicatedQuestion);
    setQuestions(newQuestions);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setQuestions(items);
  };

  const validateQuestion = (question) => {
    if (!question.content.trim()) {
      return 'Question content is required';
    }
    if (question.type === 'MCQ') {
      if (!question.correctAnswer) {
        return 'Please select a correct answer';
      }
      if (question.options.some(opt => !opt.trim())) {
        return 'All MCQ options must be filled';
      }
    }
    if (question.type === 'YES_NO' && !question.correctAnswer) {
      return 'Please select Yes or No as the correct answer';
    }
    if (question.type === 'DESCRIPTIVE' && !question.correctAnswer.trim()) {
      return 'Please provide an expected answer';
    }
    return null;
  };

  const handleSubmit = async () => {
    // Validate all questions
    const errors = questions.map(validateQuestion);
    const hasErrors = errors.some(error => error !== null);
    
    if (hasErrors) {
      setValidationError(errors.find(error => error !== null));
      setShowValidation(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

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
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.test) {
        navigate(`/quiz/${response.data.test._id}`);
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      setValidationError('Failed to create quiz. Please try again.');
      setShowValidation(true);
    }
  };

  const handleQuestionTypeChange = (qIndex, newType) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].type = newType;
    
    // Reset options and correct answer based on type
    if (newType === 'YES_NO') {
      newQuestions[qIndex].options = ['Yes', 'No'];
      newQuestions[qIndex].correctAnswer = 'Yes';
    } else if (newType === 'DESCRIPTIVE') {
      newQuestions[qIndex].options = [];
      newQuestions[qIndex].correctAnswer = '';
    } else { // MCQ
      newQuestions[qIndex].options = ['', '', '', ''];
      newQuestions[qIndex].correctAnswer = '';
    }
    
    setQuestions(newQuestions);
  };

  const renderQuestionInputs = (question, qIndex) => {
    switch (question.type) {
      case 'MCQ':
        return (
          <>
            <Grid item xs={12}>
              {question.options.map((option, oIndex) => (
                <TextField
                  key={oIndex}
                  label={`Option ${oIndex + 1}`}
                  value={option}
                  onChange={(e) => {
                    const newQuestions = [...questions];
                    newQuestions[qIndex].options[oIndex] = e.target.value;
                    setQuestions(newQuestions);
                  }}
                  fullWidth
                  sx={{ mb: 2 }}
                />
              ))}
            </Grid>
            <Grid item xs={12}>
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
          </>
        );

      case 'YES_NO':
        return (
          <Grid item xs={12}>
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
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        );

      case 'DESCRIPTIVE':
        return (
          <Grid item xs={12}>
            <TextField
              label="Expected Answer"
              value={question.correctAnswer}
              onChange={(e) => {
                const newQuestions = [...questions];
                newQuestions[qIndex].correctAnswer = e.target.value;
                setQuestions(newQuestions);
              }}
              fullWidth
              multiline
              rows={4}
              placeholder="Enter the expected answer or key points..."
            />
          </Grid>
        );

      default:
        return null;
    }
  };

  const renderPreview = (question) => {
    return (
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Chip label={question.type} size="small" color="secondary" />
            <Chip label={`Bloom's Level ${question.bloomLevel}`} size="small" />
          </Box>
          
          <Typography variant="h6" gutterBottom>
            {question.content}
          </Typography>

          {question.type === 'MCQ' && (
            <RadioGroup value={question.correctAnswer}>
              {question.options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option}
                  control={<Radio checked={option === question.correctAnswer} />}
                  label={option}
                />
              ))}
            </RadioGroup>
          )}

          {question.type === 'YES_NO' && (
            <RadioGroup value={question.correctAnswer}>
              <FormControlLabel value="Yes" control={<Radio checked={question.correctAnswer === 'Yes'} />} label="Yes" />
              <FormControlLabel value="No" control={<Radio checked={question.correctAnswer === 'No'} />} label="No" />
            </RadioGroup>
          )}

          {question.type === 'DESCRIPTIVE' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Expected Answer:
              </Typography>
              <Typography variant="body2">
                {question.correctAnswer}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
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
            error={showValidation && !testName.trim()}
            helperText={showValidation && !testName.trim() ? 'Test name is required' : ''}
            sx={{ mb: 3 }}
          />

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="questions">
              {(provided) => (
                <Box {...provided.droppableProps} ref={provided.innerRef}>
                  {questions.map((question, qIndex) => (
                    <Draggable key={qIndex} draggableId={`question-${qIndex}`} index={qIndex}>
                      {(provided) => (
                        <Paper
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          elevation={2}
                          sx={{ p: 2, mb: 2 }}
                        >
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box {...provided.dragHandleProps}>
                                    <DragHandleIcon color="action" />
                                  </Box>
                                  <Typography variant="h6">
                                    Question {qIndex + 1}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Tooltip title="Preview Question">
                                    <IconButton onClick={() => setPreviewQuestion(question)}>
                                      <PreviewIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Duplicate Question">
                                    <IconButton onClick={() => handleDuplicateQuestion(qIndex)}>
                                      <ContentCopyIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <FormControl size="small">
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                      value={question.type}
                                      label="Type"
                                      onChange={(e) => handleQuestionTypeChange(qIndex, e.target.value)}
                                      sx={{ minWidth: 120 }}
                                    >
                                      <MenuItem value="MCQ">Multiple Choice</MenuItem>
                                      <MenuItem value="YES_NO">Yes/No</MenuItem>
                                      <MenuItem value="DESCRIPTIVE">Descriptive</MenuItem>
                                    </Select>
                                  </FormControl>
                                  <IconButton
                                    color="error"
                                    onClick={() => {
                                      const newQuestions = questions.filter((_, i) => i !== qIndex);
                                      setQuestions(newQuestions.length ? newQuestions : [{
                                        content: '',
                                        type: 'MCQ',
                                        options: ['', '', '', ''],
                                        correctAnswer: '',
                                        bloomLevel: 1
                                      }]);
                                    }}
                                    disabled={questions.length === 1}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              </Box>
                            </Grid>

                            <Grid item xs={12}>
                              <TextField
                                label="Question"
                                value={question.content}
                                onChange={(e) => {
                                  const newQuestions = [...questions];
                                  newQuestions[qIndex].content = e.target.value;
                                  setQuestions(newQuestions);
                                }}
                                fullWidth
                                multiline
                                rows={2}
                                required
                                error={showValidation && !question.content.trim()}
                                helperText={showValidation && !question.content.trim() ? 'Question content is required' : ''}
                              />
                            </Grid>

                            {renderQuestionInputs(question, qIndex)}

                            <Grid item xs={12}>
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
                          </Grid>
                        </Paper>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddQuestion}
            >
              Add Question
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={!testName.trim()}
            >
              Create Quiz
            </Button>
          </Box>
        </Paper>
      </Box>

      <Dialog
        open={!!previewQuestion}
        onClose={() => setPreviewQuestion(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Question Preview</DialogTitle>
        <DialogContent>
          {previewQuestion && renderPreview(previewQuestion)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewQuestion(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showValidation}
        autoHideDuration={6000}
        onClose={() => setShowValidation(false)}
      >
        <Alert severity="error" onClose={() => setShowValidation(false)}>
          {validationError}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CreateQuiz;