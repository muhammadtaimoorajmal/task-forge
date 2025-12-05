const socketIO = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // Join project room for real-time updates
    socket.on('join_project', (projectId) => {
      socket.join(`project_${projectId}`);
      console.log(`User ${socket.id} joined project ${projectId}`);
    });

    // Join task room for comments
    socket.on('join_task', (taskId) => {
      socket.join(`task_${taskId}`);
      console.log(`User ${socket.id} joined task ${taskId}`);
    });

    // Handle task updates
    socket.on('task_updated', (data) => {
      socket.to(`project_${data.projectId}`).emit('task_updated', data);
      console.log('Task updated:', data.taskId);
    });

    // Handle new comments
    socket.on('new_comment', (data) => {
      socket.to(`task_${data.taskId}`).emit('new_comment', data);
      console.log('New comment on task:', data.taskId);
    });

    // Handle task creation
    socket.on('task_created', (data) => {
      socket.to(`project_${data.projectId}`).emit('task_created', data);
      console.log('Task created:', data.task.title);
    });

    socket.on('disconnect', () => {
      console.log('🔌 User disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initializeSocket, getIO };