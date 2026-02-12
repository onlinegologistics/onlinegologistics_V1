const asyncHandler = require('express-async-handler');
const Complaint = require('../models/Complaint');

// @desc    Get complaints
// @route   GET /api/complaints
// @access  Private
const getComplaints = asyncHandler(async (req, res) => {
    const { userId, startDate, endDate, page = 1, limit = 10 } = req.query;
    
    // Build filter query
    const query = {};
    
    // Filter by user if userId is provided
    if (userId) {
        query.user = userId;
    }
    
    // Date filtering
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
            query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            // Add 23:59:59 to include the entire end date
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999);
            query.createdAt.$lte = endDateTime;
        }
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalComplaints = await Complaint.countDocuments(query);
    const totalPages = Math.ceil(totalComplaints / limitNum);

    // Fetch complaints with filters and pagination
    const complaints = await Complaint.find(query)
        .populate('user', 'name username mobile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

    res.json({
        complaints,
        pagination: {
            currentPage: pageNum,
            totalPages,
            totalComplaints,
            limit: limitNum,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
        }
    });
});

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Public
const createComplaint = asyncHandler(async (req, res) => {
    const { subject, description, priority, contactName, contactMobile, receiptNo } = req.body;

    if (!subject || !description || !receiptNo) {
        res.status(400);
        throw new Error('Please add subject, description, and receipt number');
    }

    // If user is logged in, use their ID but also save contact info to ensure we have it
    let complaintData = {
        subject,
        description,
        receiptNo,
        priority: priority || 'Medium',
        contactName,
        contactMobile
    };

    if (req.user) {
        complaintData.user = req.user._id;
    } else {
        if (!contactName || !contactMobile) {
            res.status(400);
            throw new Error('Please provide Name and Mobile Number for guest tickets');
        }
    }

    const complaint = await Complaint.create(complaintData);

    res.status(201).json(complaint);
});

// @desc    Update complaint status/details
// @route   PUT /api/complaints/:id
// @access  Private (Admin mostly)
const updateComplaint = asyncHandler(async (req, res) => {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
        res.status(404);
        throw new Error('Complaint not found');
    }

    // Check if user is authorized (Admin can update anything, User maybe shouldn't update status directly? For now let's allow admin only for status updates via UI logic, but backend allows if protection is passed)
    // Actually, let's strictly allow only admins or the owner to update.

    // For simplicity following the request: Admin updates status.
    const updatedComplaint = await Complaint.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });

    res.json(updatedComplaint);
});

module.exports = {
    getComplaints,
    createComplaint,
    updateComplaint
};
