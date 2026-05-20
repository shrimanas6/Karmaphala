const express = require('express');
const router = express.Router();
const {
  getAgents,
  getAgentById,
  toggleAvailability,
  updateProfile,
} = require('../controllers/agent.controller');
const { protect, agentOnly } = require('../middleware/auth');

router.get('/', protect, getAgents);
router.get('/:id', protect, getAgentById);
router.patch('/me/availability', protect, agentOnly, toggleAvailability);
router.patch('/me/profile', protect, updateProfile);

module.exports = router;
