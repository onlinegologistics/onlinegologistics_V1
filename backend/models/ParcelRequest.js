const mongoose = require('mongoose');

const parcelRequestSchema = mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    pickupAddress: {
        type: String,
        required: true,
    },
    deliveryAddress: {
        type: String,
        required: true,
    },
    pickupDate: {
        type: Date,
    },
    packageDescription: {
        type: String,
    },
    weight: {
        type: Number,
    },
    quantity: {
        type: Number,
        default: 1,
    },
    remarks: {
        type: String,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled'],
        default: 'Pending',
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

const ParcelRequest = mongoose.model('ParcelRequest', parcelRequestSchema);

module.exports = ParcelRequest;
