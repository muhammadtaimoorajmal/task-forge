const express = require('express');
const { 
  register, 
  login, 
  getProfile,
  searchUsers
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
router.get('/search', authenticateToken, searchUsers);

module.exports = router;