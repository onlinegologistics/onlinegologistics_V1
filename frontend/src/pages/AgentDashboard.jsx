import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { Package, Send, Clock, CheckCircle, XCircle, Plus, X, LogOut } from 'lucide-react';

const AgentDashboard = () => {
    const { user, logout } = useAuth();
    const [parcels, setParcels] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        senderName: '', senderMobile: '', senderAddress: '',
        receiverName: '', receiverMobile: '', receiverAddress: '',
        packageDescription: '', weight: '', quantity: 1, remarks: '',
    });

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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/agent-parcels', formData, config);
            toast.success('Parcel request submitted!');
            setFormData({
                senderName: '', senderMobile: '', senderAddress: '',
                receiverName: '', receiverMobile: '', receiverAddress: '',
                packageDescription: '', weight: '', quantity: 1, remarks: '',
            });
            setShowForm(false);
            fetchParcels();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this parcel request?')) {
            try {
                await axios.delete(`/api/agent-parcels/${id}`, config);
                toast.success('Deleted');
                fetchParcels();
            } catch (error) {
                toast.error('Failed to delete');
            }
        }
    };

    const pendingCount = parcels.filter(p => p.status === 'Pending').length;
    const approvedCount = parcels.filter(p => p.status === 'Approved').length;
    const rejectedCount = parcels.filter(p => p.status === 'Rejected').length;

    const statusColor = {
        Pending: 'bg-yellow-100 text-yellow-700',
        Approved: 'bg-green-100 text-green-700',
        Rejected: 'bg-red-100 text-red-700',
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster />
            {/* Navbar */}
            <nav className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-black text-sm">AG</div>
                        <div>
                            <div className="font-bold text-lg leading-tight">ONLINE GO</div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest">Agent Panel</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-semibold">{user?.name}</div>
                            <div className="text-[10px] text-slate-400">@{user?.username}</div>
                        </div>
                        <button onClick={logout} className="flex items-center gap-1 bg-red-500/20 text-red-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-500/30 transition">
                            <LogOut size={14} /> Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="text-gray-400 text-xs uppercase font-bold">Total</div>
                        <div className="text-3xl font-black text-gray-800">{parcels.length}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-yellow-400">
                        <div className="text-yellow-600 text-xs uppercase font-bold flex items-center gap-1"><Clock size={12} /> Pending</div>
                        <div className="text-3xl font-black text-yellow-600">{pendingCount}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-400">
                        <div className="text-green-600 text-xs uppercase font-bold flex items-center gap-1"><CheckCircle size={12} /> Approved</div>
                        <div className="text-3xl font-black text-green-600">{approvedCount}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-400">
                        <div className="text-red-600 text-xs uppercase font-bold flex items-center gap-1"><XCircle size={12} /> Rejected</div>
                        <div className="text-3xl font-black text-red-600">{rejectedCount}</div>
                    </div>
                </div>

                {/* New Request Button */}
                <button onClick={() => setShowForm(!showForm)} className="mb-6 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-600/20">
                    {showForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> New Parcel Request</>}
                </button>

                {/* New Parcel Form */}
                {showForm && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Send size={20} className="text-blue-600" /> Submit Parcel Request
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wide border-b pb-1">Sender Details</h3>
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-gray-600">Name *</label>
                                        <input type="text" name="senderName" value={formData.senderName} onChange={handleChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-gray-600">Mobile *</label>
                                        <input type="text" name="senderMobile" value={formData.senderMobile} onChange={handleChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-gray-600">Address</label>
                                        <textarea name="senderAddress" value={formData.senderAddress} onChange={handleChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" rows="2" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wide border-b pb-1">Receiver Details</h3>
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-gray-600">Name *</label>
                                        <input type="text" name="receiverName" value={formData.receiverName} onChange={handleChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-gray-600">Mobile *</label>
                                        <input type="text" name="receiverMobile" value={formData.receiverMobile} onChange={handleChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-gray-600">Address</label>
                                        <textarea name="receiverAddress" value={formData.receiverAddress} onChange={handleChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" rows="2" />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 space-y-3">
                                <h3 className="font-bold text-sm text-gray-500 uppercase tracking-wide border-b pb-1">Package Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-gray-600">Description</label>
                                        <input type="text" name="packageDescription" value={formData.packageDescription} onChange={handleChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="e.g. Electronics" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-gray-600">Weight (kg)</label>
                                        <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" step="0.1" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-gray-600">Quantity</label>
                                        <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" min="1" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1 text-gray-600">Remarks</label>
                                    <textarea name="remarks" value={formData.remarks} onChange={handleChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" rows="2" placeholder="Any special instructions..." />
                                </div>
                            </div>
                            <button type="submit" className="mt-4 bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-green-700 transition flex items-center gap-2">
                                <Send size={16} /> Submit Request
                            </button>
                        </form>
                    </div>
                )}

                {/* Parcel List */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Package size={20} className="text-blue-600" /> My Parcel Requests ({parcels.length})
                    </h2>
                    {loading ? (
                        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                    ) : parcels.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Package size={48} className="mx-auto mb-3 opacity-50" />
                            <p className="text-lg">No parcel requests yet</p>
                            <p className="text-sm">Click "New Parcel Request" to submit your first one</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {parcels.map((p) => (
                                <div key={p._id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor[p.status]}`}>{p.status}</span>
                                            <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleString('en-IN')}</span>
                                        </div>
                                        {p.status === 'Pending' && (
                                            <button onClick={() => handleDelete(p._id)} className="text-red-400 hover:text-red-600 text-xs font-bold">Delete</button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-xs text-gray-400 uppercase font-bold mb-1">Sender</div>
                                            <div className="text-sm font-semibold">{p.senderName}</div>
                                            <div className="text-xs text-gray-500">{p.senderMobile}</div>
                                            {p.senderAddress && <div className="text-xs text-gray-400 mt-1">{p.senderAddress}</div>}
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-400 uppercase font-bold mb-1">Receiver</div>
                                            <div className="text-sm font-semibold">{p.receiverName}</div>
                                            <div className="text-xs text-gray-500">{p.receiverMobile}</div>
                                            {p.receiverAddress && <div className="text-xs text-gray-400 mt-1">{p.receiverAddress}</div>}
                                        </div>
                                    </div>
                                    {(p.packageDescription || p.weight) && (
                                        <div className="mt-2 flex gap-4 text-xs text-gray-500">
                                            {p.packageDescription && <span>📦 {p.packageDescription}</span>}
                                            {p.weight && <span>⚖️ {p.weight} kg</span>}
                                            {p.quantity > 1 && <span>📊 Qty: {p.quantity}</span>}
                                        </div>
                                    )}
                                    {p.status === 'Rejected' && p.rejectionReason && (
                                        <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-600">
                                            <strong>Reason:</strong> {p.rejectionReason}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgentDashboard;