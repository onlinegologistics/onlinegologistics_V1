const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            if (!token || token === 'undefined' || token === 'null') {
                return res.status(401).json({ message: 'Not authorized, invalid token' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                const MobileUser = require('../models/MobileUser');
                req.user = await MobileUser.findById(decoded.id).select('-password');
            }

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            return next();
        } catch (error) {
            console.error('[AUTH ERROR]', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    const role = (req.user?.role || '').toLowerCase().trim();
    if (req.user && (role === 'admin' || role === 'branch')) {
        return next();
    } else {
        return res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

const adminOrUser = (req, res, next) => {
    const role = (req.user?.role || '').toLowerCase().trim();
    if (req.user && (role === 'admin' || role === 'user' || role === 'branch' || role === 'agent')) {
        return next();
    } else {
        return res.status(401).json({ message: 'Not authorized. Admin or User role required.' });
    }
};

module.exports = { protect, admin, adminOrUser };
