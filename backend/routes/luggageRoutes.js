const express = require('express');
const router = express.Router();
const {
    createLuggage,
    getLuggage,
    getLuggageById,
    deleteLuggage,
    updateLuggage,
} = require('../controllers/luggageController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createLuggage)
    .get(protect, getLuggage); // Allow both roles to view for now, or restrict. Requirement only explicitly restricts "User can only add", implying they might not manage/edit/delete.

router.route('/:id')
    .get(protect, getLuggageById)
    .delete(protect, admin, deleteLuggage)
    .put(protect, admin, updateLuggage);

module.exports = router;
