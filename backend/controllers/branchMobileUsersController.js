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

    // Also fetch all parcel requests from 'parcelrequests' collection
    const allParcels = await ParcelRequest.find({}).sort({ createdAt: -1 }).lean();

    const userProfiles = new Map();
    const userShipments = new Map();

    // Separate records into user profiles and extract all embedded/top-level shipments
    allRecords.forEach(record => {
        const mobile = String(record.mobileNumber || record.mobile || (record._id ? record._id.toString() : 'N/A')).trim();
        if (mobile === 'N/A') return;

        // Store or update user profile info
        if (!userProfiles.has(mobile)) {
            userProfiles.set(mobile, record);
        } else {
            const existing = userProfiles.get(mobile);
            if ((!existing.email && record.email) || (!existing.address && record.address)) {
                userProfiles.set(mobile, { ...existing, ...record });
            }
        }

        // Initialize user shipment list if not present
        if (!userShipments.has(mobile)) {
            userShipments.set(mobile, []);
        }

        const existingShipments = userShipments.get(mobile);

        // 1. If record.shipments contains an array of shipment subdocuments
        if (Array.isArray(record.shipments) && record.shipments.length > 0) {
            record.shipments.forEach(s => {
                const sTracking = s.trackingId || (s.parcelRequestId ? s.parcelRequestId.toString() : null) || (s._id ? s._id.toString() : null);
                const isDup = existingShipments.some(e => {
                    const eTracking = e.trackingId || (e.parcelRequestId ? e.parcelRequestId.toString() : null) || (e._id ? e._id.toString() : null);
                    return eTracking && sTracking && eTracking === sTracking;
                });
                if (!isDup) {
                    existingShipments.push({ ...s, parentUserId: record._id });
                }
            });
        }

        // 2. If record has top-level shipment details, and it's not already in existingShipments
        if (record.deliveryAddress && record.deliveryAddress.trim() !== '' && record.deliveryAddress !== 'N/A') {
            const rTracking = record.trackingId || (record.parcelRequestId ? record.parcelRequestId.toString() : null) || (record._id ? record._id.toString() : null);
            const isDup = existingShipments.some(e => {
                const eTracking = e.trackingId || (e.parcelRequestId ? e.parcelRequestId.toString() : null) || (e._id ? e._id.toString() : null);
                return eTracking && rTracking && eTracking === rTracking;
            });
            if (!isDup) {
                existingShipments.push({ ...record, parentUserId: record._id });
            }
        }
    });

    // 3. Merge all ParcelRequest documents into the matching user's shipments
    allParcels.forEach(pr => {
        let matchedMobile = null;
        const prCustId = pr.customer ? pr.customer.toString() : null;
        const prMobile = pr.mobileNumber ? String(pr.mobileNumber).trim() : null;

        for (const [mobile, profile] of userProfiles.entries()) {
            const pId = profile._id ? profile._id.toString() : null;
            const pMobile = String(profile.mobile || profile.mobileNumber || '').trim();
            if ((prCustId && pId && prCustId === pId) || (prMobile && pMobile && prMobile === pMobile)) {
                matchedMobile = mobile;
                break;
            }
        }

        if (matchedMobile) {
            if (!userShipments.has(matchedMobile)) {
                userShipments.set(matchedMobile, []);
            }
            const existing = userShipments.get(matchedMobile);
            const prTracking = pr.trackingId || (pr._id ? pr._id.toString() : null);
            const prId = pr._id ? pr._id.toString() : null;

            // Determine accurate status from pr
            let accurateStatus = 'Pickup Pending';
            if (pr.status && pr.status !== 'Pending') {
                accurateStatus = pr.status;
            } else if (pr.currentStatus && pr.currentStatus !== 'Pending') {
                accurateStatus = pr.currentStatus;
            } else if (Array.isArray(pr.trackingHistory) && pr.trackingHistory.length > 0) {
                const lastH = pr.trackingHistory[pr.trackingHistory.length - 1];
                if (lastH && lastH.status && lastH.status !== 'Pending') {
                    accurateStatus = lastH.status;
                }
            }

            const existingIndex = existing.findIndex(e => {
                const eTracking = e.trackingId || (e.parcelRequestId ? e.parcelRequestId.toString() : null) || (e._id ? e._id.toString() : null);
                const eParcelId = e.parcelRequestId ? e.parcelRequestId.toString() : (e._id ? e._id.toString() : null);
                return (eTracking && prTracking && eTracking === prTracking) || (eParcelId && prId && eParcelId === prId);
            });

            if (existingIndex === -1) {
                existing.push({
                    ...pr,
                    parcelRequestId: pr._id,
                    currentStatus: accurateStatus,
                    currentShipmentStatus: accurateStatus,
                    status: accurateStatus,
                    createdAt: pr.createdAt || new Date(),
                    parentUserId: userProfiles.get(matchedMobile)?._id
                });
            } else {
                const e = existing[existingIndex];
                if (accurateStatus !== 'Pickup Pending' || !e.currentStatus || e.currentStatus === 'Pending') {
                    e.currentStatus = accurateStatus;
                    e.currentShipmentStatus = accurateStatus;
                    e.status = accurateStatus;
                }
                if (pr.createdAt) {
                    e.createdAt = pr.createdAt;
                }
            }
        }
    });

    const uniqueUsersMap = new Map();
    const allMobiles = new Set([...userProfiles.keys(), ...userShipments.keys()]);

    allMobiles.forEach(mobile => {
        const profile = userProfiles.get(mobile) || {};
        const rawShipments = userShipments.get(mobile) || [];

        // Find fallback address from shipments if profile lacks it
        let fallbackAddress = 'N/A';
        for (const s of rawShipments) {
            if (s.pickupAddress && s.pickupAddress.trim() !== '' && s.pickupAddress !== 'N/A') {
                fallbackAddress = s.pickupAddress;
                break;
            } else if (s.deliveryAddress && s.deliveryAddress.trim() !== '' && s.deliveryAddress !== 'N/A') {
                fallbackAddress = s.deliveryAddress;
                break;
            }
        }

        // Map shipments with full details
        const mappedShipments = rawShipments.map(s => {
            const sId = s._id ? s._id.toString() : (s.trackingId || 'N/A');
            const trackingId = s.trackingId || s.lrNumber || (s.parcelRequestId ? s.parcelRequestId.toString() : sId);

            // Resolve unambiguous, accurate status (never generic 'Pending')
            let finalStatus = 'Pickup Pending';
            if (s.status && s.status !== 'Pending') {
                finalStatus = s.status;
            } else if (s.currentStatus && s.currentStatus !== 'Pending') {
                finalStatus = s.currentStatus;
            } else if (s.currentShipmentStatus && s.currentShipmentStatus !== 'Pending') {
                finalStatus = s.currentShipmentStatus;
            } else if (Array.isArray(s.trackingHistory) && s.trackingHistory.length > 0) {
                const lastHist = s.trackingHistory[s.trackingHistory.length - 1];
                if (lastHist && lastHist.status && lastHist.status !== 'Pending') {
                    finalStatus = lastHist.status;
                }
            }

            // Accurate creation date: NEVER fallback to user account registration date
            let accurateCreatedAt = s.createdAt;
            if (s.trackingHistory && s.trackingHistory.length > 0 && s.trackingHistory[0].dateTime) {
                if (!accurateCreatedAt || String(accurateCreatedAt) === String(profile.createdAt)) {
                    accurateCreatedAt = s.trackingHistory[0].dateTime;
                }
            }
            if (!accurateCreatedAt) {
                accurateCreatedAt = new Date();
            }

            return {
                _id: sId,
                trackingId: trackingId,
                lrNumber: s.lrNumber || s.trackingId || (s.parcelRequestId ? s.parcelRequestId.toString() : sId),
                customerName: s.customerName || profile.name || profile.customerName || 'N/A',
                mobileNumber: s.mobileNumber || profile.mobile || profile.mobileNumber || mobile,
                email: profile.email || 'N/A',
                pickupCity: s.pickupCity || profile.address || 'Pune',
                pickupAddress: s.pickupAddress || profile.address || profile.pickupAddress || 'N/A',
                deliveryCity: s.deliveryCity || 'N/A',
                deliveryAddress: s.deliveryAddress || 'N/A',
                parcelType: s.parcelType || s.packageDescription || 'Package',
                transportType: s.transportType || 'STANDARD',
                weight: s.weight || 0,
                quantity: s.quantity || 1,
                remarks: s.remarks || '',
                expectedDeliveryDate: s.expectedDeliveryDate || null,
                currentShipmentStatus: finalStatus,
                currentStatus: finalStatus,
                status: finalStatus,
                currentBranch: s.currentBranch || 'Central Hub',
                currentLocation: s.currentLocation || s.pickupAddress || 'N/A',
                trackingHistory: s.trackingHistory || [],
                createdAt: accurateCreatedAt,
                userId: profile._id ? profile._id.toString() : (s.parentUserId ? s.parentUserId.toString() : null)
            };
        });

        // Sort user's shipments newest first
        mappedShipments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const latestS = mappedShipments.length > 0 ? mappedShipments[0] : null;

        uniqueUsersMap.set(mobile, {
            _id: profile._id || (latestS ? latestS.userId || latestS._id : null),
            name: profile.name || profile.customerName || (latestS ? (latestS.customerName || latestS.name) : 'N/A') || 'N/A',
            username: profile.username || profile.email || '',
            email: profile.email || (latestS ? latestS.email : null) || 'N/A',
            mobile: mobile,
            altMobile: profile.altMobile || '',
            address: (profile.address && profile.address !== 'N/A') ? profile.address : 
                     (profile.pickupAddress && profile.pickupAddress !== 'N/A') ? profile.pickupAddress : fallbackAddress,
            isActive: profile.isActive !== undefined ? profile.isActive : true,
            createdAt: profile.createdAt || (latestS ? latestS.createdAt : new Date()),
            shipments: mappedShipments,
            latestShipment: latestS
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

// @desc    Update mobile user shipment details and status
// @route   PUT /api/mobile-users/shipments/:id
// @access  Private (Branch/Admin)
const updateMobileShipment = asyncHandler(async (req, res) => {
    const mongoose = require('mongoose');
    const id = req.params.id;

    const queryConditions = [
        { 'shipments.trackingId': id },
        { 'shipments.lrNumber': id },
        { trackingId: id },
        { lrNumber: id }
    ];

    if (mongoose.isValidObjectId(id)) {
        const objId = new mongoose.Types.ObjectId(id);
        queryConditions.push({ 'shipments._id': objId });
        queryConditions.push({ 'shipments.parcelRequestId': objId });
        queryConditions.push({ _id: objId });
        queryConditions.push({ parcelRequestId: objId });
        queryConditions.push({ customer: objId });
    } else {
        queryConditions.push({ 'shipments.parcelRequestId': id });
        queryConditions.push({ parcelRequestId: id });
    }

    let userDoc = await MobileShipment.findOne({ $or: queryConditions });

    // Also look up ParcelRequest
    const prQuery = [
        { trackingId: id },
        { lrNumber: id }
    ];
    if (mongoose.isValidObjectId(id)) {
        const objId = new mongoose.Types.ObjectId(id);
        prQuery.push({ _id: objId });
        prQuery.push({ parcelRequestId: objId });
    }
    const prDoc = await ParcelRequest.findOne({ $or: prQuery });

    if (!userDoc && !prDoc) {
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

    // 1. If found in ParcelRequest, update ParcelRequest document
    if (prDoc) {
        if (currentStatus !== undefined) {
            prDoc.status = currentStatus;
            prDoc.currentStatus = currentStatus;
        }
        if (currentLocation !== undefined) prDoc.currentLocation = currentLocation;
        if (currentBranch !== undefined) prDoc.currentBranch = currentBranch;
        if (remarks !== undefined) prDoc.remarks = remarks;
        if (expectedDeliveryDate !== undefined) prDoc.expectedDeliveryDate = expectedDeliveryDate;
        if (assignedStaff !== undefined) prDoc.assignedStaff = assignedStaff;
        if (transportType !== undefined) prDoc.transportType = transportType;
        if (weight !== undefined) prDoc.weight = weight;
        if (quantity !== undefined) prDoc.quantity = quantity;
        if (parcelType !== undefined) prDoc.parcelType = parcelType;
        if (customerName !== undefined) prDoc.customerName = customerName;
        if (mobileNumber !== undefined) prDoc.mobileNumber = mobileNumber;
        if (pickupCity !== undefined) prDoc.pickupCity = pickupCity;
        if (deliveryCity !== undefined) prDoc.deliveryCity = deliveryCity;
        if (pickupAddress !== undefined) prDoc.pickupAddress = pickupAddress;
        if (deliveryAddress !== undefined) prDoc.deliveryAddress = deliveryAddress;

        if (currentStatus !== undefined) {
            if (!Array.isArray(prDoc.trackingHistory)) prDoc.trackingHistory = [];
            prDoc.trackingHistory.push({
                status: currentStatus,
                location: currentLocation || prDoc.currentLocation || 'Branch Hub',
                branchName: currentBranch || prDoc.currentBranch || (req.user ? req.user.name : 'Branch Hub'),
                remark: remarks || `Shipment status updated to ${currentStatus}`,
                updatedBy: req.user ? req.user.name : 'Operator',
                dateTime: new Date()
            });
        }
        await prDoc.save();
    }

    // 2. If found in MobileShipment, update MobileShipment document
    if (userDoc) {
        let targetIndex = -1;
        if (userDoc.shipments && Array.isArray(userDoc.shipments)) {
            targetIndex = userDoc.shipments.findIndex(s =>
                (s._id && s._id.toString() === id) ||
                (s.trackingId && s.trackingId === id) ||
                (s.lrNumber && s.lrNumber === id) ||
                (s.parcelRequestId && s.parcelRequestId.toString() === id)
            );
        }

        if (targetIndex !== -1) {
            const target = userDoc.shipments[targetIndex];
            const oldStatus = target.currentStatus || target.currentShipmentStatus;

            if (currentStatus !== undefined) {
                target.currentStatus = currentStatus;
                target.currentShipmentStatus = currentStatus;
            }
            if (currentLocation !== undefined) target.currentLocation = currentLocation;
            if (currentBranch !== undefined) target.currentBranch = currentBranch;
            if (remarks !== undefined) target.remarks = remarks;
            if (expectedDeliveryDate !== undefined) target.expectedDeliveryDate = expectedDeliveryDate;
            if (assignedStaff !== undefined) target.assignedStaff = assignedStaff;
            if (transportType !== undefined) target.transportType = transportType;
            if (weight !== undefined) target.weight = weight;
            if (quantity !== undefined) target.quantity = quantity;
            if (parcelType !== undefined) target.parcelType = parcelType;
            if (customerName !== undefined) target.customerName = customerName;
            if (mobileNumber !== undefined) target.mobileNumber = mobileNumber;
            if (pickupCity !== undefined) target.pickupCity = pickupCity;
            if (deliveryCity !== undefined) target.deliveryCity = deliveryCity;
            if (pickupAddress !== undefined) target.pickupAddress = pickupAddress;
            if (deliveryAddress !== undefined) target.deliveryAddress = deliveryAddress;

            if (currentStatus !== undefined && currentStatus !== oldStatus) {
                if (!target.trackingHistory) target.trackingHistory = [];
                target.trackingHistory.push({
                    status: currentStatus,
                    location: currentLocation || target.currentLocation || 'Branch Hub',
                    branchName: currentBranch || target.currentBranch || (req.user ? req.user.name : 'Branch Hub'),
                    remark: remarks || `Shipment status updated to ${currentStatus}`,
                    updatedBy: req.user ? req.user.name : 'Operator',
                    dateTime: new Date()
                });
            }

            if (userDoc.trackingId === target.trackingId || (target._id && userDoc.trackingId === target._id.toString())) {
                if (currentStatus !== undefined) userDoc.currentStatus = currentStatus;
                if (currentLocation !== undefined) userDoc.currentLocation = currentLocation;
                if (currentBranch !== undefined) userDoc.currentBranch = currentBranch;
            }

            userDoc.markModified('shipments');
            await userDoc.save();

            const responseObj = (typeof target.toObject === 'function') ? target.toObject() : { ...target };
            responseObj.customerName = responseObj.customerName || userDoc.name || userDoc.customerName;
            responseObj.mobileNumber = responseObj.mobileNumber || userDoc.mobile || userDoc.mobileNumber;
            responseObj.currentStatus = target.currentStatus || target.currentShipmentStatus;
            responseObj.currentShipmentStatus = target.currentShipmentStatus || target.currentStatus;
            responseObj.userId = userDoc._id;
            responseObj.customer = userDoc._id;
            return res.json(responseObj);
        }

        // Top-level update
        const oldStatus = userDoc.currentStatus;
        if (currentStatus !== undefined) userDoc.currentStatus = currentStatus;
        if (currentLocation !== undefined) userDoc.currentLocation = currentLocation;
        if (currentBranch !== undefined) userDoc.currentBranch = currentBranch;
        if (remarks !== undefined) userDoc.remarks = remarks;
        if (expectedDeliveryDate !== undefined) userDoc.expectedDeliveryDate = expectedDeliveryDate;
        if (assignedStaff !== undefined) userDoc.assignedStaff = assignedStaff;
        if (transportType !== undefined) userDoc.transportType = transportType;
        if (weight !== undefined) userDoc.weight = weight;
        if (quantity !== undefined) userDoc.quantity = quantity;
        if (parcelType !== undefined) userDoc.parcelType = parcelType;
        if (customerName !== undefined) userDoc.customerName = customerName;
        if (mobileNumber !== undefined) userDoc.mobileNumber = mobileNumber;
        if (pickupCity !== undefined) userDoc.pickupCity = pickupCity;
        if (deliveryCity !== undefined) userDoc.deliveryCity = deliveryCity;
        if (pickupAddress !== undefined) userDoc.pickupAddress = pickupAddress;
        if (deliveryAddress !== undefined) userDoc.deliveryAddress = deliveryAddress;

        if (currentStatus !== undefined && currentStatus !== oldStatus) {
            if (!userDoc.trackingHistory) userDoc.trackingHistory = [];
            userDoc.trackingHistory.push({
                status: currentStatus,
                location: currentLocation || userDoc.currentLocation || 'Branch Hub',
                branchName: currentBranch || userDoc.currentBranch || (req.user ? req.user.name : 'Branch Hub'),
                remark: remarks || `Shipment status updated to ${currentStatus}`,
                updatedBy: req.user ? req.user.name : 'Operator',
                dateTime: new Date()
            });
        }

        await userDoc.save();
        return res.json(userDoc);
    }

    // If only found in ParcelRequest
    res.json(prDoc);
});

// @desc    Get mobile user shipment details by ID
// @route   GET /api/mobile-users/shipments/:id
// @access  Private (Branch/Admin)
const getMobileShipmentById = asyncHandler(async (req, res) => {
    const mongoose = require('mongoose');
    const id = req.params.id;

    // Search for a document in MobileShipment
    const queryConditions = [
        { 'shipments.trackingId': id },
        { 'shipments.lrNumber': id },
        { trackingId: id },
        { lrNumber: id }
    ];

    if (mongoose.isValidObjectId(id)) {
        const objId = new mongoose.Types.ObjectId(id);
        queryConditions.push({ 'shipments._id': objId });
        queryConditions.push({ 'shipments.parcelRequestId': objId });
        queryConditions.push({ _id: objId });
        queryConditions.push({ parcelRequestId: objId });
        queryConditions.push({ customer: objId });
    } else {
        queryConditions.push({ 'shipments.parcelRequestId': id });
        queryConditions.push({ parcelRequestId: id });
    }

    const userDoc = await MobileShipment.findOne({ $or: queryConditions });

    // Look up ParcelRequest for true booking timestamp and full parcel specifications
    const prQuery = [
        { trackingId: id },
        { lrNumber: id }
    ];
    if (mongoose.isValidObjectId(id)) {
        const objId = new mongoose.Types.ObjectId(id);
        prQuery.push({ _id: objId });
    }
    if (userDoc && userDoc.parcelRequestId) {
        if (mongoose.isValidObjectId(userDoc.parcelRequestId)) {
            prQuery.push({ _id: new mongoose.Types.ObjectId(userDoc.parcelRequestId) });
        } else {
            prQuery.push({ _id: userDoc.parcelRequestId });
        }
    }

    const prDoc = await ParcelRequest.findOne({ $or: prQuery }).lean();

    if (userDoc) {
        let shipmentObj = null;

        if (userDoc.shipments && Array.isArray(userDoc.shipments) && userDoc.shipments.length > 0) {
            const found = userDoc.shipments.find(s => 
                (s._id && s._id.toString() === id) ||
                (s.trackingId && s.trackingId === id) ||
                (s.lrNumber && s.lrNumber === id) ||
                (s.parcelRequestId && s.parcelRequestId.toString() === id) ||
                (prDoc && s.parcelRequestId && s.parcelRequestId.toString() === prDoc._id.toString()) ||
                (prDoc && s.trackingId && prDoc.trackingId && s.trackingId === prDoc.trackingId)
            );

            if (found) {
                shipmentObj = (typeof found.toObject === 'function') ? found.toObject() : { ...found };
            }
        }

        if (!shipmentObj) {
            // Top-level shipment in userDoc
            shipmentObj = (typeof userDoc.toObject === 'function') ? userDoc.toObject() : { ...userDoc };
        }

        // Merge true parcel details and accurate booking creation date from prDoc
        if (prDoc) {
            shipmentObj.parcelRequestId = prDoc._id;
            shipmentObj.pickupAddress = prDoc.pickupAddress || shipmentObj.pickupAddress;
            shipmentObj.deliveryAddress = prDoc.deliveryAddress || shipmentObj.deliveryAddress;
            shipmentObj.pickupCity = prDoc.pickupCity || shipmentObj.pickupCity;
            shipmentObj.deliveryCity = prDoc.deliveryCity || shipmentObj.deliveryCity;
            shipmentObj.parcelType = prDoc.parcelType || shipmentObj.parcelType;
            shipmentObj.packageDescription = prDoc.packageDescription || shipmentObj.packageDescription;
            if (prDoc.weight !== undefined) shipmentObj.weight = prDoc.weight;
            if (prDoc.quantity !== undefined) shipmentObj.quantity = prDoc.quantity;
            if (prDoc.transportType) shipmentObj.transportType = prDoc.transportType;
            // TRUE BOOKING TIMESTAMP from when user booked it
            shipmentObj.createdAt = prDoc.createdAt;
        } else {
            // Fallback for createdAt: use first tracking history date if available, never user profile registration date
            if (Array.isArray(shipmentObj.trackingHistory) && shipmentObj.trackingHistory.length > 0 && shipmentObj.trackingHistory[0].dateTime) {
                shipmentObj.createdAt = shipmentObj.trackingHistory[0].dateTime;
            }
        }

        shipmentObj.customerName = shipmentObj.customerName || userDoc.name || userDoc.customerName || 'N/A';
        shipmentObj.mobileNumber = shipmentObj.mobileNumber || userDoc.mobile || userDoc.mobileNumber || 'N/A';
        shipmentObj.email = userDoc.email || 'N/A';
        shipmentObj.userId = userDoc._id;
        shipmentObj.customer = userDoc._id;
        shipmentObj.currentBranch = shipmentObj.currentBranch || userDoc.currentBranch || 'Central Hub';
        shipmentObj.currentLocation = shipmentObj.currentLocation || shipmentObj.pickupAddress || userDoc.currentLocation || 'N/A';

        let finalStatus = 'Pickup Pending';
        if (shipmentObj.status && shipmentObj.status !== 'Pending') {
            finalStatus = shipmentObj.status;
        } else if (shipmentObj.currentStatus && shipmentObj.currentStatus !== 'Pending') {
            finalStatus = shipmentObj.currentStatus;
        } else if (shipmentObj.currentShipmentStatus && shipmentObj.currentShipmentStatus !== 'Pending') {
            finalStatus = shipmentObj.currentShipmentStatus;
        } else if (prDoc && prDoc.status && prDoc.status !== 'Pending') {
            finalStatus = prDoc.status;
        } else if (Array.isArray(shipmentObj.trackingHistory) && shipmentObj.trackingHistory.length > 0) {
            const lastH = shipmentObj.trackingHistory[shipmentObj.trackingHistory.length - 1];
            if (lastH && lastH.status && lastH.status !== 'Pending') {
                finalStatus = lastH.status;
            }
        }
        shipmentObj.currentStatus = finalStatus;
        shipmentObj.currentShipmentStatus = finalStatus;
        shipmentObj.status = finalStatus;
        if (!shipmentObj._id) shipmentObj._id = userDoc._id;
        return res.json(shipmentObj);
    }

    // If only found in ParcelRequest collection
    if (prDoc) {
        let finalStatus = 'Pickup Pending';
        if (prDoc.status && prDoc.status !== 'Pending') {
            finalStatus = prDoc.status;
        } else if (prDoc.currentStatus && prDoc.currentStatus !== 'Pending') {
            finalStatus = prDoc.currentStatus;
        } else if (Array.isArray(prDoc.trackingHistory) && prDoc.trackingHistory.length > 0) {
            const lastH = prDoc.trackingHistory[prDoc.trackingHistory.length - 1];
            if (lastH && lastH.status && lastH.status !== 'Pending') {
                finalStatus = lastH.status;
            }
        }
        prDoc.currentStatus = finalStatus;
        prDoc.currentShipmentStatus = finalStatus;
        prDoc.status = finalStatus;
        return res.json(prDoc);
    }

    res.status(404);
    throw new Error('Shipment not found');
});

// @desc    Delete a mobile shipment completely
// @route   DELETE /api/mobile-users/shipments/:id
// @access  Private (Branch/Admin)
const deleteMobileShipment = asyncHandler(async (req, res) => {
    const mongoose = require('mongoose');
    const id = req.params.id;

    let deletedAny = false;

    // 1. Delete from ParcelRequest collection
    const prDeleteConditions = [
        { trackingId: id },
        { lrNumber: id }
    ];
    if (mongoose.isValidObjectId(id)) {
        prDeleteConditions.push({ _id: new mongoose.Types.ObjectId(id) });
    }
    const prDeleted = await ParcelRequest.deleteMany({ $or: prDeleteConditions });
    if (prDeleted && prDeleted.deletedCount > 0) {
        deletedAny = true;
    }

    // 2. Delete from MobileShipment
    const queryConditions = [
        { 'shipments.trackingId': id },
        { 'shipments.lrNumber': id }
    ];

    if (mongoose.isValidObjectId(id)) {
        const objId = new mongoose.Types.ObjectId(id);
        queryConditions.push({ 'shipments._id': objId });
        queryConditions.push({ 'shipments.parcelRequestId': objId });
    } else {
        queryConditions.push({ 'shipments.parcelRequestId': id });
    }

    const userDoc = await MobileShipment.findOne({ $or: queryConditions });

    if (userDoc && userDoc.shipments && Array.isArray(userDoc.shipments)) {
        const initialCount = userDoc.shipments.length;
        userDoc.shipments = userDoc.shipments.filter(s =>
            (s._id && s._id.toString() !== id) &&
            (s.trackingId !== id) &&
            (s.lrNumber !== id) &&
            (s.parcelRequestId && s.parcelRequestId.toString() !== id)
        );

        if (userDoc.shipments.length < initialCount) {
            userDoc.markModified('shipments');
            await userDoc.save();
            deletedAny = true;
        }
    }

    // Fallback: delete top-level if it has no shipments array
    if (mongoose.isValidObjectId(id)) {
        const deleted = await MobileShipment.findOneAndDelete({
            _id: id,
            $or: [{ shipments: { $exists: false } }, { shipments: { $size: 0 } }]
        });
        if (deleted) {
            deletedAny = true;
        }
    }

    if (deletedAny) {
        return res.json({ message: 'Shipment deleted successfully' });
    }

    res.status(404);
    throw new Error('Shipment not found');
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
