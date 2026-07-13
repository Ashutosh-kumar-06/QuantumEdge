const mongoose = require('mongoose');

const ChallengeScoreSchema = new mongoose.Schema({
  username: { type: String, required: true },
  challengeId: { type: String, required: true, index: true },
  score: { type: Number, required: true, index: -1 }, // higher is better
  metrics: {
    runtimeMs: { type: Number, default: 0 },
    gateCount: { type: Number, default: 0 },
    depth: { type: Number, default: 0 },
    fidelity: { type: Number, default: 0 }
  },
  code: { type: String }, // User's submitted code
  timestamp: { type: Date, default: Date.now }
});

// Ensure a user only has one top score per challenge
ChallengeScoreSchema.index({ username: 1, challengeId: 1 }, { unique: true });

module.exports = mongoose.model('ChallengeScore', ChallengeScoreSchema);
