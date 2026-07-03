const MobileUser = require('../models/MobileUser');
const MobileUserEnquiry = require('../models/MobileUserEnquiry');
const MobileUserComplaint = require('../models/MobileUserComplaint');
const ParcelRequest = require('../models/ParcelRequest');
const MobileShipment = require('../models/MobileShipment');
const asyncHandler = require('express-async-handler');

// Helper to seed mock data if database is empty
const seedMockDataIfEmpty = async (branchId) => {
    const userCount = await MobileUser.countDocuments();
    if (userCount === 0) {
        // Seed users
        const users = [
            {
                name: 'Rahul Sharma',
                email: 'rahul.sharma@example.com',
                username: 'rahul_sharma',
                mobile: '9876543210',
                altMobile: '9876543211',
                address: 'Flat 402, Sunrise Apartments, Sector 15, Rohini, Delhi',
                isActive: true,
                branch: branchId
            },
            {
                name: 'Priya Patel',
                email: 'priya.patel@example.com',
                username: 'priya_patel',
                mobile: '8765432109',
                altMobile: '',
                address: '12, Shanti Nagar, Near Mall Road, Indore, MP',
                isActive: true,
                branch: branchId
            },
            {
                name: 'Amit Verma',
                email: 'amit.verma@example.com',
                username: 'amit_verma',
                mobile: '7654321098',
                altMobile: '7654321099',
                address: 'Line 3, Hazratganj, Lucknow, UP',
                isActive: false,
                branch: branchId
            },
            {
                name: 'Sneha Reddy',
                email: 'sneha.reddy@example.com',
                username: 'sneha_reddy',
                mobile: '6543210987',
                altMobile: '',
                address: 'Plot 45, Jubilee Hills, Hyderabad, Telangana',
                isActive: true,
                branch: branchId
            }
        ];
        const createdUsers = await MobileUser.insertMany(users);

        // Seed some shipments (ParcelRequests) for these users
        const parcelRequests = [
            {
                customer: branchId, // fallback link
                pickupAddress: 'Flat 402, Sunrise Apartments, Sector 15, Rohini, Delhi',
                deliveryAddress: '55, Park Street, Kolkata, West Bengal',
                pickupDate: new Date(),
                packageDescription: 'Electronics & Accessories',
                weight: 5.5,
                quantity: 2,
                status: 'In Transit',
                remarks: 'Fragile items, handle with care'
            },
            {
                customer: branchId,
                pickupAddress: '12, Shanti Nagar, Near Mall Road, Indore, MP',
                deliveryAddress: 'G-9, Bandra Kurla Complex, Mumbai, Maharashtra',
                pickupDate: new Date(),
                packageDescription: 'Documents and Clothes',
                weight: 12.0,
                quantity: 1,
                status: 'Delivered',
                remarks: 'Deliver to reception'
            }
        ];
        await ParcelRequest.insertMany(parcelRequests);

        // Seed Enquiries
        const enquiries = [
            {
                user: createdUsers[0]._id,
                branch: branchId,
                name: 'Rahul Sharma',
                mobile: '9876543210',
                email: 'rahul.sharma@example.com',
                enquiryType: 'Pricing',
                subject: 'Corporate Rates for Bulk Shipments',
                message: 'I want to know if there is any discount for sending 20+ packages per month from Delhi to Mumbai.',
                status: 'Open',
                adminResponse: ''
            },
            {
                user: createdUsers[1]._id,
                branch: branchId,
                name: 'Priya Patel',
                mobile: '8765432109',
                email: 'priya.patel@example.com',
                enquiryType: 'Serviceability',
                subject: 'Delivery to remote areas in UK',
                message: 'Do you deliver to remote areas of Uttarakhand, specifically near Joshimath?',
                status: 'Resolved',
                adminResponse: 'Yes, we service Joshimath via our regional partner networks. Delivery may take 5-7 working days.'
            }
        ];
        await MobileUserEnquiry.insertMany(enquiries);

        // Seed Complaints
        const complaints = [
            {
                user: createdUsers[0]._id,
                branch: branchId,
                contactName: 'Rahul Sharma',
                contactMobile: '9876543210',
                receiptNo: 'REC-2026-9901',
                subject: 'Delayed Pickup Delhi Branch',
                description: 'The pickup was scheduled for yesterday 2 PM but no agent has called or arrived yet.',
                status: 'In Progress',
                priority: 'High',
                adminResponse: 'Assigning to Delhi pickup team immediately.'
            },
            {
                user: createdUsers[2]._id,
                branch: branchId,
                contactName: 'Amit Verma',
                contactMobile: '7654321098',
                receiptNo: 'REC-2026-8842',
                subject: 'Damaged outer box',
                description: 'The box received today was torn at the corner, although the inside items are safe.',
                status: 'Closed',
                priority: 'Medium',
                adminResponse: 'Apologies for the inconvenience. We have noted this and warned the loading team.'
            }
        ];
        await MobileUserComplaint.insertMany(complaints);
    }
};

const getMobileUsers = asyncHandler(async (req, res) => {
    // Both MobileUser and MobileShipment are mapped to the 'mobileusers' collection.
    // We fetch all records, and since we use .lean(), we get all fields present in the database.
    const allRecords = await MobileShipment.find({}).sort({ createdAt: -1 }).lean();

    const userProfiles = new Map();
    const latestShipments = new Map();

    // Separate records into user profiles and shipments
    allRecords.forEach(record => {
        const mobile = record.mobileNumber || record.mobile || 'N/A';
        if (mobile === 'N/A') return;

        const hasShipment = record.deliveryAddress && record.deliveryAddress.trim() !== '';

        if (hasShipment) {
            // It's a shipment record. Store the first one we see (which is the latest due to sort)
            if (!latestShipments.has(mobile)) {
                latestShipments.set(mobile, record);
            }
        } else {
            // It's likely a user profile record (or a shipment missing delivery address).
            // We want the profile that has address/email info.
            if (!userProfiles.has(mobile)) {
                userProfiles.set(mobile, record);
            } else {
                // If we already have a profile, check if this one has more info (e.g. email or address)
                const existing = userProfiles.get(mobile);
                if ((!existing.email && record.email) || (!existing.address && record.address)) {
                     // Merge info
                     userProfiles.set(mobile, { ...existing, ...record });
                }
            }
        }
    });

    const uniqueUsersMap = new Map();

    // Collect all unique mobile numbers from both maps
    const allMobiles = new Set([...userProfiles.keys(), ...latestShipments.keys()]);

    allMobiles.forEach(mobile => {
        const profile = userProfiles.get(mobile) || {};
        const s = latestShipments.get(mobile);

        uniqueUsersMap.set(mobile, {
            _id: profile._id || (s ? s._id : null),
            name: profile.name || profile.customerName || (s ? (s.customerName || s.name) : 'N/A') || 'N/A',
            email: profile.email || (s ? s.email : null) || 'N/A',
            mobile: mobile,
            altMobile: profile.altMobile || (s ? s.altMobile : '') || '',
            address: profile.address || profile.pickupAddress || (s ? s.pickupAddress : 'N/A') || 'N/A',
            isActive: profile.isActive !== undefined ? profile.isActive : (s && s.isActive !== undefined ? s.isActive : true),
            createdAt: profile.createdAt || (s ? s.createdAt : new Date()),
            latestShipment: s ? {
                trackingId: s._id.toString(),
                lrNumber: s.trackingId || s.parcelRequestId || s._id.toString().substring(18).toUpperCase(),
                customerName: s.customerName || s.name || profile.name || 'N/A',
                mobileNumber: mobile,
                pickupCity: s.pickupCity || 'Pune',
                pickupAddress: s.pickupAddress || profile.address || 'N/A',
                deliveryCity: s.deliveryCity || 'Latur',
                deliveryAddress: s.deliveryAddress,
                parcelType: s.parcelType || s.packageDescription || 'Package',
                transportType: s.transportType || 'Road',
                weight: s.weight || 0,
                quantity: s.quantity || 1,
                expectedDeliveryDate: s.expectedDeliveryDate,
                currentShipmentStatus: s.currentStatus || 'Pending',
                currentBranch: s.currentBranch || (req.user ? req.user.name : 'Branch Hub'),
                currentLocation: s.currentLocation || s.pickupAddress || 'N/A'
            } : null
        });
    });

    const usersList = Array.from(uniqueUsersMap.values());
    // Sort overall list by joined date descending
    usersList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(usersList);
});

// @desc    Update mobile user isActive status and details
// @route   PUT /api/mobile-users/:id
// @access  Private (Branch/Admin)
const updateMobileUser = asyncHandler(async (req, res) => {
    const { isActive, name, email, mobile, altMobile, address } = req.body;
    
    const shipments = await MobileShipment.find({
        $or: [
            { mobileNumber: req.params.id },
            { mobile: req.params.id },
            { _id: req.params.id }
        ]
    });

    if (shipments.length === 0) {
        res.status(404);
        throw new Error('Customer record not found');
    }

    const mobileToUpdate = shipments[0].mobileNumber || shipments[0].mobile || req.params.id;

    const updateFields = {};
    if (isActive !== undefined) updateFields.isActive = isActive;
    if (name !== undefined) {
        updateFields.customerName = name;
        updateFields.name = name;
    }
    if (email !== undefined) updateFields.email = email;
    if (mobile !== undefined) {
        updateFields.mobileNumber = mobile;
        updateFields.mobile = mobile;
    }
    if (altMobile !== undefined) updateFields.altMobile = altMobile;
    if (address !== undefined) {
        updateFields.pickupAddress = address;
        updateFields.address = address;
    }

    await MobileShipment.updateMany(
        { $or: [{ mobileNumber: mobileToUpdate }, { mobile: mobileToUpdate }, { _id: req.params.id }] },
        updateFields
    );

    res.json({ _id: req.params.id, ...updateFields });
});

// @desc    Delete a mobile user completely
// @route   DELETE /api/mobile-users/:id
// @access  Private (Branch/Admin)
const deleteMobileUser = asyncHandler(async (req, res) => {
    const shipments = await MobileShipment.find({
        $or: [
            { mobileNumber: req.params.id },
            { mobile: req.params.id },
            { _id: req.params.id }
        ]
    });

    if (shipments.length === 0) {
        res.status(404);
        throw new Error('Customer record not found');
    }

    const mobileToDelete = shipments[0].mobileNumber || shipments[0].mobile || req.params.id;

    await MobileShipment.deleteMany({
        $or: [{ mobileNumber: mobileToDelete }, { mobile: mobileToDelete }, { _id: req.params.id }]
    });

    res.json({ message: 'User deleted successfully' });
});

// @desc    Get all enquiries
// @route   GET /api/mobile-user-enquiries
// @access  Private (Branch/Admin)
const getEnquiries = asyncHandler(async (req, res) => {
    const enquiries = await MobileUserEnquiry.find({}).sort({ createdAt: -1 });

    const enrichedEnquiries = await Promise.all(enquiries.map(async (e) => {
        const eObj = e.toObject();
        // Look up customer details in 'mobileusers' shipment collection using reference user ID or customer name
        const customerShipment = await MobileShipment.findOne({
            $or: [
                { _id: e.user },
                { customer: e.user },
                { customerName: e.name }
            ]
        });

        if (customerShipment) {
            eObj.mobile = customerShipment.mobileNumber || e.mobile || 'N/A';
            eObj.email = customerShipment.email || e.email || (customerShipment.customerName ? `${customerShipment.customerName.toLowerCase().replace(/\s/g, '')}@example.com` : 'N/A');
            eObj.name = customerShipment.customerName || e.name;
        } else {
            eObj.mobile = e.mobile || 'N/A';
            eObj.email = e.email || 'N/A';
        }
        return eObj;
    }));

    res.json({ enquiries: enrichedEnquiries });
});

// @desc    Update enquiry status and response
// @route   PUT /api/mobile-user-enquiries/:id
// @access  Private (Branch/Admin)
const updateEnquiry = asyncHandler(async (req, res) => {
    const { status, adminResponse, name, mobile, subject, message, enquiryType } = req.body;
    const enquiry = await MobileUserEnquiry.findById(req.params.id);

    if (!enquiry) {
        res.status(404);
        throw new Error('Enquiry not found');
    }

    if (status !== undefined) enquiry.status = status;
    if (adminResponse !== undefined) enquiry.adminResponse = adminResponse;
    if (name !== undefined) enquiry.name = name;
    if (mobile !== undefined) enquiry.mobile = mobile;
    if (subject !== undefined) enquiry.subject = subject;
    if (message !== undefined) enquiry.message = message;
    if (enquiryType !== undefined) enquiry.enquiryType = enquiryType;

    await enquiry.save();

    res.json(enquiry);
});

// @desc    Delete an enquiry
// @route   DELETE /api/mobile-user-enquiries/:id
// @access  Private (Branch/Admin)
const deleteEnquiry = asyncHandler(async (req, res) => {
    const enquiry = await MobileUserEnquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) {
        res.status(404);
        throw new Error('Enquiry not found');
    }
    res.json({ message: 'Enquiry deleted successfully' });
});

// @desc    Get all complaints
// @route   GET /api/mobile-user-complaints
// @access  Private (Branch/Admin)
const getComplaints = asyncHandler(async (req, res) => {
    const complaints = await MobileUserComplaint.find({}).sort({ createdAt: -1 });

    const enrichedComplaints = await Promise.all(complaints.map(async (c) => {
        const cObj = c.toObject();
        // Look up customer details in 'mobileusers' shipment collection using reference user ID or customer name
        const customerShipment = await MobileShipment.findOne({
            $or: [
                { _id: c.user },
                { customer: c.user },
                { customerName: c.name }
            ]
        });

        if (customerShipment) {
            cObj.contactMobile = customerShipment.mobileNumber || c.contactMobile || 'N/A';
            cObj.contactEmail = customerShipment.email || c.contactEmail || (customerShipment.customerName ? `${customerShipment.customerName.toLowerCase().replace(/\s/g, '')}@example.com` : 'N/A');
            cObj.contactName = customerShipment.customerName || c.contactName || c.name;
        } else {
            cObj.contactMobile = c.contactMobile || 'N/A';
            cObj.contactEmail = c.contactEmail || 'N/A';
            cObj.contactName = c.contactName || c.name || 'N/A';
        }
        return cObj;
    }));

    res.json({ complaints: enrichedComplaints });
});

// @desc    Update complaint status and response
// @route   PUT /api/mobile-user-complaints/:id
// @access  Private (Branch/Admin)
const updateComplaint = asyncHandler(async (req, res) => {
    const { status, adminResponse, contactName, contactMobile, subject, description, priority } = req.body;
    const complaint = await MobileUserComplaint.findById(req.params.id);

    if (!complaint) {
        res.status(404);
        throw new Error('Complaint not found');
    }

    if (status !== undefined) complaint.status = status;
    if (adminResponse !== undefined) complaint.adminResponse = adminResponse;
    if (contactName !== undefined) complaint.contactName = contactName;
    if (contactMobile !== undefined) complaint.contactMobile = contactMobile;
    if (subject !== undefined) complaint.subject = subject;
    if (description !== undefined) complaint.description = description;
    if (priority !== undefined) complaint.priority = priority;

    await complaint.save();

    res.json(complaint);
});

// @desc    Delete a complaint
// @route   DELETE /api/mobile-user-complaints/:id
// @access  Private (Branch/Admin)
const deleteComplaint = asyncHandler(async (req, res) => {
    const complaint = await MobileUserComplaint.findByIdAndDelete(req.params.id);
    if (!complaint) {
        res.status(404);
        throw new Error('Complaint not found');
    }
    res.json({ message: 'Complaint deleted successfully' });
});

const updateMobileShipment = asyncHandler(async (req, res) => {
    const mongoose = require('mongoose');
    const query = {};
    if (mongoose.isValidObjectId(req.params.id)) {
        query.$or = [
            { _id: req.params.id },
            { trackingId: req.params.id },
            { customer: req.params.id },
            { parcelRequestId: req.params.id }
        ];
    } else {
        query.trackingId = req.params.id;
    }

    const shipment = await MobileShipment.findOne(query);

    if (!shipment) {
        res.status(404);
        throw new Error('Shipment not found');
    }

    const {
        currentStatus,
        currentLocation,
        currentBranch,
        remarks,
        expectedDeliveryDate,
        assignedStaff,
        transportType,
        weight,
        quantity,
        parcelType,
        customerName,
        mobileNumber,
        pickupCity,
        deliveryCity,
        pickupAddress,
        deliveryAddress
    } = req.body;

    const oldStatus = shipment.currentStatus;

    if (currentStatus !== undefined) shipment.currentStatus = currentStatus;
    if (currentLocation !== undefined) shipment.currentLocation = currentLocation;
    if (currentBranch !== undefined) shipment.currentBranch = currentBranch;
    if (remarks !== undefined) shipment.remarks = remarks;
    if (expectedDeliveryDate !== undefined) shipment.expectedDeliveryDate = expectedDeliveryDate;
    if (assignedStaff !== undefined) shipment.assignedStaff = assignedStaff;
    if (transportType !== undefined) shipment.transportType = transportType;
    if (weight !== undefined) shipment.weight = weight;
    if (quantity !== undefined) shipment.quantity = quantity;
    if (parcelType !== undefined) shipment.parcelType = parcelType;
    if (customerName !== undefined) shipment.customerName = customerName;
    if (mobileNumber !== undefined) shipment.mobileNumber = mobileNumber;
    if (pickupCity !== undefined) shipment.pickupCity = pickupCity;
    if (deliveryCity !== undefined) shipment.deliveryCity = deliveryCity;
    if (pickupAddress !== undefined) shipment.pickupAddress = pickupAddress;
    if (deliveryAddress !== undefined) shipment.deliveryAddress = deliveryAddress;

    // If status changed, push a new checkpoint to trackingHistory
    if (currentStatus !== undefined && currentStatus !== oldStatus) {
        if (!shipment.trackingHistory) {
            shipment.trackingHistory = [];
        }
        shipment.trackingHistory.push({
            status: currentStatus,
            location: currentLocation || shipment.currentLocation || 'Branch Hub',
            branchName: currentBranch || shipment.currentBranch || req.user.name,
            remark: remarks || `Shipment status updated to ${currentStatus}`,
            updatedBy: req.user.name,
            dateTime: new Date()
        });
    }

    await shipment.save();

    res.json(shipment);
});

// @desc    Get mobile user shipment details by ID
// @route   GET /api/mobile-users/shipments/:id
// @access  Private (Branch/Admin)
const getMobileShipmentById = asyncHandler(async (req, res) => {
    const mongoose = require('mongoose');
    const query = {};
    if (mongoose.isValidObjectId(req.params.id)) {
        query.$or = [
            { _id: req.params.id },
            { trackingId: req.params.id },
            { customer: req.params.id },
            { parcelRequestId: req.params.id }
        ];
    } else {
        query.$or = [{ trackingId: req.params.id }, { parcelRequestId: req.params.id }];
    }

    const shipment = await MobileShipment.findOne(query);

    if (!shipment) {
        res.status(404);
        throw new Error('Shipment not found');
    }

    res.json(shipment);
});

// @desc    Delete a mobile shipment completely
// @route   DELETE /api/mobile-users/shipments/:id
// @access  Private (Branch/Admin)
const deleteMobileShipment = asyncHandler(async (req, res) => {
    const mongoose = require('mongoose');
    const query = {};
    if (mongoose.isValidObjectId(req.params.id)) {
        query.$or = [
            { _id: req.params.id },
            { trackingId: req.params.id },
            { parcelRequestId: req.params.id }
        ];
    } else {
        query.$or = [{ trackingId: req.params.id }, { parcelRequestId: req.params.id }];
    }

    const shipment = await MobileShipment.findOneAndDelete(query);
    if (!shipment) {
        res.status(404);
        throw new Error('Shipment not found');
    }

    res.json({ message: 'Shipment deleted successfully' });
});

module.exports = {
    getMobileUsers,
    updateMobileUser,
    deleteMobileUser,
    getEnquiries,
    updateEnquiry,
    deleteEnquiry,
    getComplaints,
    updateComplaint,
    deleteComplaint,
    updateMobileShipment,
    getMobileShipmentById,
    deleteMobileShipment
};
