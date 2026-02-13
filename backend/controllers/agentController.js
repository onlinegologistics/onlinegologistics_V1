const Agent = require('../models/Agent');

// @desc    Create new agent
// @route   POST /api/agents
// @access  Private (Admin & User)
const createAgent = async (req, res) => {
    try {
        const { name, mobile } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Agent name is required' });
        }

        const agentExists = await Agent.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (agentExists) {
            return res.status(400).json({ message: 'Agent with this name already exists' });
        }

        const agent = await Agent.create({ name, mobile });
        res.status(201).json(agent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all agents
// @route   GET /api/agents
// @access  Private (Admin & User)
const getAgents = async (req, res) => {
    try {
        const agents = await Agent.find({ isActive: true }).sort({ name: 1 });
        res.json(agents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete agent
// @route   DELETE /api/agents/:id
// @access  Private/Admin
const deleteAgent = async (req, res) => {
    try {
        const agent = await Agent.findById(req.params.id);

        if (agent) {
            await agent.deleteOne();
            res.json({ message: 'Agent removed' });
        } else {
            res.status(404).json({ message: 'Agent not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createAgent, getAgents, deleteAgent };
