const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Test = require('../models/test');
const auth = require('../middleware/auth');
const QuizAttempt = require('../models/quizAttempt');

router.use(auth);

// Get all tests
router.get('/', async (req, res) => {
  try {
    const tests = await Test.find({ userId: req.user._id })
      .select('testName questions createdAt')
      .sort('-createdAt')
      .lean();

    res.json({ success: true, tests: tests || [] });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tests' 
    });
  }
});

// Get test questions
router.get('/:testId/questions', async (req, res) => {
  try {
    const test = await Test.findOne({
      _id: req.params.testId,
      userId: req.user._id
    }).lean();

    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    // Ensure each question has the correct options based on type
    const questions = test.questions.map(q => ({
      ...q,
      options: q.type === 'MCQ' ? q.options : q.type === 'YES_NO' ? ['Yes', 'No'] : []
    }));

    console.log('Sending test questions:', questions); // Debug log

    res.json({
      success: true,
      questions,
      testName: test.testName
    });
  } catch (error) {
    console.error('Error fetching test questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions'
    });
  }
});

// Get test statistics
router.get('/:testId/stats', async (req, res) => {
  try {
    console.log('=== Test Stats Request ===');
    console.log('Test ID:', req.params.testId);
    console.log('User ID:', req.user._id);

    const test = await Test.findOne({
      _id: req.params.testId,
      userId: req.user._id
    }).lean();

    if (!test) {
      console.log('Test not found:', req.params.testId);
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    console.log('Test found:', {
      testId: test._id,
      testName: test.testName,
      questionCount: test.questions?.length
    });

    // Get all attempts for this test
    const attempts = await QuizAttempt.find({
      testId: req.params.testId,
      userId: req.user._id
    })
    .sort('-createdAt')
    .lean();

    console.log('Found attempts:', attempts.length);

    // Calculate statistics
    const stats = {
      testName: test.testName,
      questionTypeBreakdown: test.questions.reduce((acc, q) => {
        acc[q.type] = (acc[q.type] || 0) + 1;
        return acc;
      }, {}),
      recentAttempts: attempts.slice(0, 5).map(attempt => ({
        _id: attempt._id,
        score: attempt.score,
        timeSpent: attempt.timeSpent,
        date: attempt.createdAt,
        answers: attempt.answers.map(a => ({
          questionId: a.questionId,
          question: a.question,
          type: a.type,
          userAnswer: a.userAnswer,
          correctAnswer: a.correctAnswer,
          isCorrect: a.isCorrect,
          options: a.options || []
        }))
      }))
    };

    console.log('Sending stats response:', {
      testName: stats.testName,
      attemptCount: stats.recentAttempts.length,
      questionTypes: Object.keys(stats.questionTypeBreakdown)
    });

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching test statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test statistics'
    });
  }
});

module.exports = router;
