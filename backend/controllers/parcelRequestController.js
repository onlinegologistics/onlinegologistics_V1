const ParcelRequest = require('../models/ParcelRequest');
const MobileUser = require('../models/MobileUser');
const mongoose = require('mongoose');

const createTrackingId = () => `TRK${Math.random().toString(36).slice(2, 10).toUpperCase()}${Date.now().toString(36).slice(-4).toUpperCase()}`;

// @desc    Create new parcel request
// @route   POST /api/parcel-requests
// @access  Private (Customer / Mobile User)
const createParcelRequest = async (req, res) => {
    try {
        const isMobileRole = req.user.role === 'mobile';
        const isMobileDoc = isMobileRole || (await MobileUser.exists({ _id: req.user._id }));
        const customerModel = isMobileDoc ? 'MobileUser' : 'User';

        const trackingId = req.body.trackingId || createTrackingId();
        let initialStatus = req.body.status || req.body.currentStatus || 'Pickup Pending';
        if (initialStatus === 'Pending') {
            initialStatus = 'Pickup Pending';
        }
        const initialTrackingHistory = [{
            status: initialStatus,
            location: req.body.pickupAddress || req.body.pickupCity || 'Origin',
            branchName: req.body.currentBranch || 'Central Hub',
            remark: req.body.remarks || 'Shipment registered - Pickup Pending',
            updatedBy: req.user.name || 'Customer',
            dateTime: new Date(),
        }];

        const parcelRequest = new ParcelRequest({
            ...req.body,
            customer: req.user._id,
            customerModel,
            trackingId,
            status: initialStatus,
            currentStatus: initialStatus,
            currentShipmentStatus: initialStatus,
            currentBranch: req.body.currentBranch || 'Central Hub',
            currentLocation: req.body.pickupAddress || req.body.pickupCity || '',
            assignedStaff: req.body.assignedStaff || '',
            trackingHistory: initialTrackingHistory,
        });

        const created = await parcelRequest.save();

        const shipmentItem = {
            parcelRequestId: created._id,
            trackingId,
            pickupAddress: req.body.pickupAddress,
            deliveryAddress: req.body.deliveryAddress,
            packageDescription: req.body.packageDescription || req.body.parcelType || 'Package',
            parcelType: req.body.parcelType || req.body.packageDescription || 'Package',
            weight: req.body.weight || 0,
            quantity: req.body.quantity || 1,
            remarks: req.body.remarks || '',
            pickupCity: req.body.pickupCity || '',
            deliveryCity: req.body.deliveryCity || '',
            deliveryLocation: req.body.deliveryLocation || null,
            customerName: req.body.customerName || req.user.name || '',
            mobileNumber: req.body.mobileNumber || req.user.mobile || '',
            transportType: req.body.transportType || 'STANDARD',
            expectedDeliveryDate: req.body.expectedDeliveryDate || null,
            currentBranch: req.body.currentBranch || 'Central Hub',
            currentLocation: req.body.pickupAddress || '',
            currentStatus: initialStatus,
            currentShipmentStatus: initialStatus,
            status: initialStatus,
            assignedStaff: req.body.assignedStaff || '',
            trackingHistory: initialTrackingHistory,
            createdAt: new Date(),
        };

        // If user is a mobile user, store shipment in their shipments array and update latest defaults
        if (isMobileDoc) {
            await MobileUser.findByIdAndUpdate(req.user._id, {
                $push: { shipments: shipmentItem },
                $set: {
                    pickupAddress: req.body.pickupAddress,
                    deliveryAddress: req.body.deliveryAddress,
                    packageDescription: req.body.packageDescription || req.body.parcelType || 'Package',
                    parcelType: req.body.parcelType || req.body.packageDescription || 'Package',
                    weight: req.body.weight,
                    quantity: req.body.quantity,
                    remarks: req.body.remarks,
                    pickupCity: req.body.pickupCity,
                    deliveryCity: req.body.deliveryCity,
                    deliveryLocation: req.body.deliveryLocation || null,
                    customerName: req.body.customerName || req.user.name,
                    mobileNumber: req.body.mobileNumber || req.user.mobile,
                    transportType: req.body.transportType || 'STANDARD',
                    expectedDeliveryDate: req.body.expectedDeliveryDate || null,
                    parcelRequestId: created._id,
                    customer: req.user._id,
                    currentBranch: req.body.currentBranch || 'Central Hub',
                    currentLocation: req.body.pickupAddress,
                    currentStatus: initialStatus,
                    currentShipmentStatus: initialStatus,
                    status: initialStatus,
                    isActive: true,
                    trackingId,
                    assignedStaff: req.body.assignedStaff || '',
                }
            });
        }

        res.status(201).json(created);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all parcel requests
// @route   GET /api/parcel-requests
// @access  Private (Admin/User/Mobile)
const getParcelRequests = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'customer' || req.user.role === 'mobile') {
            query.customer = req.user._id;
        }

        const parcelRequests = await ParcelRequest.find(query)
            .populate('customer', 'name username email mobile company')
            .populate('updatedBy', 'name')
            .sort({ createdAt: -1 });

        res.json(parcelRequests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single parcel request by ID
// @route   GET /api/parcel-requests/:id
// @access  Private (Admin/User/Mobile)
const getParcelRequestById = async (req, res) => {
    try {
        const parcelRequest = await ParcelRequest.findById(req.params.id)
            .populate('customer', 'name username email mobile company')
            .populate('updatedBy', 'name');

        if (!parcelRequest) {
            return res.status(404).json({ message: 'Parcel request not found' });
        }

        // Authorization check
        if ((req.user.role === 'customer' || req.user.role === 'mobile') && parcelRequest.customer._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this request' });
        }

        res.json(parcelRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update parcel request status
// @route   PUT /api/parcel-requests/:id/status
// @access  Private (Admin/User only)
const updateParcelRequestStatus = async (req, res) => {
    try {
        const parcelRequest = await ParcelRequest.findById(req.params.id);

        if (!parcelRequest) {
            return res.status(404).json({ message: 'Parcel request not found' });
        }

        const newStatus = req.body.status;
        const oldStatus = parcelRequest.status;
        parcelRequest.status = newStatus;
        parcelRequest.currentStatus = newStatus;
        parcelRequest.updatedBy = req.user._id;

        const historyEntry = {
            status: newStatus,
            location: req.body.location || parcelRequest.currentLocation || '',
            branchName: req.body.branchName || parcelRequest.currentBranch || '',
            remark: req.body.remarks || req.body.remark || `Status updated to "${newStatus}"`,
            updatedBy: req.user ? req.user.name : 'Admin',
            dateTime: new Date(),
        };

        if (!Array.isArray(parcelRequest.trackingHistory)) {
            parcelRequest.trackingHistory = [];
        }
        parcelRequest.trackingHistory.push(historyEntry);

        const updated = await parcelRequest.save();

        const customerId = parcelRequest.customer ? (parcelRequest.customer._id || parcelRequest.customer) : null;
        if (customerId) {
            // Update in MobileUser shipments array
            await MobileUser.updateOne(
                { _id: customerId, 'shipments.parcelRequestId': parcelRequest._id },
                {
                    $set: {
                        'shipments.$.status': newStatus,
                        'shipments.$.currentStatus': newStatus,
                        'shipments.$.currentShipmentStatus': newStatus,
                        'shipments.$.currentBranch': historyEntry.branchName,
                        'shipments.$.currentLocation': historyEntry.location,
                    },
                    $push: {
                        'shipments.$.trackingHistory': historyEntry
                    }
                }
            );

            // If top-level parcelRequestId matches, update top-level as well
            await MobileUser.updateOne(
                { _id: customerId, parcelRequestId: parcelRequest._id },
                {
                    $set: {
                        status: newStatus,
                        currentStatus: newStatus,
                        currentShipmentStatus: newStatus,
                        currentBranch: historyEntry.branchName,
                        currentLocation: historyEntry.location,
                    },
                    $push: {
                        trackingHistory: historyEntry
                    }
                }
            );
        }

        const populated = await ParcelRequest.findById(updated._id)
            .populate('customer', 'name username email mobile company')
            .populate('updatedBy', 'name');

        res.json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createParcelRequest,
    getParcelRequests,
    getParcelRequestById,
    updateParcelRequestStatus,
};
