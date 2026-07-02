const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { startWhatsApp } = require('./services/whatsappService');

dotenv.config();

connectDB();

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (
            allowedOrigins.indexOf(origin) !== -1 || 
            process.env.NODE_ENV === 'development' ||
            origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:')
        ) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

// API Logger Middleware
app.use((req, res, next) => {
    console.log(`\n[API LOGGER] ${req.method} ${req.originalUrl}`);
    console.log(`[STATUS] Pending...`);
    if (req.body && Object.keys(req.body).length) console.log(`[BODY]`, req.body);
    if (req.query && Object.keys(req.query).length) console.log(`[QUERY]`, req.query);
    if (req.params && Object.keys(req.params).length) console.log(`[PARAMS]`, req.params);
    
    // Override end to capture status code
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        res.end = originalEnd;
        res.end(chunk, encoding);
        console.log(`[API LOGGER] ${req.method} ${req.originalUrl} - Completed with status: ${res.statusCode}`);
    };
    next();
});
app.get('/', (req, res) => {
    res.send('Luggage Billing API is running');
});

// Auth routes
app.use('/api/auth', require('./routes/authRoutes'));

// Customer routes - ADD THIS
app.use('/api/customers', require('./routes/customer'));

// Agent routes
app.use('/api/agents', require('./routes/agentRoutes'));

// Luggage routes
app.use('/api/luggage', require('./routes/luggageRoutes'));

// Parcel request routes
app.use('/api/parcel-requests', require('./routes/parcelRequestRoutes'));

// Complaint routes
app.use('/api/complaints', require('./routes/complaintRoutes'));

// Enquiry routes
app.use('/api/enquiries', require('./routes/enquiryRoutes'));

// Credit office routes
app.use('/api/credit-offices', require('./routes/creditOfficeRoutes'));

// Pricing routes
app.use('/api/pricing', require('./routes/pricingRoutes'));

// Agent Parcel Request routes
app.use('/api/agent-parcels', require('./routes/agentParcelRoutes'));

// Parcel Record routes (Add Record feature)
app.use('/api/parcel-records', require('./routes/parcelRecordRoutes'));

// User management routes - ADD THIS
app.use('/api/users', require('./routes/userRoutes'));

// WhatsApp routes
app.use('/api/whatsapp', require('./routes/whatsappRoutes'));

// Mobile Users routes
app.use('/api', require('./routes/branchMobileUsersRoutes'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
    res.status(statusCode);
    res.json({
        message: err.message || 'Something went wrong',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    startWhatsApp().catch((error) => {
        console.error('Unable to start WhatsApp:', error.message);
    });
});
