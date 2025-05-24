const mongoose = require('mongoose');

// Define a schema for questions
const questionSchema = new mongoose.Schema({
  uniqueId: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: function() {
      return this.type === 'MCQ' || this.type === 'YES_NO';
    }
  }],
  correctAnswer: {
    type: String,
    required: true
  },
  bloomLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  type: {
    type: String,
    enum: ['MCQ', 'YES_NO', 'DESCRIPTIVE'],
    required: true,
    default: 'MCQ'
  }
}, { _id: false });

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
  questions: [questionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes
testSchema.index({ userId: 1, testName: 1 });
testSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Test', testSchema);