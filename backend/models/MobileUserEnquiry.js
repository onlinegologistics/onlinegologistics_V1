const mongoose = require('mongoose');

const mobileUserEnquirySchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MobileUser',
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    name: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
    },
    email: {
        type: String,
    },
    enquiryType: {
        type: String,
    },
    subject: {
        type: String,
    },
    message: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
        default: 'Open',
    },
    adminResponse: {
        type: String,
    }
}, {
    timestamps: true,
});

// Explicitly use the 'mobileuser_enquiry' collection
const MobileUserEnquiry = mongoose.model('MobileUserEnquiry', mobileUserEnquirySchema, 'mobileuser_enquiry');
module.exports = MobileUserEnquiry;
