const express = require('express');
const router = express.Router();
const { getEnquiries, createEnquiry, updateEnquiry } = require('../controllers/enquiryController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getEnquiries).post(createEnquiry);
router.route('/:id').put(protect, updateEnquiry);

module.exports = router;
