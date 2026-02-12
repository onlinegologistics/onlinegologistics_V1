const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const importData = async () => {
    try {
        await connectDB();

        // Check if admin exists
        const adminExists = await User.findOne({ username: 'admin' });

        if (!adminExists) {
            const adminUser = {
                name: 'Admin User',
                username: 'admin',
                password: 'password123',
                role: 'admin',
                isActive: true,
            };
            await User.create(adminUser);
            console.log('Admin User Created: admin / password123');
        } else {
            console.log('Admin User already exists');
        }

        // Check if regular user exists
        const userExists = await User.findOne({ username: 'user' });

        if (!userExists) {
            const regularUser = {
                name: 'Staff User',
                username: 'user',
                password: 'password123',
                role: 'user',
                isActive: true,
            };
            await User.create(regularUser);
            console.log('Regular User Created: user / password123');
        } else {
            console.log('Regular User already exists');
        }

        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
