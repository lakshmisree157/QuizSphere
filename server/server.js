const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const responseFormatter = require('./middleware/responseFormatter');
const authRouter = require('./routes/auth');
const testsRouter = require('./routes/tests');
const questionsRouter = require('./routes/questions');
const quizAttemptsRouter = require('./routes/quizAttempts');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Configure mongoose
mongoose.set('strictQuery', true);

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      family: 4,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Response formatting middleware
app.use(responseFormatter);

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/tests', testsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/quiz-attempts', quizAttemptsRouter);

// 404 Handler
app.use((req, res) => {
  if (!res.headersSent) {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      path: req.path
    });
  }
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (!res.headersSent) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Server error',
      details: process.env.NODE_ENV === 'development' ? {
        stack: err.stack,
        path: req.path
      } : undefined
    });
  }
});

// Attach Socket.IO to the app
app.set('io', io);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Initialize server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer();
