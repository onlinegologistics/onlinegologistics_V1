const mongoose = require('mongoose');

const mobileUserSchema = mongoose.Schema({
    name: { type: String },
    customerName: { type: String },
    email: { type: String },
    mobile: { type: String },
    mobileNumber: { type: String },
    altMobile: { type: String },
    address: { type: String },
    pickupAddress: { type: String },
    isActive: { type: Boolean, default: true },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Explicitly use the 'mobileusers' collection as requested
const MobileUser = mongoose.model('MobileUser', mobileUserSchema, 'mobileusers');
module.exports = MobileUser;
