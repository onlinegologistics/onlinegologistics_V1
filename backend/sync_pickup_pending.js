const mongoose = require('mongoose');
require('dotenv').config({ path: 'e:/OnlineGoLogistics_WebApp/onlinegologistics_V1/backend/.env' });

async function syncPickupPending() {
    await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME || 'luggage_billing' });
    console.log('Connected to DB');

    const prCol = mongoose.connection.db.collection('parcelrequests');
    const muCol = mongoose.connection.db.collection('mobileusers');

    // 1. Sync parcelrequests:
    // Update documents where status is a real lifecycle status (not Pending), make sure currentStatus matches status
    const lifecycleStatuses = ['Picked Up', 'Delivered', 'Cancelled', 'In Transit', 'Destination Arrived', 'Accepted', 'Approved', 'At Branch', 'Out for Delivery'];
    for (const st of lifecycleStatuses) {
        const res = await prCol.updateMany(
            { status: st, currentStatus: { $ne: st } },
            { $set: { currentStatus: st } }
        );
        if (res.modifiedCount > 0) {
            console.log(`Updated ${res.modifiedCount} PRs with status '${st}' to have currentStatus '${st}'`);
        }
    }

    // Update remaining 'Pending' PRs to 'Pickup Pending'
    const pendingPRsRes = await prCol.updateMany(
        { $or: [{ status: 'Pending' }, { currentStatus: 'Pending' }] },
        { $set: { status: 'Pickup Pending', currentStatus: 'Pickup Pending' } }
    );
    console.log(`Updated ${pendingPRsRes.modifiedCount} PRs from Pending to Pickup Pending`);

    // 2. Sync mobileusers shipments array
    const users = await muCol.find({}).toArray();
    let updatedUsersCount = 0;

    for (const u of users) {
        let modified = false;
        if (Array.isArray(u.shipments)) {
            for (const s of u.shipments) {
                // Find matching PR if any
                const pr = await prCol.findOne({
                    $or: [
                        { trackingId: s.trackingId },
                        { _id: s.parcelRequestId }
                    ]
                });

                let targetStatus = 'Pickup Pending';
                if (pr && pr.status && pr.status !== 'Pending') {
                    targetStatus = pr.status;
                } else if (s.status && s.status !== 'Pending') {
                    targetStatus = s.status;
                } else if (s.currentStatus && s.currentStatus !== 'Pending') {
                    targetStatus = s.currentStatus;
                } else if (s.currentShipmentStatus && s.currentShipmentStatus !== 'Pending') {
                    targetStatus = s.currentShipmentStatus;
                }

                if (s.currentStatus !== targetStatus || s.currentShipmentStatus !== targetStatus || s.status !== targetStatus) {
                    s.currentStatus = targetStatus;
                    s.currentShipmentStatus = targetStatus;
                    s.status = targetStatus;
                    modified = true;
                }
            }
        }

        if (u.currentStatus === 'Pending') {
            u.currentStatus = 'Pickup Pending';
            modified = true;
        }

        if (modified) {
            await muCol.updateOne(
                { _id: u._id },
                {
                    $set: {
                        shipments: u.shipments,
                        currentStatus: u.currentStatus || 'Pickup Pending'
                    }
                }
            );
            updatedUsersCount++;
        }
    }

    console.log(`Updated ${updatedUsersCount} mobile users with cleaned shipment statuses`);
    await mongoose.disconnect();
    console.log('Finished sync');
}

syncPickupPending().catch(err => {
    console.error(err);
    process.exit(1);
});
