const asyncHandler = require("express-async-handler");
const Enquiry = require("../models/Enquiry");

// @desc    Get all enquiries
// @route   GET /api/enquiries
// @access  Private (Admin/Staff)
const getEnquiries = asyncHandler(async (req, res) => {
  const { startDate, endDate, page = 1, limit = 10 } = req.query;

  // Build filter query
  const filter = {};

  // Date filtering
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      // Add 23:59:59 to include the entire end date
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = endDateTime;
    }
  }

  // Calculate pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Get total count for pagination
  const totalEnquiries = await Enquiry.countDocuments(filter);
  const totalPages = Math.ceil(totalEnquiries / limitNum);

  // Fetch enquiries with filters and pagination
  const enquiries = await Enquiry.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  res.json({
    enquiries,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalEnquiries,
      limit: limitNum,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    },
  });
});

// @desc    Create new enquiry
// @route   POST /api/enquiries
// @access  Public
const createEnquiry = asyncHandler(async (req, res) => {
  const { name, mobile, message } = req.body;

  if (!name || !mobile || !message) {
    res.status(400);
    throw new Error("Please add all fields");
  }

  const enquiry = await Enquiry.create({
    name,
    mobile,
    message,
  });

  res.status(201).json(enquiry);
});

// @desc    Update enquiry status
// @route   PUT /api/enquiries/:id
// @access  Private (Admin/Staff)
const updateEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id);

  if (!enquiry) {
    res.status(404);
    throw new Error("Enquiry not found");
  }

  const updatedEnquiry = await Enquiry.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
    },
  );

  res.json(updatedEnquiry);
});

module.exports = {
  getEnquiries,
  createEnquiry,
  updateEnquiry,
};
