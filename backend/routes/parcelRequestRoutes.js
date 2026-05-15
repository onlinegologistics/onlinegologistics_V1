const express = require('express');
const router = express.Router();
const {
    createParcelRequest,
    getParcelRequests,
    getParcelRequestById,
    updateParcelRequestStatus,
} = require('../controllers/parcelRequestController');
const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/roleAuth');
const { PERMISSIONS } = require('../config/roles');

// Create parcel request - sab authenticated users
router.post('/',
    protect,
    createParcelRequest
);

// View all parcel requests - sab dekh sakte hain
router.get('/',
    protect,
    getParcelRequests
);

// View parcel request by ID
router.get('/:id',
    protect,
    getParcelRequestById
);

// Update parcel request status - sirf admin aur superadmin
router.put('/:id/status',
    protect,
    checkPermission(PERMISSIONS.UPDATE_PARCEL),
    updateParcelRequestStatus
);

module.exports = router;