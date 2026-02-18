import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { Package, Clock, Truck, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

const ParcelRequests = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const config = { headers: { Authorization: `Bearer ${user.token}` } };

    const statusOptions = ['Pending', 'Approved', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled'];

    useEffect(() => {
        fetchRequests();
    }, []);

    // Reset page when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);



    const fetchRequests = async () => {
        try {
            const { data } = await axios.get('/api/parcel-requests', config);
            setRequests(data);
        } catch (error) {
            toast.error('Failed to fetch parcel requests');
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
            'Pending': <Clock size={14} />,
            'Approved': <CheckCircle2 size={14} />,
            'Picked Up': <Package size={14} />,
            'In Transit': <Truck size={14} />,
            'Delivered': <CheckCircle2 size={14} />,
            'Cancelled': <XCircle size={14} />,
        };
        return icons[status] || <Package size={14} />;
    };

    const filteredRequests = filter === 'All' ? requests : requests.filter(r => r.status === filter);

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'Pending').length,
        inTransit: requests.filter(r => r.status === 'In Transit' || r.status === 'Picked Up').length,
        delivered: requests.filter(r => r.status === 'Delivered').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Package className="text-indigo-600" /> Parcel Requests
                    </h1>
                    <p className="text-gray-500 mt-1">Manage customer parcel requests and update statuses</p>
                </div>
                <button onClick={fetchRequests}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium transition-colors">
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: stats.total, color: 'text-blue-600 bg-blue-50 border-blue-100' },
                    { label: 'Pending', value: stats.pending, color: 'text-yellow-600 bg-yellow-50 border-yellow-100' },
                    { label: 'In Transit', value: stats.inTransit, color: 'text-orange-600 bg-orange-50 border-orange-100' },
                    { label: 'Delivered', value: stats.delivered, color: 'text-green-600 bg-green-50 border-green-100' },
                ].map(s => (
                    <div key={s.label} className={`${s.color} rounded-xl p-4 border font-bold text-center`}>
                        <p className="text-2xl">{s.value}</p>
                        <p className="text-sm font-medium opacity-80">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="flex flex-wrap gap-2">
                {['All', ...statusOptions].map((s) => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${filter === s
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                            }`}>
                        {s}
                    </button>
                ))}
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {filteredRequests.length === 0 ? (
                    <div className="p-12 text-center">
                        <Package size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">No parcel requests found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 text-left">
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pickup</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Delivery</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Package</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Updated By</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {currentItems.map((req, index) => (
                                    <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-4 text-sm text-gray-600">{indexOfFirstItem + index + 1}</td>
                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">{req.customer?.name}</p>
                                                <p className="text-xs text-gray-400">{req.customer?.company || req.customer?.email || ''}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-700 max-w-[150px] truncate">{req.pickupAddress}</td>
                                        <td className="px-4 py-4 text-sm text-gray-700 max-w-[150px] truncate">{req.deliveryAddress}</td>
                                        <td className="px-4 py-4 text-sm text-gray-600">{req.packageDescription || '-'}</td>
                                        <td className="px-4 py-4 text-sm text-gray-600">{req.quantity}</td>
                                        <td className="px-4 py-4 text-sm text-gray-500">
                                            {new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(req.status)}`}>
                                                {getStatusIcon(req.status)}
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-500">{req.updatedBy?.name || '-'}</td>
                                        <td className="px-4 py-4 space-y-2">
                                            <select
                                                value={req.status}
                                                onChange={(e) => handleStatusChange(req._id, e.target.value)}
                                                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white w-full"
                                            >
                                                {statusOptions.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => navigate('/new-entry', { state: { parcelRequest: req } })}
                                                className="w-full bg-indigo-600 text-white text-xs px-2 py-1.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                                            >
                                                Create Entry
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <nav className="flex items-center gap-2">
                        <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === 1
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
                                }`}
                        >
                            Previous
                        </button>
                        
                        <div className="flex gap-1">
                             {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => paginate(i + 1)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                                        currentPage === i + 1
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                             ))}
                        </div>

                        <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === totalPages
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
                                }`}
                        >
                            Next
                        </button>
                    </nav>
                </div>
            )}
        </div>
    );
};

export default ParcelRequests;
