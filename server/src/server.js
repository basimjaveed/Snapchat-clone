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

// ── Connect to MongoDB ─────────────────────────────────────
connectDB();

// ── Express app ────────────────────────────────────────────
const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Health check ───────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/snaps', snapRoutes);

// ── Error handling ─────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── HTTP + Socket.IO server ────────────────────────────────
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || '*', credentials: true },
  pingTimeout: 60000,
});

// Shared online user map: userId → socketId
const onlineUsers = new Map();

// Make io + onlineUsers accessible in controllers via req.app
app.set('io', io);
app.set('onlineUsers', onlineUsers);

initSocket(io, onlineUsers);

// ── Start ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = app;
