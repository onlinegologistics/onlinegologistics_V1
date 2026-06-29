const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getMobileUsers,
    updateMobileUser,
    getEnquiries,
    updateEnquiry,
    getComplaints,
    updateComplaint,
    updateMobileShipment,
    getMobileShipmentById
} = require('../controllers/branchMobileUsersController');

// All routes are protected and admin/branch only
router.use(protect);
router.use(admin);

router.route('/mobile-users')
    .get(getMobileUsers);

router.route('/mobile-users/:id')
    .put(updateMobileUser);

router.route('/mobile-users/shipments/:id')
    .get(getMobileShipmentById)
    .put(updateMobileShipment);

router.route('/mobile-user-enquiries')
    .get(getEnquiries);

router.route('/mobile-user-enquiries/:id')
    .put(updateEnquiry);

router.route('/mobile-user-complaints')
    .get(getComplaints);

router.route('/mobile-user-complaints/:id')
    .put(updateComplaint);

module.exports = router;
