const express = require('express');
const { createProject, getProjects, getProjectById } = require('../controllers/projectController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, createProject);
router.get('/', authenticateToken, getProjects);
router.get('/:id', authenticateToken, getProjectById);

module.exports = router;