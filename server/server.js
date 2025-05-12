require('dotenv').config();
require('./config/mongoose');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const routes = require('./routes');
const errorHandler = require('./middleware/error');
const auth = require('./middleware/auth');
const jwt = require('jsonwebtoken');  // Add this at the top

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
    transports: ['websocket', 'polling']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Store io instance in app
app.set('io', io);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) throw new Error('Authentication error');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/questions', auth, require('./routes/questions'));

// Error handling
app.use(errorHandler);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.user.id);
  
  // Join user to their personal room
  socket.join(socket.user.id);
  
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
