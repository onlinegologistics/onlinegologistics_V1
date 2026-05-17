import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import LuggageTable from '../components/LuggageTable';
import ParcelRecordTable from '../components/ParcelRecordTable';
import DashboardParcelRequestTable from '../components/DashboardParcelRequestTable';
import { Link, useSearchParams } from 'react-router-dom';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const userId = searchParams.get('userId');
    const userName = searchParams.get('name');

    const [stats, setStats] = useState({
        totalLuggage: 0,
        totalRevenue: 0,
        openComplaints: 0,
        dailyRevenue: 0,
        dailyEntries: 0
    });
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [userPerformance, setUserPerformance] = useState([]);
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${user.token}` }
                };

                const params = {};
                if (userId && user.role === 'branch') {
                    params.userId = userId;
                }

                const [luggageRes, complaintsRes] = await Promise.all([
                    axios.get('/api/luggage', { ...config, params }),
                    axios.get('/api/complaints', { ...config, params: { ...params, limit: 9999 } })
                ]);

                const luggage = luggageRes.data;
                const complaints = complaintsRes.data?.complaints || complaintsRes.data || [];

                const totalRevenue = luggage.reduce((acc, item) => acc + (item.grandTotal || 0), 0);
                const openComplaints = Array.isArray(complaints)
                    ? complaints.filter(c => c.status !== 'Closed' && c.status !== 'Resolved').length
                    : 0;

                const dailyLuggage = luggage.filter(item => {
                    const itemDate = new Date(item.createdAt).toISOString().split('T')[0];
                    return itemDate === selectedDate;
                });
                const dailyRevenue = dailyLuggage.reduce((acc, item) => acc + (item.grandTotal || 0), 0);

                setStats({
                    totalLuggage: luggage.length,
                    totalRevenue,
                    openComplaints,
                    dailyRevenue,
                    dailyEntries: dailyLuggage.length
                });

                if (user.role === 'branch') {
                    const performanceMap = {};
                    luggage.forEach(item => {
                        const itemDate = new Date(item.createdAt).toISOString().split('T')[0];
                        if (itemDate === selectedDate) {
                            const creatorName = item.createdBy?.name || 'Unknown';
                            const creatorEmail = item.createdBy?.email || 'No Email';
                            const key = item.createdBy?._id || 'unknown';

                            if (!performanceMap[key]) {
                                performanceMap[key] = {
                                    id: key,
                                    name: creatorName,
                                    email: creatorEmail,
                                    count: 0,
                                    revenue: 0
                                };
                            }
                            performanceMap[key].count += 1;
                            performanceMap[key].revenue += (item.grandTotal || 0);
                        }
                    });
                    setUserPerformance(Object.values(performanceMap));
                }

            } catch (error) {
                console.error("Error fetching stats", error);
            }
        };

        if (user?.token) {
            fetchStats();
        }
    }, [user, selectedDate, userId]);

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-gray-800">
                        {userId && userName ? `Dashboard: ${userName}` : 'Dashboard'}
                    </h1>
                    {userId && (
                        <button
                            onClick={() => setSearchParams({})}
                            className="text-sm text-red-500 hover:text-red-700 underline"
                        >
                            (Clear Filter)
                        </button>
                    )}
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3">
                    {/* Date Picker */}
                    <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2">
                        <span className="text-gray-500 mr-2 text-sm">Date:</span>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="outline-none text-gray-700 font-medium"
                        />
                    </div>

                    {/* Add Record Button (branch role only) */}
                    {user?.role === 'branch' && (
                        <Link
                            to="/add-record"
                            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 font-semibold shadow whitespace-nowrap"
                        >
                            + New Entry
                        </Link>
                    )}

                    {/* New Entry Button */}
                    {user?.role !== 'branch' && (
                        <Link
                            to="/new-entry"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold shadow whitespace-nowrap"
                        >
                            + New Entry
                        </Link>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl shadow-sm border border-blue-100 ring-2 ring-blue-50">
                    <div className="text-blue-600 text-sm font-bold uppercase tracking-wider mb-1">
                        Revenue ({new Date(selectedDate).toLocaleDateString('en-GB')})
                    </div>
                    <div className="text-3xl font-bold text-blue-800">₹{stats.dailyRevenue.toLocaleString()}</div>
                    <div className="text-xs text-blue-500 mt-1">{stats.dailyEntries} Entries</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Total Revenue (All Time)</div>
                    <div className="text-3xl font-bold text-green-600">₹{stats.totalRevenue.toLocaleString()}</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Open Complaints</div>
                    <div className="text-3xl font-bold text-red-500">{stats.openComplaints}</div>
                </div>
            </div>

            {/* Recent Luggage Entries / New Entry */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-700">
                        {user?.role === 'branch' ? 'New Entry' : 'Recent Luggage Entries'}
                    </h2>
                    <Link to="/add-record" className="text-sm text-blue-600 hover:underline font-medium">
                        View All →
                    </Link>
                </div>
                {user?.role === 'branch' ? <ParcelRecordTable limit={10} /> : <LuggageTable limit={10} />}
            </div>

            {/* Parcels Request Section (Branch Only) */}
            {user?.role === 'branch' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-700">Parcels Request</h2>
                        <Link to="/parcel-requests" className="text-sm text-blue-600 hover:underline font-medium">
                            View All →
                        </Link>
                    </div>
                    <DashboardParcelRequestTable limit={10} />
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;