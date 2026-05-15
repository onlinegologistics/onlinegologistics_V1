import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, TrendingUp, AlertCircle, GitBranch, Package, MessageSquare } from 'lucide-react';

const SuperAdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalBranches: 0,
        totalAgents: 0,
        totalCustomers: 0,
        totalParcels: 0,
        totalRevenue: 0,
        totalStaff: 0,
    });
    const [branchStats, setBranchStats] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${user.token}` }
                };

                const [usersRes, parcelRes, luggageRes, agentsRes, customersRes] = await Promise.all([
                    axios.get('/api/auth/users', config).catch(() => ({ data: [] })),
                    axios.get('/api/parcel-requests', config).catch(() => ({ data: [] })),
                    axios.get('/api/luggage', config).catch(() => ({ data: [] })),
                    axios.get('/api/agents', config).catch(() => ({ data: [] })),
                    axios.get('/api/auth/customers', config).catch(() => ({ data: [] })),
                ]);

                const users = usersRes.data || [];
                const branches = users.filter(u => u.role === 'branch').length;
                const agents = users.filter(u => u.role === 'agent').length;
                const customers = users.filter(u => u.role === 'customer').length;
                const staffUsers = users.filter(u => u.role === 'user').length;
                const totalRevenue = (luggageRes.data || []).reduce((acc, item) => acc + (item.grandTotal || 0), 0);

                setStats({
                    totalBranches: branches,
                    totalAgents: agents,
                    totalCustomers: customers,
                    totalStaff: staffUsers,
                    totalParcels: (parcelRes.data || []).length,
                    totalRevenue,
                });

                // Build per-branch stats
                const branchUsers = users.filter(u => u.role === 'branch');
                const allAgents = agentsRes.data || [];
                const allCustomers = customersRes.data || [];

                const bStats = branchUsers.map(branch => {
                    const agentsCreated = allAgents.filter(a => a.createdBy?._id === branch._id || a.createdBy === branch._id).length;
                    const customersCreated = allCustomers.filter(c => c.createdByUser?._id === branch._id || c.createdByUser === branch._id).length;
                    return {
                        _id: branch._id,
                        name: branch.name,
                        username: branch.username,
                        agentsCreated,
                        customersCreated,
                    };
                });
                setBranchStats(bStats);
            } catch (error) {
                console.error("Error fetching stats", error);
            }
        };

        if (user?.token) {
            fetchStats();
        }
    }, [user]);

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 rounded-xl shadow-lg border border-white/10">
                <h1 className="text-4xl font-bold flex items-center gap-3">
                    <Shield size={40} className="text-blue-400" /> Admin Dashboard
                </h1>
                <p className="mt-2 text-slate-400">Complete system overview and control</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium uppercase mb-2">Total Branches</div>
                    <div className="text-4xl font-bold text-blue-600">{stats.totalBranches}</div>
                    <div className="text-xs text-gray-400 mt-2">Active branch panels</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium uppercase mb-2">Total Agents</div>
                    <div className="text-4xl font-bold text-green-600">{stats.totalAgents}</div>
                    <div className="text-xs text-gray-400 mt-2">Delivery agents</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium uppercase mb-2">Total Customers</div>
                    <div className="text-4xl font-bold text-purple-600">{stats.totalCustomers}</div>
                    <div className="text-xs text-gray-400 mt-2">Registered users</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium uppercase mb-2">Total Parcels</div>
                    <div className="text-4xl font-bold text-orange-600">{stats.totalParcels}</div>
                    <div className="text-xs text-gray-400 mt-2">All shipments</div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-white p-6 rounded-xl shadow-sm border-2 border-yellow-200">
                    <div className="text-yellow-600 text-sm font-bold uppercase mb-2">Total Revenue</div>
                    <div className="text-4xl font-bold text-yellow-700">₹{(stats.totalRevenue/100000).toFixed(1)}L</div>
                    <div className="text-xs text-yellow-600 mt-2">All time</div>
                </div>
            </div>

            {/* Branch Performance Table */}
            {branchStats.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <GitBranch size={24} className="text-blue-600" /> Branch Performance
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Branch Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Username</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Agents Added</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Customers Added</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {branchStats.map((b, idx) => (
                                    <tr key={b._id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{b.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{b.username}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold">{b.agentsCreated}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-bold">{b.customersCreated}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold">{b.agentsCreated + b.customersCreated}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div onClick={() => navigate('/users')} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition cursor-pointer group">
                    <GitBranch size={40} className="text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold mb-2">🏢 Manage Branches</h3>
                    <p className="text-gray-600">Add, update, and manage branch panels and staff users</p>
                    <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                        Manage Branches
                    </button>
                </div>

                <div onClick={() => navigate('/reports')} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition cursor-pointer group">
                    <TrendingUp size={40} className="text-green-600 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold mb-2">📊 System Analytics</h3>
                    <p className="text-gray-600">View detailed reports and performance metrics</p>
                    <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                        View Analytics
                    </button>
                </div>

                <div onClick={() => navigate('/complaints')} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-orange-200 transition cursor-pointer group">
                    <MessageSquare size={40} className="text-orange-600 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold mb-2">💬 Complaints & Enquiries</h3>
                    <p className="text-gray-600">Review and resolve customer complaints and enquiries</p>
                    <button className="mt-4 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition">
                        View Complaints
                    </button>
                </div>

                <div onClick={() => navigate('/customers')} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-purple-200 transition cursor-pointer group">
                    <Users size={40} className="text-purple-600 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold mb-2">👥 Customers</h3>
                    <p className="text-gray-600">Manage customer accounts and registrations</p>
                    <button className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                        View Customers
                    </button>
                </div>

                <div onClick={() => navigate('/parcel-requests')} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-cyan-200 transition cursor-pointer group">
                    <Package size={40} className="text-cyan-600 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold mb-2">📦 Parcel Requests</h3>
                    <p className="text-gray-600">Track and manage all parcel shipments</p>
                    <button className="mt-4 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition">
                        View Parcels
                    </button>
                </div>

                <div onClick={() => navigate('/credit-offices')} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-amber-200 transition cursor-pointer group">
                    <AlertCircle size={40} className="text-amber-600 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold mb-2">🏦 Credit Offices</h3>
                    <p className="text-gray-600">Manage credit offices and commission settings</p>
                    <button className="mt-4 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition">
                        View Offices
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;