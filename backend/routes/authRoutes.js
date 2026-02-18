const express = require('express');
const router = express.Router();
const { loginUser, registerUser, getUsers, deleteUser, updateUser, getCustomers } = require('../controllers/authController');
const { protect, admin, adminOrUser } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.route('/register').post(protect, adminOrUser, registerUser);
router.route('/users').get(protect, admin, getUsers);
router.route('/customers').get(protect, adminOrUser, getCustomers);
router
    .route('/:id')
    .delete(protect, admin, deleteUser)
    .put(protect, adminOrUser, updateUser);

module.exports = router;
