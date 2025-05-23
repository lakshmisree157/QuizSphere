// server/models/quizAttempt.js
const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  answers: [{
    questionId: String,
    question: String,
    userAnswer: String,
    correctAnswer: String,
    isCorrect: Boolean,
    options: [String]
  }],
  timeSpent: Number,
  totalQuestions: Number,
  score: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);