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

// Delete hooks to trace unauthorized deletions
mobileUserSchema.pre('deleteOne', { document: true, query: false }, function (next) {
    console.error('[MobileUser] deleteOne document hook triggered on:', this._id);
    console.error(new Error().stack);
    next();
});

mobileUserSchema.pre('findOneAndDelete', function (next) {
    console.error('[MobileUser] findOneAndDelete hook triggered. Filter:', this.getFilter());
    console.error(new Error().stack);
    next();
});

mobileUserSchema.pre('deleteMany', function (next) {
    console.error('[MobileUser] deleteMany hook triggered. Filter:', this.getFilter());
    console.error(new Error().stack);
    next();
});

// Explicitly use the 'mobileusers' collection as requested
const MobileUser = mongoose.model('MobileUser', mobileUserSchema, 'mobileusers');
module.exports = MobileUser;
