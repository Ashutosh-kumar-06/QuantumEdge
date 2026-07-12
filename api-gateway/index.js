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
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const amqp = require('amqplib');
const mongoose = require('mongoose');
const { createClient } = require('redis');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Models
const Course = require('./models/Course');
const User = require('./models/User');
const Job = require('./models/Job');
const Project = require('./models/Project');

// Middleware
const { requireAuth } = require('./middleware/auth');
const rateLimit = require('express-rate-limit');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Resend } = require('resend');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder',
});

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');
const { parsePagination, buildPaginationMeta } = require('./middleware/paginate');

// Initialize Express & Socket.io
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  }
});
app.use(cors());
app.use(express.json());

// Meeting Rooms State
const meetingRooms = {};

// Socket.io connections for Multiplayer, Chat, and WebRTC
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Track user's active meeting room to clean up on disconnect
  let activeMeetingRoom = null;
  let activeUsername = null;

  socket.on('subscribe_job', (jobId) => {
    socket.join(jobId);
  });

  // Multiplayer Rooms
  socket.on('join_room', ({ roomId, username }) => {
    socket.join(roomId);
    socket.to(roomId).emit('user_joined', { username, socketId: socket.id });
    console.log(`${username} joined room ${roomId}`);
  });

  socket.on('leave_room', ({ roomId, username }) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user_left', { username, socketId: socket.id });
  });

  // Chat
  socket.on('chat_message', ({ roomId, username, message }) => {
    io.to(roomId).emit('chat_message', { username, message, timestamp: new Date() });
  });

  // Circuit Sync
  socket.on('circuit_update', ({ roomId, username, moments }) => {
    socket.to(roomId).emit('circuit_update', { username, moments });
  });

  // Shared Code Editor Sync
  socket.on('code_update', ({ roomId, code }) => {
    socket.to(roomId).emit('code_update', { code });
  });

  // Shared Cursor Sync
  socket.on('cursor_move', ({ roomId, username, line, col }) => {
    socket.to(roomId).emit('cursor_move', { username, line, col });
  });

  // Shared Terminal Sync
  socket.on('terminal_output', ({ roomId, output }) => {
    socket.to(roomId).emit('terminal_output', { output });
  });

  // Dedicated Meeting Rooms (Chat & Video) Role-Based Access Control
  socket.on('join_meeting', ({ roomId, username }) => {
    socket.join(roomId);
    activeMeetingRoom = roomId;
    activeUsername = username;

    if (!meetingRooms[roomId]) {
      // First person to join is the owner
      meetingRooms[roomId] = {
        owner: username,
        participants: {}
      };
    } else {
      // Add as participant with default false permissions
      if (meetingRooms[roomId].owner !== username) {
        meetingRooms[roomId].participants[username] = {
          canEdit: false,
          canMic: false,
          canCam: false
        };
      }
    }

    io.to(roomId).emit('room_state', meetingRooms[roomId]);
  });

  socket.on('update_permissions', ({ roomId, targetUsername, permissions }) => {
    const room = meetingRooms[roomId];
    if (room && room.participants[targetUsername]) {
      room.participants[targetUsername] = { ...room.participants[targetUsername], ...permissions };
      io.to(roomId).emit('room_state', room);
    }
  });

  // WebRTC Mesh Signaling
  socket.on('join_video_room', ({ roomId, username }) => {
    socket.to(roomId).emit('user_joined_video', { username, socketId: socket.id });
  });

  socket.on('leave_video_room', ({ roomId, username }) => {
    socket.to(roomId).emit('user_left_video', { username, socketId: socket.id });
  });

  socket.on('video_offer', ({ roomId, offer, senderId, targetId }) => {
    io.to(targetId).emit('video_offer', { offer, senderId, socketId: socket.id });
  });

  socket.on('video_answer', ({ roomId, answer, senderId, targetId }) => {
    io.to(targetId).emit('video_answer', { answer, senderId, socketId: socket.id });
  });

  socket.on('new_ice_candidate', ({ roomId, candidate, senderId, targetId }) => {
    io.to(targetId).emit('new_ice_candidate', { candidate, senderId, socketId: socket.id });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (activeMeetingRoom && activeUsername) {
      const room = meetingRooms[activeMeetingRoom];
      if (room) {
        if (room.owner === activeUsername) {
          // If owner leaves, maybe assign a new owner or delete room?
          // For simplicity, we just delete the room state if owner leaves.
          delete meetingRooms[activeMeetingRoom];
          io.to(activeMeetingRoom).emit('room_ended');
        } else {
          delete room.participants[activeUsername];
          io.to(activeMeetingRoom).emit('room_state', room);
        }
      }
    }
  });
});

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
          
          // Emit result to connected websocket clients for this job
          io.to(jobId).emit('job_result', { status, result });
          
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

// ============================================================================
// RATE LIMITERS (using express-rate-limit)
// ============================================================================

const simulateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Simulation rate limit exceeded. Max 10 requests per minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const reviewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'AI review rate limit exceeded. Max 5 requests per minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const defaultLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * POST /api/projects
 * Save a new cloud project
 */
app.post('/api/projects', requireAuth, async (req, res) => {
  try {
    const { title, code, language, author } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });
    
    const project = new Project({ title, code, language, author });
    await project.save();
    
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/projects/:id
 * Retrieve a saved project by ID
 */
app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/curriculum
 * Returns course curriculum. Supports optional pagination.
 *   ?page=1&limit=5  → paginated modules
 *   (no params)      → all modules (backward-compatible)
 */
app.get('/api/curriculum', async (req, res) => {
  try {
    // Apply rate limiting
    defaultLimiter(req, res, () => {});

    const cacheKey = `curriculum:${req.query.page || 'all'}:${req.query.limit || 'all'}`;
    
    // 1. Check Redis Cache
    if (redisClient && redisClient.isOpen) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
    }

    // 2. Fetch from DB on cache miss
    const course = await Course.findOne({ courseId: 'quantum-dev-101' });
    if (!course) return res.json({ modules: [] });

    let responseData;
    // If pagination params are provided, paginate the modules array
    if (req.query.page || req.query.limit) {
      const { page, limit, skip } = parsePagination(req.query);
      const allModules = course.modules || [];
      const paginatedModules = allModules.slice(skip, skip + limit);
      responseData = {
        modules: paginatedModules,
        pagination: buildPaginationMeta(page, limit, allModules.length),
      };
    } else {
      // Default: return everything (backward-compatible)
      responseData = course;
    }

    // 3. Save to Redis Cache (expire in 3600 seconds = 1 hour)
    if (redisClient && redisClient.isOpen) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData));
    }

    res.json(responseData);
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
    defaultLimiter(req, res, () => {});

    const user = await User.findOne({ username: req.params.username });
    res.json(user ? user.progress : []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/progress/:username
 * Updates progress and awards XP for completing a module.
 */
app.post('/api/progress/:username', async (req, res) => {
  try {
    defaultLimiter(req, res, () => {});

    const { moduleId, completed } = req.body;
    let user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      user = new User({ username: req.params.username, xp: 0 });
    }

    const existingProgress = user.progress.find(p => p.moduleId === moduleId);
    if (existingProgress) {
      if (!existingProgress.completed && completed) {
        user.xp += 100; // Award 100 XP for completing a module
        existingProgress.completed = true;
      }
    } else {
      user.progress.push({ moduleId, completed });
      if (completed) user.xp += 100;
    }

    await user.save();
    res.json({ success: true, xp: user.xp });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/leaderboard
 * Returns the top 10 users ranked by XP.
 */
app.get('/api/leaderboard', async (req, res) => {
  try {
    defaultLimiter(req, res, () => {});

    const cacheKey = 'leaderboard:top10';
    
    // 1. Check Redis Cache
    if (redisClient && redisClient.isOpen) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
    }

    const topUsers = await User.find().sort({ xp: -1 }).limit(10).select('username xp avatar -_id');
    
    // 2. Save to Redis Cache (expire in 300 seconds = 5 minutes)
    if (redisClient && redisClient.isOpen) {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(topUsers));
    }

    res.json(topUsers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/user/:username/status
 * Fetches user subscription status
 */
app.get('/api/user/:username/status', async (req, res) => {
  try {
    let user = await User.findOne({ username: req.params.username });
    if (!user) {
      user = new User({ username: req.params.username, xp: 0 });
    }
    
    // Automatically grant 30-day trial if they have never had proUntil set
    if (!user.proUntil) {
       user.proUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days free trial
       await user.save();
    }
    
    const isPro = user.proUntil > new Date();
    res.json({ isPro });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const { getQuantumCodeReview } = require('./services/aiService');

/**
 * POST /api/review
 * Sends user code to an AI model for code review.
 * Rate limited: 5 requests/minute per IP.
 */
app.post('/api/review', requireAuth, reviewLimiter, async (req, res) => {
  try {
    const { code, expectedOutput, actualErrorOrOutput } = req.body;
    
    // Check if any API key is configured (handled in the service, but we catch gracefully here too)
    if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
      return res.json({ feedback: "AI Reviewer is disabled (no API key provided)." });
    }

    // This calls our flexible aiService.js wrapper
    const feedback = await getQuantumCodeReview(code, expectedOutput, actualErrorOrOutput);

    res.json({ feedback });
  } catch (e) {
    console.error('AI Review Route Error:', e);
    res.status(500).json({ error: e.message || 'AI request failed' });
  }
});

const { getQuantumChatResponse } = require('./services/aiService');

/**
 * POST /api/chat
 * Sends follow-up questions to the AI Tutor.
 */
app.post('/api/chat', requireAuth, reviewLimiter, async (req, res) => {
  try {
    const { history, newPrompt, codeContext } = req.body;
    
    if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
      return res.json({ feedback: "AI Tutor is disabled (no API key provided)." });
    }

    const feedback = await getQuantumChatResponse(history || [], newPrompt, codeContext);
    res.json({ feedback });
  } catch (e) {
    console.error('AI Chat Route Error:', e);
    res.status(500).json({ error: e.message || 'AI chat failed' });
  }
});

/**
 * POST /api/simulate
 * Creates a simulation job and puts it in the RabbitMQ queue.
 * Rate limited: 10 requests/minute per IP.
 */
app.post('/api/simulate', simulateLimiter, async (req, res) => {
  try {
    const { code, language, noiseModel } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    const jobId = Math.random().toString(36).substring(7);
    const job = { jobId, code, language: language || 'python', noiseModel: noiseModel || 'ideal' };
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
    defaultLimiter(req, res, () => {});

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
    defaultLimiter(req, res, () => {});

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

// ============================================================================
// MONETIZATION & EMAIL ENDPOINTS
// ============================================================================

/**
 * POST /api/payment/orders
 * Generates a Razorpay order ID for the Pro subscription
 */
app.post('/api/payment/orders', requireAuth, async (req, res) => {
  try {
    const options = {
      amount: 1 * 100, // ₹1 in paise (1 month extension)
      currency: "INR",
      receipt: `rcpt_${req.user.uid}`
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Razorpay Error:', error);
    res.status(500).json({ error: 'Could not create order' });
  }
});

/**
 * POST /api/payment/verify
 * Verifies Razorpay payment signature and upgrades user to Pro
 */
app.post('/api/payment/verify', requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder')
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Payment is legit! Extend user's Pro status by 30 days
      const { username } = req.body; // passed from frontend
      if (username) {
         const user = await User.findOne({ username });
         if (user) {
            const baseDate = (user.proUntil && user.proUntil > new Date()) ? user.proUntil.getTime() : Date.now();
            user.proUntil = new Date(baseDate + 30 * 24 * 60 * 60 * 1000); // Add 30 days
            await user.save();
         }
      }
      res.json({ success: true, message: 'Payment verified, extended Pro for 30 days!' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Razorpay Verify Error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * POST /api/email/welcome
 * Sends a welcome email via Resend
 */
app.post('/api/email/welcome', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    // Skip sending if API key is not configured (to avoid crashing in dev)
    if (!process.env.RESEND_API_KEY) {
      return res.json({ success: true, note: 'Mocked email send - missing Resend API key' });
    }

    const { data, error } = await resend.emails.send({
      from: 'QuantumEdge <onboarding@resend.dev>', // Update to verified domain in prod
      to: [email],
      subject: 'Welcome to QuantumEdge! 🚀',
      html: `<h2>Welcome to the Quantum Future, ${name || 'Explorer'}!</h2>
             <p>We're thrilled to have you join QuantumEdge. Jump into the Lab and start building your first quantum circuit today.</p>
             <br/>
             <p>Happy Coding,<br/>The QuantumEdge Team</p>`,
    });

    if (error) {
      return res.status(400).json({ error });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
if (require.main === module) {
  httpServer.listen(PORT, async () => {
    console.log(`API Gateway & WebSocket server running on port ${PORT}`);
    await connectDB();
    await connectRedis();
    await connectQueue();
  });
}

module.exports = { app, httpServer };
