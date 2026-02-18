const ParcelRequest = require('../models/ParcelRequest');

// @desc    Create new parcel request
// @route   POST /api/parcel-requests
// @access  Private (Customer)
const createParcelRequest = async (req, res) => {
    try {
        const parcelRequest = new ParcelRequest({
            ...req.body,
            customer: req.user._id,
        });

        const created = await parcelRequest.save();
        res.status(201).json(created);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all parcel requests
// @route   GET /api/parcel-requests
// @access  Private (Customer sees own, Admin/User sees all)
const getParcelRequests = async (req, res) => {
    try {
        let query = {};

        // Customers only see their own requests
        if (req.user.role === 'customer') {
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

// @desc    Get parcel request by ID
// @route   GET /api/parcel-requests/:id
// @access  Private
const getParcelRequestById = async (req, res) => {
    try {
        const parcelRequest = await ParcelRequest.findById(req.params.id)
            .populate('customer', 'name username email mobile company')
            .populate('updatedBy', 'name');

        if (!parcelRequest) {
            return res.status(404).json({ message: 'Parcel request not found' });
        }

        // Customers can only view their own
        if (req.user.role === 'customer' && parcelRequest.customer._id.toString() !== req.user._id.toString()) {
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

        parcelRequest.status = req.body.status;
        parcelRequest.updatedBy = req.user._id;

        const updated = await parcelRequest.save();

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
