// Import mongoose to define database schemas
const mongoose = require('mongoose');

// Define the structure of a simulation Job
const JobSchema = new mongoose.Schema({
    jobId: { type: String, required: true, unique: true }, // A unique random string identifying this specific run
    language: { type: String, required: true }, // The programming language used ('python' or 'cpp')
    code: { type: String, required: true }, // The actual code submitted by the user
    // The current status of the job. It starts as 'queued' by default
    status: { type: String, enum: ['queued', 'processing', 'completed', 'failed'], default: 'queued' },
    // A flexible field to store the JSON results (like measurement counts and circuit diagrams)
    result: { type: mongoose.Schema.Types.Mixed }, 
    createdAt: { type: Date, default: Date.now } // Automatically records when the job was created
});

// Export the Job model so other files can create and update simulation jobs
module.exports = mongoose.model('Job', JobSchema);
