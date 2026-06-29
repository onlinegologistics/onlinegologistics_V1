const mongoose = require('mongoose');

const mobileUserComplaintSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MobileUser',
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    contactName: {
        type: String,
    },
    contactMobile: {
        type: String,
    },
    receiptNo: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['Open', 'In Progress', 'Resolved', 'Closed', 'Pending'], // Allow 'Pending' if existing database has it
        default: 'Open',
    },
    priority: {
        type: String,
        required: true,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium',
    },
    adminResponse: {
        type: String,
    }
}, {
    timestamps: true,
});

// Explicitly use the 'mobileuser_complaints' collection
const MobileUserComplaint = mongoose.model('MobileUserComplaint', mobileUserComplaintSchema, 'mobileuser_complaints');
module.exports = MobileUserComplaint;
