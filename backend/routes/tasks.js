const express = require('express');
const { 
  createTask, 
  getTasksByProject, 
  updateTaskStatus,
  updateTask,
  addTaskComment,
  getTaskComments,
  assignTask,
  getTaskById
} = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Task routes
router.post('/', authenticateToken, createTask);
router.get('/project/:projectId', authenticateToken, getTasksByProject);
router.get('/:id', authenticateToken, getTaskById);
router.patch('/:id/status', authenticateToken, updateTaskStatus);
router.put('/:id', authenticateToken, updateTask);
router.patch('/:id/assign', authenticateToken, assignTask);

// Comment routes
router.post('/:taskId/comments', authenticateToken, addTaskComment);
router.get('/:taskId/comments', authenticateToken, getTaskComments);

module.exports = router;