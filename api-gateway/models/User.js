// Import mongoose to define database schemas
const mongoose = require('mongoose');

// Define the structure of a User and their progress
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true }, // The user's unique login name
  xp: { type: Number, default: 0, index: -1 }, // Experience points, indexed descending for leaderboard
  avatar: { type: String, default: '🚀' }, // Simple emoji avatar
  // An array tracking which modules the user has started or completed
  progress: [{
    moduleId: { type: String }, // The ID of the module (e.g., 'quantum-gates')
    completed: { type: Boolean, default: false }, // Whether the user has finished the module
    score: { type: Number, default: 0 } // The user's score on any exercises in the module
  }],
  isPro: { type: Boolean, default: false } // Pro subscription status
});

// Export the User model so other files can fetch and update student progress
module.exports = mongoose.model('User', UserSchema);
