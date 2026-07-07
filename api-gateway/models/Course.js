// Import mongoose to define database schemas
const mongoose = require('mongoose');

// Define the structure of a single Module within a course
const ModuleSchema = new mongoose.Schema({
  id: { type: String, required: true }, // Unique identifier for the module (e.g., 'quantum-gates')
  title: { type: String, required: true }, // Display title for the module
  description: { type: String }, // A short summary of what the module covers
  prerequisites: [{ type: String }], // Array of module IDs that should be completed before this one
  estHours: { type: Number }, // Estimated time to complete the module in hours
  content: { type: String }, // The full markdown content of the tutorial
  starterCode: { type: String } // The initial code loaded in the lab editor
});

// Define the structure of a complete Course
const CourseSchema = new mongoose.Schema({
  courseId: { type: String, required: true }, // Unique identifier for the course
  title: { type: String, required: true }, // Display title for the course
  modules: [ModuleSchema] // An array containing all the modules that belong to this course
});

// Export the Course model so other files can query the database using it
module.exports = mongoose.model('Course', CourseSchema);
