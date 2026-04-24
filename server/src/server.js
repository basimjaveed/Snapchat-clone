require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const initSocket = require('./config/socket');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const friendRoutes = require('./routes/friendRoutes');
const chatRoutes = require('./routes/chatRoutes');
const snapRoutes = require('./routes/snapRoutes');
const contactRoutes = require('./routes/contactRoutes');

// ── Connect to MongoDB ─────────────────────────────────────
connectDB();

// ── Express app ────────────────────────────────────────────
const app = express();

app.use(helmet());
app.use(cors({ 
  origin: true, // Allow all origins and reflect them
  credentials: true 
}));
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Health check ───────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.get('/test-db', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const state = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    res.json({ status: 'ok', dbState: states[state] });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/snaps', snapRoutes);
app.use('/api/contacts', contactRoutes);

// ── Error handling ─────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── HTTP + Socket.IO server ────────────────────────────────
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || '*', credentials: true },
  pingTimeout: 120000,
  pingInterval: 25000,
});

// Shared online user map: userId → socketId
const onlineUsers = new Map();

// Make io + onlineUsers accessible in controllers via req.app
app.set('io', io);
app.set('onlineUsers', onlineUsers);

initSocket(io, onlineUsers);

// ── Start ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = app;
