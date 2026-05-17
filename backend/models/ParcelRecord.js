const mongoose = require('mongoose');

const parcelRecordSchema = mongoose.Schema({
    clientType: {
        type: String,
        enum: ['regular', 'agent', 'Customer'],
        required: true,
    },
    clientName: { type: String, required: true },
    mobile: { type: String },
    address: { type: String },
    company: { type: String },

    // Support for multiple destinations
    destinations: [{
        toCity: { type: String },
        noOfParcels: { type: Number, default: 1 },
        weight: { type: String },
        description: { type: String },
        parcelType: { type: String },
        freight: { type: Number, default: 0 },
        otherCharges: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        paymentMode: { type: String, default: 'Paid' },
        status: { type: String, default: 'Booked' },
        remarks: { type: String },
    }],

    // Legacy Parcel Details (kept for backward compatibility, now optional)
    fromCity: { type: String, required: true },
    toCity: { type: String },
    noOfParcels: { type: Number, default: 1 },
    weight: { type: String },
    description: { type: String },
    parcelType: { type: String }, // Box, Bag, Envelope, etc.

    // Charges
    freight: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paymentMode: {
        type: String,
        enum: ['Paid', 'ToPay', 'Credit', 'FOC'],
        default: 'Paid',
    },

    // Status
    status: {
        type: String,
        enum: ['Booked', 'In Transit', 'Delivered', 'Cancelled'],
        default: 'Booked',
    },

    remarks: { type: String },
    date: { type: Date, default: Date.now },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('ParcelRecord', parcelRecordSchema);
