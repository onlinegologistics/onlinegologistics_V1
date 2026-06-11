const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getWhatsAppStatus } = require('../services/whatsappService');

// @desc    Get WhatsApp connection status / QR code
// @route   GET /api/whatsapp/status
router.get('/status', protect, async (req, res) => {
    try {
        if (!['branch', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        res.json(getWhatsAppStatus());
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
