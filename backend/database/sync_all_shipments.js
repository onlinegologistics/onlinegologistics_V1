require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const ParcelRequest = require('../models/ParcelRequest');
const MobileUser = require('../models/MobileUser');

const createTrackingId = () => `TRK${Math.random().toString(36).slice(2, 10).toUpperCase()}${Date.now().toString(36).slice(-4).toUpperCase()}`;

async function syncAllShipments() {
    try {
        const dbName = process.env.DB_NAME || 'luggage_billing';
        console.log(`Connecting to database: ${dbName}...`);
        await mongoose.connect(process.env.MONGO_URI, { dbName });
        console.log('Connected to MongoDB successfully.');

        // 1. Process all ParcelRequests: ensure trackingId and statuses
        const allParcels = await ParcelRequest.find({});
        console.log(`Found ${allParcels.length} parcel requests to process.`);

        let updatedParcelsCount = 0;
        for (const pr of allParcels) {
            let modified = false;

            // Check if customer is a MobileUser
            const isMobile = await MobileUser.findById(pr.customer);
            if (isMobile) {
                if (pr.customerModel !== 'MobileUser') {
                    pr.customerModel = 'MobileUser';
                    modified = true;
                }
            }

            // Ensure trackingId
            if (!pr.trackingId || String(pr.trackingId).trim() === '') {
                // If the mobile user doc already has a trackingId matching this parcelRequestId, use it
                if (isMobile && isMobile.parcelRequestId && isMobile.parcelRequestId.toString() === pr._id.toString() && isMobile.trackingId) {
                    pr.trackingId = isMobile.trackingId;
                } else {
                    pr.trackingId = createTrackingId();
                }
                modified = true;
            }

            // Ensure currentStatus
            if (!pr.currentStatus) {
                pr.currentStatus = pr.status || 'Pending';
                modified = true;
            }

            // Ensure currentBranch & currentLocation
            if (!pr.currentBranch) {
                pr.currentBranch = 'Central Hub';
                modified = true;
            }
            if (!pr.currentLocation) {
                pr.currentLocation = pr.pickupAddress || pr.pickupCity || '';
                modified = true;
            }

            // Ensure trackingHistory
            if (!Array.isArray(pr.trackingHistory) || pr.trackingHistory.length === 0) {
                pr.trackingHistory = [{
                    status: pr.currentStatus || pr.status || 'Pending',
                    location: pr.pickupAddress || pr.pickupCity || 'Origin',
                    branchName: pr.currentBranch || 'Central Hub',
                    remark: 'Shipment registered',
                    updatedBy: 'System',
                    dateTime: pr.createdAt || new Date(),
                }];
                modified = true;
            }

            if (modified) {
                await pr.save();
                updatedParcelsCount++;
            }
        }
        console.log(`Updated ${updatedParcelsCount} parcel requests with tracking & status.`);

        // 2. Sync all shipments into MobileUser.shipments
        const allMobileUsers = await MobileUser.find({});
        console.log(`Found ${allMobileUsers.length} mobile users to check for shipments.`);

        let totalSyncedShipments = 0;
        let syncedUsersCount = 0;

        for (const user of allMobileUsers) {
            const userMobiles = [user.mobile, user.mobileNumber].filter(Boolean).map(m => String(m).trim());

            // Query parcel requests by customer ID OR mobile number
            const userParcels = await ParcelRequest.find({
                $or: [
                    { customer: user._id },
                    { mobileNumber: { $in: userMobiles } }
                ]
            }).sort({ createdAt: 1 });

            // Start with existing embedded shipments if any
            const existingShipments = Array.isArray(user.shipments) ? [...user.shipments] : [];

            // Add top-level if deliveryAddress is valid
            if (user.deliveryAddress && user.deliveryAddress.trim() !== '' && user.deliveryAddress !== 'N/A') {
                const topTracking = user.trackingId || (user.parcelRequestId ? user.parcelRequestId.toString() : null) || user._id.toString();
                const exists = existingShipments.some(e => {
                    const eTracking = e.trackingId || (e.parcelRequestId ? e.parcelRequestId.toString() : null) || (e._id ? e._id.toString() : null);
                    return eTracking && topTracking && eTracking === topTracking;
                });
                if (!exists) {
                    existingShipments.push({
                        parcelRequestId: user.parcelRequestId || user._id,
                        trackingId: user.trackingId || createTrackingId(),
                        pickupAddress: user.pickupAddress || user.address || 'Pune',
                        deliveryAddress: user.deliveryAddress,
                        packageDescription: user.packageDescription || user.parcelType || 'Package',
                        parcelType: user.parcelType || user.packageDescription || 'Package',
                        weight: user.weight || 0,
                        quantity: user.quantity || 1,
                        remarks: user.remarks || '',
                        pickupCity: user.pickupCity || 'Pune',
                        deliveryCity: user.deliveryCity || 'N/A',
                        transportType: user.transportType || 'STANDARD',
                        expectedDeliveryDate: user.expectedDeliveryDate || null,
                        customerName: user.customerName || user.name || '',
                        mobileNumber: user.mobileNumber || user.mobile || '',
                        currentBranch: user.currentBranch || 'Central Hub',
                        currentLocation: user.currentLocation || user.pickupAddress || '',
                        currentStatus: user.currentStatus || 'Pending',
                        assignedStaff: user.assignedStaff || '',
                        trackingHistory: user.trackingHistory || [],
                        createdAt: user.createdAt || new Date(),
                    });
                }
            }

            // Merge ParcelRequests into shipments
            for (const pr of userParcels) {
                const prTracking = pr.trackingId || pr._id.toString();
                const prId = pr._id.toString();

                const exists = existingShipments.some(e => {
                    const eTracking = e.trackingId || (e.parcelRequestId ? e.parcelRequestId.toString() : null) || (e._id ? e._id.toString() : null);
                    const eParcelId = e.parcelRequestId ? e.parcelRequestId.toString() : (e._id ? e._id.toString() : null);
                    return (eTracking && prTracking && eTracking === prTracking) || (eParcelId && prId && eParcelId === prId);
                });

                if (!exists) {
                    existingShipments.push({
                        parcelRequestId: pr._id,
                        trackingId: pr.trackingId,
                        pickupAddress: pr.pickupAddress,
                        deliveryAddress: pr.deliveryAddress,
                        packageDescription: pr.packageDescription || pr.parcelType || 'Package',
                        parcelType: pr.parcelType || pr.packageDescription || 'Package',
                        weight: pr.weight || 0,
                        quantity: pr.quantity || 1,
                        remarks: pr.remarks || '',
                        pickupCity: pr.pickupCity || 'Pune',
                        deliveryCity: pr.deliveryCity || 'N/A',
                        deliveryLocation: pr.deliveryLocation || null,
                        transportType: pr.transportType || 'STANDARD',
                        expectedDeliveryDate: pr.expectedDeliveryDate || null,
                        customerName: pr.customerName || user.name || '',
                        mobileNumber: pr.mobileNumber || user.mobile || '',
                        currentBranch: pr.currentBranch || 'Central Hub',
                        currentLocation: pr.currentLocation || pr.pickupAddress || '',
                        currentStatus: pr.currentStatus || pr.status || 'Pending',
                        assignedStaff: pr.assignedStaff || '',
                        trackingHistory: pr.trackingHistory || [],
                        createdAt: pr.createdAt || new Date(),
                    });
                }
            }

            if (existingShipments.length > 0) {
                // Sort ascending by createdAt so latest is last in array
                existingShipments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                const latest = existingShipments[existingShipments.length - 1];

                user.shipments = existingShipments;
                user.parcelRequestId = latest.parcelRequestId || latest._id;
                user.trackingId = latest.trackingId;
                user.currentStatus = latest.currentStatus || 'Pending';
                user.pickupAddress = latest.pickupAddress;
                user.deliveryAddress = latest.deliveryAddress;
                user.pickupCity = latest.pickupCity;
                user.deliveryCity = latest.deliveryCity;
                user.weight = latest.weight;
                user.quantity = latest.quantity;
                user.parcelType = latest.parcelType;
                user.packageDescription = latest.packageDescription;

                await user.save();
                syncedUsersCount++;
                totalSyncedShipments += existingShipments.length;
                console.log(`User "${user.name}" (${user.mobile}): Synced ${existingShipments.length} shipments.`);
            }
        }

        console.log(`\n=============================================`);
        console.log(`Successfully synced ${totalSyncedShipments} shipments across ${syncedUsersCount} mobile users!`);
        console.log(`=============================================\n`);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

syncAllShipments();
