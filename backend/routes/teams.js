const express = require('express');
const { 
  createTeam, 
  getTeams, 
  getTeamMembers,
  inviteToTeam,
  removeFromTeam,
  updateMemberRole
} = require('../controllers/teamController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, createTeam);
router.get('/', authenticateToken, getTeams);
router.get('/:teamId/members', authenticateToken, getTeamMembers);
router.post('/:teamId/invite', authenticateToken, inviteToTeam);
router.delete('/:teamId/members/:userId', authenticateToken, removeFromTeam);
router.patch('/:teamId/members/:userId/role', authenticateToken, updateMemberRole);

module.exports = router;