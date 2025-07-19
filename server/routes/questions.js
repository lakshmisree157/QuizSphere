const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Question = require('../models/question');
const Test = require('../models/test'); // Import the Test model

const auth = require('../middleware/auth');
router.use(auth); // Add this line at the top
// Configure multer for PDF upload
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const splitPDFContent = (content, maxSize = 500000) => {
  const chunks = [];
  for (let i = 0; i < content.length; i += maxSize) {
    chunks.push(content.slice(i, i + maxSize));
  }
  return chunks;
};

// Add retries for ML service health check
const checkMLService = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(`${process.env.ML_SERVICE_URL}/health`, {
        timeout: 5000,
        headers: { 'Accept': 'application/json' }
      });
      if (response.data?.status === 'ok') {
        return true;
      }
    } catch (error) {
      console.error(`ML service check attempt ${i + 1} failed:`, error.message);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between retries
    }
  }
  return false;
};



// Get all questions for a user (updated to fetch from both Question and Test models)
router.get('/', async (req, res) => {
  try {
    // Fetch questions from Question model
    const questionsFromQuestion = await Question.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch tests for user and extract questions
    const tests = await Test.find({ userId: req.user._id }).lean();

    // Extract questions from tests and add default metadata if missing
    let questionsFromTest = [];
    tests.forEach(test => {
      if (Array.isArray(test.questions)) {
        test.questions.forEach(q => {
          questionsFromTest.push({
            ...q,
            mainTopic: q.mainTopic || 'General',
            subtopic: q.subtopic || 'General',
            userId: req.user._id,
            uniqueId: q.uniqueId || '',
            bloomLevel: q.bloomLevel || 1,
            content: q.content || '',
            options: q.options || [],
            correctAnswer: q.correctAnswer || '',
            type: (q.type || 'MCQ').toUpperCase().trim(),
            createdAt: test.createdAt,
            updatedAt: test.updatedAt
          });
        });
      }
    });

    // Normalize question types from Question model as well
    const normalizedQuestionsFromQuestion = questionsFromQuestion.map(q => ({
      ...q,
      type: (q.type || 'MCQ').toUpperCase().trim()
    }));

    // Combine both question arrays
    const allQuestions = [...normalizedQuestionsFromQuestion, ...questionsFromTest];

    // Sort combined questions by createdAt descending
    allQuestions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(allQuestions);
  } catch (error) {
    console.error('Fetch questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Save questions from ML service
router.post('/', async (req, res) => {
  try {
    if (!req.body.questions) {
      return res.status(400).json({ error: 'No questions provided' });
    }

    const questions = Array.isArray(req.body.questions) 
      ? req.body.questions 
      : Object.values(req.body.questions).flatMap(topic => 
          Object.values(topic).flatMap(subtopic => 
            subtopic.questions?.map(q => ({
              ...q,
              bloomLevel: subtopic.bloom_level
            })) || []
          )
        );

        // Map ML service response to question format
    const formattedQuestions = questions.map(q => {
      // Handle both direct question format and nested format
      const questionData = q.question ? q : q;

      // Normalize type to uppercase and trim whitespace
      let qType = (questionData.type || 'MCQ').toUpperCase().trim();

      return {
        content: questionData.question || questionData.content,
        options: (questionData.options || []).map(opt => 
          typeof opt === 'string' ? opt.replace(/^[A-D]\)\s*/, '') : opt
        ),
        correctAnswer: questionData.answer || questionData.correctAnswer,
        bloomLevel: questionData.bloomLevel || questionData.bloom_level || 1,
        type: qType,
        mainTopic: questionData.mainTopic || 'General',
        subtopic: questionData.subtopic || 'General',
        userId: req.user._id,
        uniqueId: uuidv4()
      };
    });

    const savedQuestions = await Question.insertMany(formattedQuestions);

    // Emit through socket.io if available
    if (req.app.get('io')) {
      req.app.get('io').to(req.user._id.toString()).emit('questions-generated', savedQuestions);
    }

    res.status(201).json({
      message: 'Questions saved successfully',
      questions: savedQuestions
    });
  } catch (error) {
    console.error('Save questions error:', error);
    res.status(500).json({ error: 'Failed to save questions' });
  }
});

// Upload and generate questions from PDF
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // Check ML service health first
    const isMLServiceAvailable = await checkMLService(3);
    if (!isMLServiceAvailable) {
      return res.status(503).json({ error: 'ML service is not available' });
    }

    const testName = req.body.testName || 'Untitled Test';

    const mlResponse = await axios.post(
      `${process.env.ML_SERVICE_URL}/api/questions/generate`,
      { content: req.file.buffer.toString('base64') },
      { headers: { 'Content-Type': 'application/json' }, timeout: 120000 }
    );

    if (!mlResponse.data.questions || !Array.isArray(mlResponse.data.questions)) {
      throw new Error('Invalid response from ML service');
    }
    const formattedQuestions = mlResponse.data.questions.map(q => {
      // Normalize type to uppercase and trim whitespace
      let qType = (q.type || (q.options ? 'MCQ' : q.answer === 'Yes' || q.answer === 'No' ? 'YES_NO' : 'DESCRIPTIVE')).toUpperCase().trim();

      return {
        content: q.content || q.question,
        options: qType === 'MCQ' ? (Array.isArray(q.options) ? q.options : []) :
                qType === 'YES_NO' ? ['Yes', 'No'] : [],
        correctAnswer: q.correctAnswer || q.answer,
        bloomLevel: q.bloomLevel || q.bloom_level || 1,
        type: qType,
        mainTopic: q.mainTopic || q.topic || 'General',
        subtopic: q.subtopic || 'General',
        uniqueId: uuidv4()
      };
    });

    let test = await Test.findOne({ userId: req.user._id, testName });

    if (!test) {
      test = new Test({
        userId: req.user._id,
        testName,
        questions: formattedQuestions
      });
    } else {
      test.questions.push(...formattedQuestions);
    }

    await test.save();

    const io = req.app.get('io');
    if (io) {
      io.to(req.user._id.toString()).emit('questions-generated', test);
    }

    res.status(201).json({
      message: 'Questions generated and saved successfully',
      test
    });
  } catch (error) {
    console.error('Error generating questions:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Failed to generate questions';
    res.status(500).json({ error: errorMessage });
  }
});

module.exports = router;