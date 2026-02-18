const express = require('express');
const router = express.Router();
const {
    createParcelRequest,
    getParcelRequests,
    getParcelRequestById,
    updateParcelRequestStatus,
} = require('../controllers/parcelRequestController');
const { protect, adminOrUser } = require('../middleware/authMiddleware');

// Any authenticated user can create and list (filtered by role in controller)
router.route('/')
    .post(protect, createParcelRequest)
    .get(protect, getParcelRequests);

router.route('/:id')
    .get(protect, getParcelRequestById);

// Only admin/user can update status
router.route('/:id/status')
    .put(protect, adminOrUser, updateParcelRequestStatus);

module.exports = router;
