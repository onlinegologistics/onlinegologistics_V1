import React from 'react';
import { useAuth } from '../context/AuthContext';
import SuperAdminDashboard from './SuperAdminDashboard';
import AdminDashboard from './AdminDashboard';
import AgentDashboard from './AgentDashboard';
import CustomerDashboard from './CustomerDashboard';

const Dashboard = () => {
    const { user } = useAuth();

    if (!user) {
        return <div className="flex items-center justify-center h-64">Loading...</div>;
    }

    switch (user.role) {
        case 'admin':
            return <SuperAdminDashboard />;
        case 'branch':
            return <AdminDashboard />;
        case 'agent':
            return <AgentDashboard />;
        case 'customer':
            return <CustomerDashboard />;
        default:
            return <div className="flex items-center justify-center h-64 text-red-500">Unauthorized Access</div>;
    }
};

export default Dashboard;