const mongoose = require('mongoose');

// Define a schema for questions
const questionSchema = new mongoose.Schema({
  uniqueId: {
    type: String,
    required: true // Removed any implicit indexing
  },
  content: String,
  options: [String],
  correctAnswer: String,
  bloomLevel: Number
}, { _id: false }); // Prevent Mongoose from creating an automatic _id for each question

// Define the test schema
const testSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testName: {
    type: String,
    required: true
  },
  questions: [questionSchema], // Use the question schema here
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add a compound index only on userId and testName (if needed)
testSchema.index({ userId: 1, testName: 1 });

module.exports = mongoose.model('Test', testSchema);