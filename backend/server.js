const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Luggage Billing API is running');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/luggage', require('./routes/luggageRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/enquiries', require('./routes/enquiryRoutes'));
app.use('/api/credit-offices', require('./routes/creditOfficeRoutes'));
app.use('/api/pricing', require('./routes/pricingRoutes'));
app.use('/api/agents', require('./routes/agentRoutes'));
app.use('/api/parcel-requests', require('./routes/parcelRequestRoutes'));


// Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
