const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',      // Reference to your User model
    required: true,
  },
  cloudinaryUrl: {
    type: String,
    required: true,
  },
  extractedText: {
    type: String,
  },
  parsedData: {
    type: mongoose.Schema.Types.Mixed,  // Flexible for JSON from Gemini API
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const Resume = mongoose.model('Resume', ResumeSchema);

module.exports = Resume;
