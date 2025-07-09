import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import activityRoutes from './routes/activity.js';
import { authenticateSocket } from './middleware/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mhitesh059:mhitesh059@cluster0.0wnawjo.mongodb.net/collaborative-todo?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/activity', activityRoutes);

// Serve React app for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Socket.IO connection handling
const connectedUsers = new Map();

io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected`);
  connectedUsers.set(socket.userId, socket.id);

  // Join user-specific room
  socket.join('board');

  // Handle task updates
  socket.on('task-updated', (data) => {
    socket.to('board').emit('task-updated', data);
  });

  // Handle conflict detection
  socket.on('editing-task', (data) => {
    socket.to('board').emit('user-editing', {
      taskId: data.taskId,
      userId: socket.userId,
      username: data.username
    });
  });

  socket.on('stop-editing-task', (data) => {
    socket.to('board').emit('user-stopped-editing', {
      taskId: data.taskId,
      userId: socket.userId
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
    connectedUsers.delete(socket.userId);
  });
});

// ✅ Fixed for Render: listen on 0.0.0.0 and use PORT from env
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`App available at: http://0.0.0.0:${PORT}`);
  } else {
    console.log(`API server: http://localhost:${PORT}`);
    console.log(`Frontend dev server: http://localhost:5173`);
  }
});

export { io };
