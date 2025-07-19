const express = require('express');
const router = express.Router();
const QuizAttempt = require('../models/quizAttempt');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// POST /api/feedback - Store feedback within quiz attempt
router.post(
  '/',
  auth,
  [
    body('quizId').notEmpty().withMessage('quizId is required'),
    body('questionId').notEmpty().withMessage('questionId is required'),
    body('feedbackText').notEmpty().withMessage('feedbackText is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { quizId, questionId, feedbackText } = req.body;
      const userId = req.user._id;

      // Find the quiz attempt and update the specific answer's feedback
      const result = await QuizAttempt.updateOne(
        {
          _id: quizId,
          userId: userId,
          'answers.questionId': questionId
        },
        {
          $set: {
            'answers.$.feedback': {
              text: feedbackText,
              submittedAt: new Date()
            }
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Quiz attempt or question not found' 
        });
      }

      if (result.modifiedCount === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'Failed to update feedback' 
        });
      }

      res.status(200).json({ 
        success: true,
        message: 'Feedback saved successfully' 
      });
    } catch (err) {
      res.status(500).json({ 
        success: false,
        error: 'Failed to save feedback' 
      });
    }
  }
);

// GET /api/feedback/:quizId - Get all feedback for a quiz attempt
router.get('/:quizId', auth, async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user._id;

    const attempt = await QuizAttempt.findOne({
      _id: quizId,
      userId: userId
    }).select('answers.questionId answers.feedback');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: 'Quiz attempt not found'
      });
    }

    // Extract feedback data
    const feedbackData = attempt.answers
      .filter(answer => answer.feedback && answer.feedback.text)
      .map(answer => ({
        questionId: answer.questionId,
        feedback: answer.feedback.text,
        submittedAt: answer.feedback.submittedAt
      }));

    res.json({
      success: true,
      feedback: feedbackData
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback'
    });
  }
});

module.exports = router; 