const express = require('express');
const router = express.Router();
const { loginUser, registerUser, getUsers, deleteUser, updateUser } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.route('/register').post(protect, admin, registerUser);
router.route('/users').get(protect, admin, getUsers);
router
    .route('/:id')
    .delete(protect, admin, deleteUser)
    .put(protect, admin, updateUser);

module.exports = router;
