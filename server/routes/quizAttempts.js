const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');
const QuizAttempt = require('../models/quizAttempt');
const Test = require('../models/test');
const Question = require('../models/question');
const auth = require('../middleware/auth');

router.use(auth);

// Helper to extract option letter from userAnswer string
function extractOptionLetter(answer) {
  if (!answer) return '';
  const match = answer.match(/^[A-Z]/i);
  return match ? match[0].toUpperCase() : '';
}

// Helper to call ml-service similarity endpoint
async function getSimilarityFromMLService(userAnswer, correctAnswer) {
  try {
    const response = await axios.post('http://127.0.0.1:8000/api/evaluate/similarity', {
      userAnswer,
      correctAnswer
    });
    //print the output
    console.log('ML Service Similarity Response:', response.data);
    return response.data.similarity;
  } catch (error) {
    console.error('Error calling ML service similarity endpoint:', error.message);
    return 0; // fallback similarity
  }
}

// Helper to determine correctness based on question type
async function isAnswerCorrect(userAnswer, correctAnswer, type) {
  if (!userAnswer) return false;

  switch (type) {
    case 'MCQ':
      // Compare full trimmed, case-insensitive strings for MCQ
      return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    case 'YES_NO':
      return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    case 'DESCRIPTIVE':
    case 'SHORT_ANSWER':
      // Use similarity from ML service for descriptive and short answer
      const similarity = await getSimilarityFromMLService(userAnswer, correctAnswer);
      const threshold = 0.2; // similarity threshold for correctness
      return similarity >= threshold;
    case 'FILL_IN_BLANK':
      // Assuming fill-in-the-blank answers are compared as strings
      return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    case 'TRUE_FALSE':
      // Compare full trimmed, case-insensitive strings for TRUE_FALSE
      return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    default:
      return false;
  }
}

// Get quiz attempt by ID
router.get('/:quizId', async (req, res) => {
  const userId = req.user?._id;
  const quizId = req.params.quizId;
  
  console.log('=== Quiz Attempt Retrieval ===');
  console.log('User ID:', userId);
  console.log('Quiz ID:', quizId);

  try {
    if (!quizId || quizId === 'undefined') {
      console.log('Invalid quiz ID provided');
      return res.status(400).json({
        success: false,
        error: 'Invalid quiz ID provided'
      });
    }

    console.log('Looking up attempt...');
    const attempt = await QuizAttempt.findOne({
      _id: quizId,
      userId: userId
    }).populate('testId', '_id testName');

    if (!attempt) {
      console.log('Attempt not found:', { quizId, userId });
      return res.status(404).json({
        success: false,
        error: 'Quiz attempt not found'
      });
    }

    console.log('Attempt found:', {
      attemptId: attempt._id,
      userId: attempt.userId,
      score: attempt.score,
      testName: attempt.testId?.testName
    });

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
      .populate('testId', '_id testName')
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

// Get questions from a specific quiz attempt
router.get('/:quizId/questions', async (req, res) => {
  console.log(`GET /api/quiz-attempts/${req.params.quizId}/questions by user ${req.user._id}`);
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

    // Fetch bloomLevel for each questionId
    const questionIds = attempt.answers.map(a => a.questionId);
    const questionsData = await Question.find({ uniqueId: { $in: questionIds } }).lean();

    // Map bloomLevel by questionId for quick lookup
    const bloomLevelMap = {};
    questionsData.forEach(q => {
      bloomLevelMap[q.uniqueId] = q.bloomLevel;
    });

    // Return the questions from the attempt with all necessary data including bloomLevel
    const questions = attempt.answers.map(a => ({
      uniqueId: a.questionId,
      content: a.question,
      correctAnswer: a.correctAnswer,
      type: a.type,
      options: a.type === 'MCQ' ? a.options : a.type === 'YES_NO' ? ['Yes', 'No'] : [],
      userAnswer: a.userAnswer,
      isCorrect: a.isCorrect,
      bloomLevel: bloomLevelMap[a.questionId] || null
    }));

    console.log('Sending questions with bloomLevel:', questions); // Debug log

    res.json({
      success: true,
      questions,
      testName: attempt.testId.testName
    });
  } catch (error) {
    console.error('Error fetching quiz attempt questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions'
    });
  }
});

// Create new quiz attempt
router.post('/', async (req, res) => {
  const userId = req.user?._id;
  console.log('=== Quiz Attempt Creation ===');
  console.log('User ID:', userId);
  console.log('Request body:', {
    testId: req.body.testId,
    answersCount: req.body.answers?.length,
    timeSpent: req.body.timeSpent
  });

  try {
    let { testId, answers, timeSpent } = req.body;

    // Sanitize the type field in answers: trim and convert to uppercase to match enum values
    if (answers && Array.isArray(answers)) {
      answers = answers.map(answer => {
        if (answer.type && typeof answer.type === 'string') {
          answer.type = answer.type.trim().toUpperCase();
        }
        return answer;
      });

      // Debug log for sanitized answer types
      answers.forEach((answer, index) => {
        console.log(`Sanitized Answer ${index} type:`, answer.type);
      });
    }
    
    // Validate required fields
    if (!testId || !answers || !Array.isArray(answers) || answers.length === 0) {
      console.log('Validation failed:', { 
        hasTestId: !!testId, 
        hasAnswers: !!answers,
        isArray: Array.isArray(answers),
        answersLength: answers?.length 
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid quiz attempt data'
      });
    }

    // Get the test to get the questions
    const test = await Test.findById(testId);
    if (!test) {
      console.log('Test not found:', testId);
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    console.log('Test found:', {
      testId: test._id,
      testName: test.testName,
      questionCount: test.questions.length
    });

    // Calculate correctness and score
    let correctCount = 0;
    const updatedAnswers = [];
    for (const answer of answers) {
      const isCorrect = await isAnswerCorrect(answer.userAnswer, answer.correctAnswer, answer.type);
      if (isCorrect) correctCount++;
      updatedAnswers.push({
        ...answer,
        isCorrect
      });
    }

    const score = (correctCount / answers.length) * 100;

    // Create and save attempt
    const attempt = new QuizAttempt({
      userId,
      testId,
      answers: updatedAnswers,
      timeSpent,
      score,
      totalQuestions: answers.length
    });

    console.log('Saving attempt for user:', userId);
    const savedAttempt = await attempt.save();
    console.log('Attempt saved:', {
      attemptId: savedAttempt._id,
      userId: savedAttempt.userId,
      score: savedAttempt.score
    });

    res.status(201).json({
      success: true,
      attemptId: savedAttempt._id.toString()
    });
  } catch (error) {
    console.error('Error in quiz attempt creation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save quiz attempt'
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

// Delete all quiz attempts for a test
router.delete('/test/:testId', async (req, res) => {
  console.log(`DELETE /api/quiz-attempts/test/${req.params.testId} by user ${req.user._id}`);
  try {
    const result = await QuizAttempt.deleteMany({
      testId: req.params.testId,
      userId: req.user._id
    });

    console.log(`Deleted ${result.deletedCount} quiz attempts for test ${req.params.testId} by user ${req.user._id}`);

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} quiz attempts`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting quiz attempts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete quiz attempts'
    });
  }
});

module.exports = router;
