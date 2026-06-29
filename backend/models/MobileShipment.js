const mongoose = require('mongoose');

const mobileShipmentSchema = mongoose.Schema({
    pickupAddress: { type: String },
    deliveryAddress: { type: String },
    packageDescription: { type: String },
    parcelType: { type: String },
    weight: { type: Number },
    quantity: { type: Number },
    remarks: { type: String },
    pickupCity: { type: String },
    deliveryCity: { type: String },
    customerName: { type: String },
    mobileNumber: { type: String },
    transportType: { type: String },
    expectedDeliveryDate: { type: Date },
    parcelRequestId: { type: String },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    currentBranch: { type: String },
    currentLocation: { type: String },
    currentStatus: { type: String },
    isActive: { type: Boolean, default: true },
    trackingId: { type: String },
    assignedStaff: { type: String }
}, { timestamps: true });

// Explicitly map to the 'mobileusers' collection (which contains shipments/orders)
const MobileShipment = mongoose.model('MobileShipment', mobileShipmentSchema, 'mobileusers');
module.exports = MobileShipment;
