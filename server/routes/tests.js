const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Test = require('../models/test');
const auth = require('../middleware/auth');

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

    res.json({
      success: true,
      questions: test.questions || [],
      testName: test.testName
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions'
    });
  }
});

module.exports = router;
