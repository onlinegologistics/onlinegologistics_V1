const jwt = require('jsonwebtoken');
const User = require('../models/User');
const transporter = require('../config/mailer');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    // Allow login with either email or username
    // Find all matching users and try each one
    const users = await User.find({
        $or: [{ email: email }, { username: email }]
    });
    
    // Try to match password with each found user (prefer admin/branch roles)
    const sortedUsers = users.sort((a, b) => {
        const priority = { admin: 0, branch: 1, user: 2, customer: 3 };
        return (priority[a.role] || 99) - (priority[b.role] || 99);
    });

    for (const user of sortedUsers) {
        if (await user.matchPassword(password)) {
            return res.json({
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        }
    }

    res.status(401).json({ message: 'Invalid email/username or password' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Private/Admin
const registerUser = async (req, res) => {
    const { name, username, password, role, email, mobile, address, company, clientType } = req.body;
    const userExists = await User.findOne({ username });
    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }
    const user = await User.create({
        name, username, password, role, email, mobile, address, company, clientType,
        createdByUser: req.user._id,
    });
    if (user) {
        res.status(201).json({
            _id: user._id, name: user.name, username: user.username,
            role: user.role, email: user.email, mobile: user.mobile,
            address: user.address, company: user.company, clientType: user.clientType,
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    let filter = {};
    if (req.user && req.user.role === 'branch') {
        filter = { $or: [{ _id: req.user._id }, { createdByUser: req.user._id }] };
    }
    const users = await User.find(filter).populate('createdByUser', 'name username');
    res.json(users);
};

// @desc    Delete user
// @route   DELETE /api/auth/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
        await user.deleteOne();
        res.json({ message: 'User removed' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Update user
// @route   PUT /api/auth/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
        user.name = req.body.name || user.name;
        user.username = req.body.username || user.username;
        user.role = req.body.role || user.role;
        if (req.body.email !== undefined) user.email = req.body.email;
        if (req.body.password) user.password = req.body.password;
        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id, name: updatedUser.name,
            username: updatedUser.username, role: updatedUser.role,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Get customers (branch sees own, admin sees all)
// @route   GET /api/auth/customers
// @access  Private/AdminOrUser
const getCustomers = async (req, res) => {
    try {
        const filter = { role: 'customer' };
        // Branch users only see their own customers
        if (req.user.role === 'branch') {
            filter.createdByUser = req.user._id;
        }
        const customers = await User.find(filter).populate('createdByUser', '_id name role');
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send OTP to admin email
// @route   POST /api/auth/send-otp
// @access  Private
const sendOTP = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.email) {
            return res.status(400).json({ message: 'No email found on your account.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        await transporter.sendMail({
            from: `"Online Go Logistics" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'OTP for Profile Update',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
                    <h2 style="color: #0f172a;">Profile Update OTP</h2>
                    <p style="color: #6b7280;">You requested to update your profile on <strong>Online Go Logistics</strong>.</p>
                    <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0f172a;">${otp}</span>
                    </div>
                    <p style="color: #6b7280;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
                </div>
            `,
        });

        res.json({ message: `OTP sent to ${user.email}` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Update own profile after OTP verification
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!req.body.otp) return res.status(400).json({ message: 'OTP is required' });
        if (user.otp !== req.body.otp) return res.status(401).json({ message: 'Invalid OTP' });
        if (!user.otpExpiry || user.otpExpiry < new Date()) {
            return res.status(401).json({ message: 'OTP has expired. Please request a new one.' });
        }

        if (req.body.email) user.email = req.body.email;

        if (req.body.newPassword) {
            if (!req.body.currentPassword) {
                return res.status(400).json({ message: 'Current password required' });
            }
            const isMatch = await user.matchPassword(req.body.currentPassword);
            if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });
            user.password = req.body.newPassword;
        }

        user.otp = undefined;
        user.otpExpiry = undefined;

        await user.save();
        res.json({ message: 'Profile updated successfully!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { loginUser, registerUser, getUsers, deleteUser, updateUser, getCustomers, sendOTP, updateProfile };