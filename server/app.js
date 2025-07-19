const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const authRouter = require('./routes/auth');
const questionsRouter = require('./routes/questions');
const testsRouter = require('./routes/tests');
const quizAttemptsRouter = require('./routes/quizAttempts');
const feedbackRouter = require('./routes/feedback');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    // Remove all console.log statements
  })
  .catch(err => {
    // Remove all console.log statements
  });

// Routes
app.use('/api/auth', authRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/tests', testsRouter);
app.use('/api/quiz-attempts', quizAttemptsRouter);
app.use('/api/feedback', feedbackRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  // Remove all console.log statements
  res.status(500).json({ error: 'Something broke!' });
});

module.exports = app;