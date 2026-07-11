const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Untitled Quantum Project'
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    enum: ['python', 'cpp'],
    default: 'python'
  },
  author: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Project', ProjectSchema);
