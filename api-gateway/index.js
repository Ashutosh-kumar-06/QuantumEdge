// Import Express framework to create the web server
const express = require('express');
// Import CORS middleware to allow the frontend to communicate with this API
const cors = require('cors');
// Import AMQP library to communicate with RabbitMQ message broker
const amqp = require('amqplib');
// Import Mongoose to interact with the MongoDB database
const mongoose = require('mongoose');
// Import the Google Generative AI SDK for AI code review functionality
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import the database schemas (models)
const Course = require('./models/Course'); // Curriculum structure
const User = require('./models/User'); // User progress tracking
const Job = require('./models/Job'); // Simulation job queue tracking

// Initialize the Express application
const app = express();
// Enable CORS for all routes
app.use(cors());
// Middleware to parse incoming JSON requests
app.use(express.json());

// Set up configuration variables from environment or use default values
const PORT = process.env.PORT || 4000;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://root:examplepassword@localhost:27017/quantumedge?authSource=admin';

// Initialize the Gemini AI client with an API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'fake-key');

// Global variable to hold the RabbitMQ channel
let channel = null;

/**
 * Connects to the RabbitMQ message queue and sets up listeners
 */
async function connectQueue() {
    try {
        // Create a connection to RabbitMQ
        const connection = await amqp.connect(RABBITMQ_URL);
        // Create a communication channel
        channel = await connection.createChannel();
        // Ensure the queues exist. 'durable: false' means queues are lost on restart
        await channel.assertQueue('quantum_jobs', { durable: false }); // Python Qiskit jobs
        await channel.assertQueue('cpp_jobs', { durable: false }); // C++ QuEST jobs
        await channel.assertQueue('job_results', { durable: false }); // Results back from workers
        
        // Listen for messages arriving on the 'job_results' queue
        channel.consume('job_results', async (msg) => {
            if (msg !== null) {
                try {
                    // Parse the JSON message sent by the worker
                    const data = JSON.parse(msg.content.toString());
                    const { jobId, result } = data;
                    
                    // Determine status based on whether the result contains an error
                    const status = result.error ? 'failed' : 'completed';
                    // Update the job record in MongoDB with the final status and result
                    await Job.findOneAndUpdate(
                        { jobId },
                        { status, result }
                    );
                    // Acknowledge the message so RabbitMQ removes it from the queue
                    channel.ack(msg);
                } catch (err) {
                    console.error("Error processing job_results:", err);
                    // Negatively acknowledge the message if something went wrong
                    channel.nack(msg);
                }
            }
        });
        
        console.log('Connected to RabbitMQ and listening to job_results');
    } catch (error) {
        // If connection fails, wait 5 seconds and try again
        console.error('RabbitMQ connection error, retrying in 5s...', error);
        setTimeout(connectQueue, 5000);
    }
}

/**
 * Connects to the MongoDB database
 */
async function connectDB() {
    try {
        // Connect to MongoDB using the connection URI
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error', error);
    }
}

// ---------------------------------------------------------
// API ENDPOINTS
// ---------------------------------------------------------

/**
 * GET /api/curriculum
 * Returns the full course curriculum from the database.
 */
app.get('/api/curriculum', async (req, res) => {
    try {
        // Find the specific course by its ID
        const course = await Course.findOne({ courseId: 'quantum-dev-101' });
        // Return the course as JSON, or an empty array if not found
        res.json(course || { modules: [] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * GET /api/progress/:username
 * Returns the progress data for a specific user.
 */
app.get('/api/progress/:username', async (req, res) => {
    try {
        // Find the user by their username
        const user = await User.findOne({ username: req.params.username });
        // Return the user's progress array, or an empty array if not found
        res.json(user ? user.progress : []);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * POST /api/review
 * Sends user code to the AI (Gemini) for a code review.
 */
app.post('/api/review', async (req, res) => {
    const { code } = req.body;
    try {
        // If no API key is provided, return a placeholder message
        if (!process.env.GEMINI_API_KEY) {
            return res.json({ feedback: "AI Reviewer is disabled (no API key provided)." });
        }
        
        // Select the specific Gemini model to use
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // Construct the prompt giving the AI instructions and the user's code
        const prompt = `You are a Quantum Computing AI Code Reviewer. 
        Analyze the following Qiskit/Python code. 
        Provide automated feedback on circuit gate optimization and potential qubit decoherence issues.
        Keep the feedback concise, actionable, and less than 150 words. 
        Code: \n\n${code}`;
        
        // Generate content by calling the Gemini API
        const result = await model.generateContent(prompt);
        const response = await result.response;
        // Extract the text from the AI's response
        const text = response.text();
        
        // Return the feedback to the frontend
        res.json({ feedback: text });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * POST /api/simulate
 * Receives code from the user, creates a job, and puts it in the queue for a worker.
 */
app.post('/api/simulate', async (req, res) => {
    // Extract code and language from the request body
    const { code, language } = req.body;
    if (!code) {
        return res.status(400).json({ error: 'No code provided' });
    }
    
    // Generate a random job ID (e.g., 'a1b2c3d')
    const jobId = Math.random().toString(36).substring(7);
    // Create a job object
    const job = { jobId, code, language: language || 'python' };
    // Determine which queue to use based on the programming language
    const queueName = job.language === 'cpp' ? 'cpp_jobs' : 'quantum_jobs';
    
    if (channel) {
        try {
            // Save the new job to the database with a 'queued' status
            await Job.create({ jobId, language: job.language, code });
            // Send the job to the appropriate RabbitMQ queue as a JSON string
            channel.sendToQueue(queueName, Buffer.from(JSON.stringify(job)));
            // Respond to the frontend immediately letting them know the job is queued
            return res.json({ jobId, status: 'queued', queue: queueName });
        } catch (e) {
            return res.status(500).json({ error: 'Failed to create job' });
        }
    } else {
        // If RabbitMQ is not connected yet, return an error
        return res.status(503).json({ error: 'Queue not ready' });
    }
});

/**
 * GET /api/job/:jobId
 * Allows the frontend to check the status and result of a simulation job.
 */
app.get('/api/job/:jobId', async (req, res) => {
    try {
        // Find the job by its unique ID
        const job = await Job.findOne({ jobId: req.params.jobId });
        if (!job) return res.status(404).json({ error: 'Job not found' });
        // Return the job details (including status and results if completed)
        res.json(job);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * GET /health
 * A simple endpoint to check if the server is running.
 */
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ---------------------------------------------------------
// SERVER STARTUP
// ---------------------------------------------------------

// Start listening for incoming HTTP requests on the specified port
app.listen(PORT, async () => {
    console.log(`API Gateway running on port ${PORT}`);
    // Connect to MongoDB
    await connectDB();
    // Connect to RabbitMQ
    await connectQueue();
});
