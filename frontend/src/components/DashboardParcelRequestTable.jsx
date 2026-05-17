import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Package, Clock, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const DashboardParcelRequestTable = ({ limit }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const config = { headers: { Authorization: `Bearer ${user.token}` } };
    const statusOptions = ['Pending', 'Approved', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled'];

    useEffect(() => {
        fetchRequests();
    }, [user]);

    const fetchRequests = async () => {
        try {
            const { data } = await axios.get('/api/parcel-requests', config);
            let sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            if (limit) {
                sortedData = sortedData.slice(0, limit);
            }
            setRequests(sortedData);
        } catch (error) {
            console.error('Failed to fetch parcel requests', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await axios.put(`/api/parcel-requests/${id}/status`, { status: newStatus }, config);
            toast.success(`Status updated to "${newStatus}"`);
            fetchRequests();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'Approved': 'bg-blue-100 text-blue-800 border-blue-200',
            'Picked Up': 'bg-purple-100 text-purple-800 border-purple-200',
            'In Transit': 'bg-orange-100 text-orange-800 border-orange-200',
            'Delivered': 'bg-green-100 text-green-800 border-green-200',
            'Cancelled': 'bg-red-100 text-red-800 border-red-200',
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getStatusIcon = (status) => {
        const icons = {
            'Pending': <Clock size={12} />,
            'Approved': <CheckCircle2 size={12} />,
            'Picked Up': <Package size={12} />,
            'In Transit': <Truck size={12} />,
            'Delivered': <CheckCircle2 size={12} />,
            'Cancelled': <XCircle size={12} />,
        };
        return icons[status] || <Package size={12} />;
    };

    if (loading) return <div className="p-4 text-center text-gray-500">Loading requests...</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="bg-gray-50 text-left">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pickup</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Delivery</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {requests.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="px-4 py-8 text-center text-gray-400">No recent parcel requests.</td>
                        </tr>
                    ) : (
                        requests.map((req) => (
                            <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-4">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{req.customer?.name}</p>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-700 max-w-[120px] truncate">{req.pickupAddress}</td>
                                <td className="px-4 py-4 text-sm text-gray-700 max-w-[120px] truncate">{req.deliveryAddress}</td>
                                <td className="px-4 py-4 text-sm text-gray-600">{req.quantity}</td>
                                <td className="px-4 py-4 text-sm text-gray-500">
                                    {new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getStatusColor(req.status)}`}>
                                        {getStatusIcon(req.status)}
                                        {req.status}
                                    </span>
                                </td>
                                <td className="px-4 py-4 space-y-1">
                                    <select
                                        value={req.status}
                                        onChange={(e) => handleStatusChange(req._id, e.target.value)}
                                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 bg-white w-full"
                                    >
                                        {statusOptions.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default DashboardParcelRequestTable;
