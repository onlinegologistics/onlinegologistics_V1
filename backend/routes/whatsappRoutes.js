const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getWhatsAppStatus,
    restartWhatsApp,
    logoutWhatsApp,
} = require('../services/whatsappService');

const canManageWhatsApp = (user) => {
    if (!user || !user.role) return false;
    const role = String(user.role).toLowerCase().trim();
    return role === 'admin' || role === 'branch';
};

// @desc    Get WhatsApp connection status / QR code
// @route   GET /api/whatsapp/status
router.get('/status', protect, async (req, res) => {
    try {
        if (!canManageWhatsApp(req.user)) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        res.json(getWhatsAppStatus());
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Clear a stale session and generate a new WhatsApp QR code
// @route   POST /api/whatsapp/restart
router.post('/restart', protect, async (req, res) => {
    try {
        if (!canManageWhatsApp(req.user)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const status = await restartWhatsApp();
        res.status(202).json(status);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Logout / Disconnect WhatsApp session and prepare new QR code
// @route   POST /api/whatsapp/logout
router.post('/logout', protect, async (req, res) => {
    try {
        if (!canManageWhatsApp(req.user)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const status = await logoutWhatsApp();
        res.status(200).json(status);
    } catch (error) {
        console.error('Logout WhatsApp route error:', error);
        res.status(500).json({ message: error.message || 'WhatsApp logout could not be completed' });
    }
});

module.exports = router;
