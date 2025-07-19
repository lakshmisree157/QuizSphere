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

    res.json({
      success: true,
      questions,
      testName: test.testName
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions'
    });
  }
});

// Get test statistics
router.get('/:testId/stats', async (req, res) => {
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

    // Get all attempts for this test
    const attempts = await QuizAttempt.find({
      testId: req.params.testId,
      userId: req.user._id
    })
    .sort('-createdAt')
    .lean();

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

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test statistics'
    });
  }
});

// Get sample test (accessible to all users)
router.get('/sample', async (req, res) => {
  try {
    const sampleTest = await Test.findOne({ isSample: true }).lean();
    if (!sampleTest) {
      return res.status(404).json({ success: false, error: 'Sample test not found' });
    }
    res.json({ success: true, test: sampleTest });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch sample test' });
  }
});

// Delete a test and all its quiz attempts
router.delete('/:testId', async (req, res) => {
  try {
    const testId = req.params.testId;
    // Remove the test
    const testResult = await Test.deleteOne({ _id: testId, userId: req.user._id });
    // Remove all quiz attempts for this test
    const attemptsResult = await QuizAttempt.deleteMany({ testId: testId, userId: req.user._id });
    if (testResult.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Test not found or not authorized' });
    }
    res.json({ success: true, message: 'Test and related attempts deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete test' });
  }
});

module.exports = router;
