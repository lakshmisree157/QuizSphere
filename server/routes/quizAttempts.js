// server/routes/quizAttempts.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const QuizAttempt = require('../models/quizAttempt');
const auth = require('../middleware/auth');

router.use(auth);

// Get quiz attempt by ID
router.get('/:quizId', async (req, res) => {
  console.log(`GET /api/quiz-attempts/${req.params.quizId} by user ${req.user._id}`);
  try {
    const attempt = await QuizAttempt.findOne({
      _id: req.params.quizId,
      userId: req.user._id
    }).populate('testId', 'testName');

    if (!attempt) {
      console.warn(`Quiz attempt not found: ${req.params.quizId} for user ${req.user._id}`);
      return res.status(404).json({
        success: false,
        error: 'Quiz attempt not found'
      });
    }

    console.log(`Quiz attempt found: ${attempt._id} for user ${req.user._id}`);

    res.json({
      success: true,
      attempt: {
        _id: attempt._id,
        testId: attempt.testId,
        answers: attempt.answers,
        timeSpent: attempt.timeSpent,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        createdAt: attempt.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching quiz attempt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quiz attempt'
    });
  }
});

// Get all quiz attempts for a user
router.get('/', async (req, res) => {
  console.log(`GET /api/quiz-attempts/ all attempts by user ${req.user._id}`);
  try {
    const attempts = await QuizAttempt.find({ userId: req.user._id })
      .populate('testId', 'testName')
      .sort('-createdAt')
      .lean();

    console.log(`Found ${attempts.length} attempts for user ${req.user._id}`);

    res.json({
      success: true,
      attempts: attempts
    });
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quiz attempts'
    });
  }
});

// Create new quiz attempt
router.post('/', async (req, res) => {
  console.log(`POST /api/quiz-attempts/ by user ${req.user._id}`);
  try {
    const { testId, answers, timeSpent, score } = req.body;
    
    const attempt = new QuizAttempt({
      userId: req.user._id,
      testId,
      answers,
      timeSpent,
      score,
      totalQuestions: answers.length
    });

    await attempt.save();

    console.log(`Quiz attempt saved: ${attempt._id} for user ${req.user._id}`);

    res.status(201).json({
      success: true,
      attemptId: attempt._id
    });
  } catch (error) {
    console.error('Error saving quiz attempt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save quiz attempt'
    });
  }
});

// Delete quiz attempt by ID
router.delete('/:quizId', async (req, res) => {
  console.log(`DELETE /api/quiz-attempts/${req.params.quizId} by user ${req.user._id}`);
  try {
    const result = await QuizAttempt.deleteOne({
      _id: req.params.quizId,
      userId: req.user._id
    });

    if (result.deletedCount === 0) {
      console.warn(`Quiz attempt not found or not deleted: ${req.params.quizId} for user ${req.user._id}`);
      return res.status(404).json({
        success: false,
        error: 'Quiz attempt not found or not deleted'
      });
    }

    console.log(`Quiz attempt deleted: ${req.params.quizId} for user ${req.user._id}`);

    res.json({
      success: true,
      message: 'Quiz attempt deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting quiz attempt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete quiz attempt'
    });
  }
});

module.exports = router;
