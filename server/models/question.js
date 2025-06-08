const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
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
  mainTopic: {
    type: String,
    required: true
  },
  subtopic: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['MCQ', 'YES_NO', 'DESCRIPTIVE', 'FILL_IN_BLANK', 'TRUE_FALSE', 'SHORT_ANSWER'],
    required: true,
    default: 'MCQ'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uniqueId: {
    type: String,
    required: true,
    unique: true
  }
}, { 
  timestamps: true 
});

// Add indexes for better query performance
questionSchema.index({ userId: 1, createdAt: -1 });
questionSchema.index({ uniqueId: 1 }, { unique: true });
questionSchema.index({ userId: 1, mainTopic: 1 });
questionSchema.index({ mainTopic: 1, subtopic: 1 });

module.exports = mongoose.model('Question', questionSchema);