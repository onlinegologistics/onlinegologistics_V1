const express = require('express');
const router = express.Router();
const ParcelRecord = require('../models/ParcelRecord');
const { protect } = require('../middleware/authMiddleware');

// @desc    Download CSV of parcel records (MUST be before /:id routes)
// @route   GET /api/parcel-records/download/csv
// @access  Private (branch, admin)
router.get('/download/csv', protect, async (req, res) => {
    try {
        if (!['branch', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const filter = {};
        if (req.user.role === 'branch') {
            filter.createdBy = req.user._id;
        }
        if (req.query.clientType) filter.clientType = req.query.clientType;
        if (req.query.from && req.query.to) {
            filter.date = { $gte: new Date(req.query.from), $lte: new Date(req.query.to + 'T23:59:59') };
        }

        const records = await ParcelRecord.find(filter)
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        const headers = [
            'Date', 'Client Type', 'Client Name', 'Mobile', 'Company', 'From', 'To',
            'Parcels', 'Weight', 'Description', 'Type', 'Freight', 'Other Charges',
            'Total', 'Payment', 'Status', 'Remarks', 'Created By'
        ];
        const csvRows = [headers.join(',')];

        records.forEach(r => {
            const row = [
                new Date(r.date).toLocaleDateString('en-IN'),
                r.clientType,
                `"${(r.clientName || '').replace(/"/g, '""')}"`,
                r.mobile || '',
                `"${(r.company || '').replace(/"/g, '""')}"`,
                `"${(r.fromCity || '').replace(/"/g, '""')}"`,
                `"${(r.toCity || '').replace(/"/g, '""')}"`,
                r.noOfParcels || 0,
                r.weight || '',
                `"${(r.description || '').replace(/"/g, '""')}"`,
                r.parcelType || '',
                r.freight || 0,
                r.otherCharges || 0,
                r.totalAmount || 0,
                r.paymentMode || '',
                r.status || '',
                `"${(r.remarks || '').replace(/"/g, '""')}"`,
                r.createdBy?.name || '',
            ];
            csvRows.push(row.join(','));
        });

        const csv = csvRows.join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=parcel_records.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add a parcel record
// @route   POST /api/parcel-records
router.post('/', protect, async (req, res) => {
    try {
        if (!['branch', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const record = await ParcelRecord.create({
            ...req.body,
            createdBy: req.user._id,
        });
        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all parcel records (branch sees own, admin sees all)
// @route   GET /api/parcel-records
router.get('/', protect, async (req, res) => {
    try {
        if (!['branch', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const filter = {};
        if (req.user.role === 'branch') {
            filter.createdBy = req.user._id;
        }
        if (req.query.clientType) filter.clientType = req.query.clientType;
        if (req.query.status) filter.status = req.query.status;
        if (req.query.from && req.query.to) {
            filter.date = { $gte: new Date(req.query.from), $lte: new Date(req.query.to + 'T23:59:59') };
        }

        const records = await ParcelRecord.find(filter)
            .populate('createdBy', 'name username')
            .sort({ createdAt: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update a parcel record
router.put('/:id', protect, async (req, res) => {
    try {
        if (!['branch', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const record = await ParcelRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!record) return res.status(404).json({ message: 'Record not found' });
        res.json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a parcel record (admin only)
router.delete('/:id', protect, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admin can delete' });
        }
        const record = await ParcelRecord.findByIdAndDelete(req.params.id);
        if (!record) return res.status(404).json({ message: 'Record not found' });
        res.json({ message: 'Record deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
