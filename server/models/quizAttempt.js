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
    type: {
      type: String,
      enum: ['MCQ', 'YES_NO', 'DESCRIPTIVE'],
      required: true
    },
    options: [{
      type: String,
      required: function() {
        return this.type === 'MCQ' || this.type === 'YES_NO';
      }
    }]
  }],
  timeSpent: Number,
  totalQuestions: Number,
  score: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes
quizAttemptSchema.index({ userId: 1, testId: 1 });
quizAttemptSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);