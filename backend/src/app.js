require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const jobRoutes = require('./routes/job.routes');
const agentRoutes = require('./routes/agent.routes');

// Connect DB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Make io accessible to routes if needed
app.set('io', io);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/agents', agentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Karmaphala API is running 🚀' });
});

// Socket.io events
io.on('connection', (socket) => {
  console.log(`⚡ Socket connected: ${socket.id}`);

  // Agent joins their own room
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  // Agent sends location update
  socket.on('agent:location', ({ agentId, coordinates }) => {
    // Broadcast to all customers tracking this agent
    socket.broadcast.emit(`track:${agentId}`, { coordinates });
  });

  // New job posted — broadcast to all agents
  socket.on('job:new', (job) => {
    io.emit('job:feed', job);
  });

  // Job status update
  socket.on('job:statusUpdate', ({ jobId, status }) => {
    io.emit(`job:update:${jobId}`, { status });
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Karmaphala server running on http://localhost:${PORT}`);
});
