// ============================================================================
// QuantumEdge API Gateway — index.js
// Central backend server handling:
//   - Course curriculum API
//   - Code simulation job queue (via RabbitMQ)
//   - AI-powered code review (via Gemini)
//   - User progress tracking
//   - Rate limiting (Redis-backed)
//   - Paginated endpoints
// ============================================================================

const express = require('express');
const cors = require('cors');
const amqp = require('amqplib');
const mongoose = require('mongoose');
const { createClient } = require('redis');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Models
const Course = require('./models/Course');
const User = require('./models/User');
const Job = require('./models/Job');

// Middleware
const { createRateLimiter } = require('./middleware/rateLimiter');
const { parsePagination, buildPaginationMeta } = require('./middleware/paginate');

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const PORT = process.env.PORT || 4000;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://root:examplepassword@localhost:27017/quantumedge?authSource=admin';
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

// AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'fake-key');

// Global connections
let channel = null;
let redisClient = null;

// ============================================================================
// REDIS CONNECTION
// ============================================================================
async function connectRedis() {
  try {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => console.error('Redis error:', err.message));
    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (error) {
    console.error('Redis connection failed:', error.message);
    // Fail open — rate limiting will be skipped if Redis is unavailable
  }
}

// ============================================================================
// RABBITMQ CONNECTION
// ============================================================================
async function connectQueue() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue('quantum_jobs', { durable: false });
    await channel.assertQueue('cpp_jobs', { durable: false });
    await channel.assertQueue('job_results', { durable: false });

    // Listen for results from workers
    channel.consume('job_results', async (msg) => {
      if (msg !== null) {
        try {
          const data = JSON.parse(msg.content.toString());
          const { jobId, result } = data;
          const status = result.error ? 'failed' : 'completed';
          await Job.findOneAndUpdate({ jobId }, { status, result });
          channel.ack(msg);
        } catch (err) {
          console.error("Error processing job_results:", err);
          channel.nack(msg);
        }
      }
    });

    console.log('Connected to RabbitMQ and listening to job_results');
  } catch (error) {
    console.error('RabbitMQ connection error, retrying in 5s...', error.message);
    setTimeout(connectQueue, 5000);
  }
}

// ============================================================================
// MONGODB CONNECTION
// ============================================================================
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error', error);
  }
}

// ============================================================================
// RATE LIMITERS (applied per-route with different thresholds)
// ============================================================================

// Lazy-init rate limiters after Redis connects
function getRateLimiters() {
  return {
    // Heavy endpoints — strict limits
    simulate: createRateLimiter(redisClient, {
      windowMs: 60 * 1000,
      max: 10,
      keyPrefix: 'rl:simulate',
      message: 'Simulation rate limit exceeded. Max 10 requests per minute.',
    }),
    review: createRateLimiter(redisClient, {
      windowMs: 60 * 1000,
      max: 5,
      keyPrefix: 'rl:review',
      message: 'AI review rate limit exceeded. Max 5 requests per minute.',
    }),
    // Read endpoints — generous limits
    curriculum: createRateLimiter(redisClient, {
      windowMs: 60 * 1000,
      max: 60,
      keyPrefix: 'rl:curriculum',
    }),
    jobPoll: createRateLimiter(redisClient, {
      windowMs: 60 * 1000,
      max: 120,
      keyPrefix: 'rl:jobpoll',
    }),
    progress: createRateLimiter(redisClient, {
      windowMs: 60 * 1000,
      max: 30,
      keyPrefix: 'rl:progress',
    }),
    jobsList: createRateLimiter(redisClient, {
      windowMs: 60 * 1000,
      max: 30,
      keyPrefix: 'rl:jobslist',
    }),
  };
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * GET /api/curriculum
 * Returns course curriculum. Supports optional pagination.
 *   ?page=1&limit=5  → paginated modules
 *   (no params)      → all modules (backward-compatible)
 */
app.get('/api/curriculum', async (req, res) => {
  try {
    // Apply rate limiting
    const rl = getRateLimiters();
    await new Promise((resolve) => rl.curriculum(req, res, resolve));
    if (res.headersSent) return; // 429 was already sent

    const course = await Course.findOne({ courseId: 'quantum-dev-101' });
    if (!course) return res.json({ modules: [] });

    // If pagination params are provided, paginate the modules array
    if (req.query.page || req.query.limit) {
      const { page, limit, skip } = parsePagination(req.query);
      const allModules = course.modules || [];
      const paginatedModules = allModules.slice(skip, skip + limit);
      return res.json({
        modules: paginatedModules,
        pagination: buildPaginationMeta(page, limit, allModules.length),
      });
    }

    // Default: return everything (backward-compatible)
    res.json(course);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/progress/:username
 * Returns progress data for a specific user.
 */
app.get('/api/progress/:username', async (req, res) => {
  try {
    const rl = getRateLimiters();
    await new Promise((resolve) => rl.progress(req, res, resolve));
    if (res.headersSent) return;

    const user = await User.findOne({ username: req.params.username });
    res.json(user ? user.progress : []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/review
 * Sends user code to Gemini AI for code review.
 * Rate limited: 5 requests/minute per IP.
 */
app.post('/api/review', async (req, res) => {
  try {
    const rl = getRateLimiters();
    await new Promise((resolve) => rl.review(req, res, resolve));
    if (res.headersSent) return;

    const { code } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ feedback: "AI Reviewer is disabled (no API key provided)." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are a Quantum Computing AI Code Reviewer. 
    Analyze the following Qiskit/Python code. 
    Provide automated feedback on circuit gate optimization and potential qubit decoherence issues.
    Keep the feedback concise, actionable, and less than 150 words. 
    Code: \n\n${code}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ feedback: text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/simulate
 * Creates a simulation job and puts it in the RabbitMQ queue.
 * Rate limited: 10 requests/minute per IP.
 */
app.post('/api/simulate', async (req, res) => {
  try {
    const rl = getRateLimiters();
    await new Promise((resolve) => rl.simulate(req, res, resolve));
    if (res.headersSent) return;

    const { code, language } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    const jobId = Math.random().toString(36).substring(7);
    const job = { jobId, code, language: language || 'python' };
    const queueName = job.language === 'cpp' ? 'cpp_jobs' : 'quantum_jobs';

    if (channel) {
      await Job.create({ jobId, language: job.language, code });
      channel.sendToQueue(queueName, Buffer.from(JSON.stringify(job)));
      return res.json({ jobId, status: 'queued', queue: queueName });
    } else {
      return res.status(503).json({ error: 'Queue not ready' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to create job' });
  }
});

/**
 * GET /api/job/:jobId
 * Check the status of a single simulation job.
 * Rate limited: 120 requests/minute per IP (used for polling).
 */
app.get('/api/job/:jobId', async (req, res) => {
  try {
    const rl = getRateLimiters();
    await new Promise((resolve) => rl.jobPoll(req, res, resolve));
    if (res.headersSent) return;

    const job = await Job.findOne({ jobId: req.params.jobId });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/jobs
 * Paginated list of all simulation jobs.
 *   ?page=1&limit=10           → page 1, 10 per page
 *   ?status=completed          → filter by status
 *   ?language=python           → filter by language
 *   ?sort=createdAt&order=desc → sort (default: newest first)
 */
app.get('/api/jobs', async (req, res) => {
  try {
    const rl = getRateLimiters();
    await new Promise((resolve) => rl.jobsList(req, res, resolve));
    if (res.headersSent) return;

    const { page, limit, skip } = parsePagination(req.query);

    // Build filter
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.language) filter.language = req.query.language;

    // Sort
    const sortField = req.query.sort || 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    // Query with pagination
    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .select('jobId language status createdAt -_id'),  // exclude code for list view
      Job.countDocuments(filter),
    ]);

    res.json({
      jobs,
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /health
 * Health check endpoint showing status of all connections.
 */
app.get('/health', (req, res) => res.json({
  status: 'ok',
  services: {
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    rabbitmq: channel ? 'connected' : 'disconnected',
    redis: redisClient?.isOpen ? 'connected' : 'disconnected',
  },
}));

// ============================================================================
// SERVER STARTUP
// ============================================================================
app.listen(PORT, async () => {
  console.log(`API Gateway running on port ${PORT}`);
  await connectDB();
  await connectRedis();
  await connectQueue();
});
