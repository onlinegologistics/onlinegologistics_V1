import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowLeft, Users, UserPlus, Trash2, Edit3, X, GitBranch, Package } from 'lucide-react';

const BranchDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [branch, setBranch] = useState(null);
    const [agents, setAgents] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [agentParcels, setAgentParcels] = useState([]);
    const [loading, setLoading] = useState(true);

    const config = {
        headers: { Authorization: `Bearer ${user?.token}` },
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchBranchData();
        }
    }, [id, user]);

    const fetchBranchData = async () => {
        try {
            setLoading(true);
            const [usersRes, agentsRes, customersRes, parcelsRes] = await Promise.all([
                axios.get('/api/auth/users', config),
                axios.get('/api/auth/users', config).catch(() => ({ data: [] })), // using /users instead of /agents to get agent users
                axios.get('/api/auth/customers', config),
                axios.get('/api/agent-parcels', config),
            ]);

            const allUsers = usersRes.data || [];
            const branchUser = allUsers.find(u => u._id === id);
            setBranch(branchUser);

            // Filter agents created by this branch (agents are now Users)
            const branchAgents = (agentsRes.data || []).filter(a => 
                a.role === 'agent' && (a.createdByUser?._id === id || a.createdByUser === id)
            );
            setAgents(branchAgents);

            // Filter customers created by this branch
            const branchCustomers = (customersRes.data || []).filter(c => 
                c.createdByUser?._id === id || c.createdByUser === id
            );
            setCustomers(branchCustomers);

            // Filter agent parcels for this branch
            const branchParcels = (parcelsRes.data || []).filter(p => 
                p.branch?._id === id || p.branch === id
            );
            setAgentParcels(branchParcels);
        } catch (error) {
            console.error('Error fetching branch data:', error);
            toast.error('Failed to load branch data');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAgent = async (agentId) => {
        if (window.confirm('Are you sure you want to delete this agent?')) {
            try {
                await axios.delete(`/api/auth/${agentId}`, config);
                toast.success('Agent deleted');
                fetchBranchData();
            } catch (error) {
                toast.error('Failed to delete agent');
            }
        }
    };

    const handleDeleteCustomer = async (customerId) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            try {
                await axios.delete(`/api/auth/${customerId}`, config);
                toast.success('Customer deleted');
                fetchBranchData();
            } catch (error) {
                toast.error('Failed to delete customer');
            }
        }
    };

    if (user?.role !== 'admin') {
        return <div className="p-4 text-red-600 font-bold">Access Denied.</div>;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!branch) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Branch not found</p>
                <button onClick={() => navigate('/users')} className="mt-4 text-blue-600 hover:underline">← Back to Branches</button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto mt-4">
            <Toaster />

            {/* Back Button + Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/users')} className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <GitBranch className="text-blue-600" /> {branch.name}
                    </h1>
                    <p className="text-gray-500 text-sm">Branch Panel • {branch.username} {branch.email && `• ${branch.email}`}</p>
                </div>
                <div className="flex gap-3">
                    <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-bold">
                        {agents.length} Agents
                    </span>
                    <span className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-sm font-bold">
                        {customers.length} Customers
                    </span>
                </div>
            </div>

            {/* Branch Info Card */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-xl shadow-lg mb-6 border border-white/10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <div className="text-slate-400 text-xs uppercase font-medium">Name</div>
                        <div className="text-lg font-bold">{branch.name}</div>
                    </div>
                    <div>
                        <div className="text-slate-400 text-xs uppercase font-medium">Username</div>
                        <div className="text-lg font-bold">{branch.username}</div>
                    </div>
                    <div>
                        <div className="text-slate-400 text-xs uppercase font-medium">Total Agents</div>
                        <div className="text-lg font-bold text-green-400">{agents.length}</div>
                    </div>
                    <div>
                        <div className="text-slate-400 text-xs uppercase font-medium">Total Customers</div>
                        <div className="text-lg font-bold text-purple-400">{customers.length}</div>
                    </div>
                </div>
            </div>

            {/* Agents Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Users size={20} className="text-green-600" />
                    Agents ({agents.length})
                    <span className="text-xs text-gray-400 font-normal ml-2">Created by this branch</span>
                </h2>

                {agents.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <Users size={40} className="mx-auto mb-2 opacity-50" />
                        <p>No agents added by this branch yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Agent Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Username</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Mobile</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Added On</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {agents.map((a, idx) => (
                                    <tr key={a._id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{a.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{a.username}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{a.mobile || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{new Date(a.createdAt).toLocaleDateString('en-GB')}</td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => handleDeleteAgent(a._id)} className="bg-red-100 text-red-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-200 transition">
                                                <Trash2 size={14} className="inline mr-1" />Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Agent Parcel Requests Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Package size={20} className="text-blue-600" />
                    Agent Parcel Requests ({agentParcels.length})
                    <span className="text-xs text-gray-400 font-normal ml-2">Managed by this branch</span>
                </h2>

                {agentParcels.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <Package size={40} className="mx-auto mb-2 opacity-50" />
                        <p>No parcel requests from agents yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Agent</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Sender</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Receiver</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {agentParcels.map((p) => (
                                    <tr key={p._id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                p.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                p.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {p.status}
                                            </span>
                                            {p.status === 'Rejected' && p.rejectionReason && (
                                                <div className="text-[10px] text-red-500 mt-1 truncate max-w-[120px]" title={p.rejectionReason}>
                                                    {p.rejectionReason}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-800 font-semibold">{p.agent?.name || 'Unknown'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {p.senderName}
                                            <div className="text-xs text-gray-400">{p.senderMobile}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {p.receiverName}
                                            <div className="text-xs text-gray-400">{p.receiverMobile}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {new Date(p.createdAt).toLocaleDateString('en-GB')}
                                            {p.reviewedBy && (
                                                <div className="text-[10px] text-gray-400 mt-1">Reviewed by: {p.reviewedBy.name}</div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Customers Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <UserPlus size={20} className="text-purple-600" />
                    Customers ({customers.length})
                    <span className="text-xs text-gray-400 font-normal ml-2">Created by this branch</span>
                </h2>

                {customers.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <UserPlus size={40} className="mx-auto mb-2 opacity-50" />
                        <p>No customers added by this branch yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Username</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Mobile</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Company</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {customers.map((c, idx) => (
                                    <tr key={c._id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{c.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{c.username}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{c.email || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{c.mobile || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{c.company || '-'}</td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => handleDeleteCustomer(c._id)} className="bg-red-100 text-red-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-200 transition">
                                                <Trash2 size={14} className="inline mr-1" />Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BranchDetails;
