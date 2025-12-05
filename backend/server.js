const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path'); // ADD THIS IMPORT
require('dotenv').config();

const { initializeSocket } = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const teamRoutes = require('./routes/teams');
const attachmentRoutes = require('./routes/attachments');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/attachments', attachmentRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: '🚀 TaskForge API Server is Running!' });
});

// Error handling for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🎯 Server running on http://localhost:${PORT}`);
});