import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Package, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';

const AgentParcelRequests = () => {
    const { user } = useAuth();
    const [parcels, setParcels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [rejectId, setRejectId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const config = { headers: { Authorization: `Bearer ${user?.token}` } };

    const fetchParcels = async () => {
        try {
            const { data } = await axios.get('/api/agent-parcels', config);
            setParcels(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.token) fetchParcels();
    }, [user]);

    const handleApprove = async (id) => {
        try {
            await axios.put(`/api/agent-parcels/${id}/review`, { status: 'Approved' }, config);
            toast.success('Parcel request approved!');
            fetchParcels();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed');
        }
    };

    const handleReject = async (id) => {
        try {
            await axios.put(`/api/agent-parcels/${id}/review`, { status: 'Rejected', rejectionReason: rejectReason }, config);
            toast.success('Parcel request rejected');
            setRejectId(null);
            setRejectReason('');
            fetchParcels();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed');
        }
    };

    const filteredParcels = filter === 'all' ? parcels : parcels.filter(p => p.status === filter);

    const pendingCount = parcels.filter(p => p.status === 'Pending').length;
    const approvedCount = parcels.filter(p => p.status === 'Approved').length;
    const rejectedCount = parcels.filter(p => p.status === 'Rejected').length;

    const statusColor = {
        Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        Approved: 'bg-green-100 text-green-700 border-green-200',
        Rejected: 'bg-red-100 text-red-700 border-red-200',
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Package size={24} className="text-blue-600" /> Agent Parcel Requests
            </h1>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition" onClick={() => setFilter('all')}>
                    <div className="text-gray-400 text-xs uppercase font-bold">Total</div>
                    <div className="text-2xl font-black text-gray-800">{parcels.length}</div>
                </div>
                <div className={`bg-white p-4 rounded-xl shadow-sm border-l-4 border-yellow-400 cursor-pointer hover:shadow-md transition ${filter === 'Pending' ? 'ring-2 ring-yellow-400' : ''}`} onClick={() => setFilter('Pending')}>
                    <div className="text-yellow-600 text-xs uppercase font-bold flex items-center gap-1"><Clock size={12} /> Pending</div>
                    <div className="text-2xl font-black text-yellow-600">{pendingCount}</div>
                </div>
                <div className={`bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-400 cursor-pointer hover:shadow-md transition ${filter === 'Approved' ? 'ring-2 ring-green-400' : ''}`} onClick={() => setFilter('Approved')}>
                    <div className="text-green-600 text-xs uppercase font-bold flex items-center gap-1"><CheckCircle size={12} /> Approved</div>
                    <div className="text-2xl font-black text-green-600">{approvedCount}</div>
                </div>
                <div className={`bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-400 cursor-pointer hover:shadow-md transition ${filter === 'Rejected' ? 'ring-2 ring-red-400' : ''}`} onClick={() => setFilter('Rejected')}>
                    <div className="text-red-600 text-xs uppercase font-bold flex items-center gap-1"><XCircle size={12} /> Rejected</div>
                    <div className="text-2xl font-black text-red-600">{rejectedCount}</div>
                </div>
            </div>

            {/* Parcel List */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">
                        {filter === 'all' ? 'All Requests' : `${filter} Requests`} ({filteredParcels.length})
                    </h2>
                    {filter !== 'all' && (
                        <button onClick={() => setFilter('all')} className="text-xs text-blue-600 font-bold hover:underline">Show All</button>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                ) : filteredParcels.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <Package size={40} className="mx-auto mb-2 opacity-50" />
                        <p>No parcel requests found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredParcels.map((p) => (
                            <div key={p._id} className={`border rounded-xl p-4 ${p.status === 'Pending' ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-100'}`}>
                                <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor[p.status]}`}>{p.status}</span>
                                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Agent: {p.agent?.name || 'Unknown'}</span>
                                        {user?.role === 'admin' && p.branch && (
                                            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Branch: {p.branch?.name || 'Unknown'}</span>
                                        )}
                                        <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleString('en-IN')}</span>
                                    </div>
                                    {p.status === 'Pending' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleApprove(p._id)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 transition flex items-center gap-1">
                                                <CheckCircle size={14} /> Approve
                                            </button>
                                            <button onClick={() => setRejectId(p._id)} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 transition flex items-center gap-1">
                                                <XCircle size={14} /> Reject
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Reject Reason Modal */}
                                {rejectId === p._id && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                                        <label className="block text-xs font-bold text-red-600 mb-1">Rejection Reason</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="border border-red-300 p-2 w-full rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none" placeholder="Enter reason..." />
                                            <button onClick={() => handleReject(p._id)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap">Confirm</button>
                                            <button onClick={() => { setRejectId(null); setRejectReason(''); }} className="bg-gray-200 text-gray-600 px-3 py-2 rounded-lg text-xs font-bold">Cancel</button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase font-bold mb-1">📦 Sender</div>
                                        <div className="text-sm font-semibold">{p.senderName}</div>
                                        <div className="text-xs text-gray-500">{p.senderMobile}</div>
                                        {p.senderAddress && <div className="text-xs text-gray-400 mt-0.5">{p.senderAddress}</div>}
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase font-bold mb-1">📍 Receiver</div>
                                        <div className="text-sm font-semibold">{p.receiverName}</div>
                                        <div className="text-xs text-gray-500">{p.receiverMobile}</div>
                                        {p.receiverAddress && <div className="text-xs text-gray-400 mt-0.5">{p.receiverAddress}</div>}
                                    </div>
                                </div>
                                {(p.packageDescription || p.weight) && (
                                    <div className="mt-2 flex gap-4 text-xs text-gray-500 flex-wrap">
                                        {p.packageDescription && <span>📦 {p.packageDescription}</span>}
                                        {p.weight && <span>⚖️ {p.weight} kg</span>}
                                        {p.quantity > 1 && <span>📊 Qty: {p.quantity}</span>}
                                        {p.remarks && <span>💬 {p.remarks}</span>}
                                    </div>
                                )}
                                {p.status === 'Rejected' && p.rejectionReason && (
                                    <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-600">
                                        <strong>Rejected:</strong> {p.rejectionReason}
                                    </div>
                                )}
                                {p.reviewedBy && (
                                    <div className="mt-1 text-[10px] text-gray-400">Reviewed by: {p.reviewedBy.name} • {p.reviewedAt && new Date(p.reviewedAt).toLocaleString('en-IN')}</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentParcelRequests;
