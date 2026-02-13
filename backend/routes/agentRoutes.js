const express = require('express');
const router = express.Router();
const { createAgent, getAgents, deleteAgent } = require('../controllers/agentController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createAgent)
    .get(protect, getAgents);

router.route('/:id')
    .delete(protect, admin, deleteAgent);

module.exports = router;
