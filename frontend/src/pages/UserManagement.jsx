import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { GitBranch, Eye, Trash2, Edit3, X, Plus } from 'lucide-react';

const UserManagement = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Branch list (for admin)
    const [branches, setBranches] = useState([]);
    const [branchForm, setBranchForm] = useState({
        name: '',
        username: '',
        password: '',
        email: '',
    });

    // Edit modal state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editBranch, setEditBranch] = useState(null);
    const [editData, setEditData] = useState({
        name: '',
        username: '',
        password: '',
        email: '',
    });

    // Agent state (for branch panel)
    const [agents, setAgents] = useState([]);
    const [agentForm, setAgentForm] = useState({ name: '', username: '', password: '', mobile: '' });

    // Branch stats (agents/customers count per branch)
    const [branchStats, setBranchStats] = useState({});

    const config = {
        headers: {
            Authorization: `Bearer ${user?.token}`,
        },
    };

    const fetchBranches = async () => {
        try {
            const { data } = await axios.get('/api/auth/users', config);
            const branchList = data.filter(u => u.role === 'branch');
            setBranches(branchList);

            // Also fetch agents and customers to build stats
            const [agentsRes, customersRes] = await Promise.all([
                axios.get('/api/agents', config).catch(() => ({ data: [] })),
                axios.get('/api/auth/customers', config).catch(() => ({ data: [] })),
            ]);

            const allAgents = agentsRes.data || [];
            const allCustomers = customersRes.data || [];

            const stats = {};
            branchList.forEach(branch => {
                const agentsCount = allAgents.filter(a => a.createdBy?._id === branch._id || a.createdBy === branch._id).length;
                const customersCount = allCustomers.filter(c => c.createdByUser?._id === branch._id || c.createdByUser === branch._id).length;
                stats[branch._id] = { agents: agentsCount, customers: customersCount };
            });
            setBranchStats(stats);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch branches');
        }
    };

    const fetchAgents = async () => {
        try {
            // Fetch agent users created by this branch
            const { data } = await axios.get('/api/auth/users', config).catch(() => ({ data: [] }));
            const agentUsers = (data || []).filter(u => u.role === 'agent');
            setAgents(agentUsers);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchBranches();
        }
        if (user?.role === 'admin' || user?.role === 'branch') {
            fetchAgents();
        }
    }, [user]);

    // ---- Branch Handlers (Admin) ----
    const handleBranchChange = (e) => {
        setBranchForm({ ...branchForm, [e.target.name]: e.target.value });
    };

    const handleBranchSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/auth/register', { ...branchForm, role: 'branch' }, config);
            toast.success('Branch Created Successfully!');
            setBranchForm({ name: '', username: '', password: '', email: '' });
            fetchBranches();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create branch');
        }
    };

    const handleDeleteBranch = async (id) => {
        if (window.confirm('Are you sure you want to delete this branch? All associated data may be affected.')) {
            try {
                await axios.delete(`/api/auth/${id}`, config);
                toast.success('Branch Deleted');
                fetchBranches();
            } catch (error) {
                toast.error('Failed to delete branch');
            }
        }
    };

    const openEditModal = (b) => {
        setEditBranch(b);
        setEditData({
            name: b.name,
            username: b.username,
            password: '',
            email: b.email || '',
        });
        setEditModalOpen(true);
    };

    const handleEditChange = (e) => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: editData.name,
                username: editData.username,
                email: editData.email,
                role: 'branch',
            };
            if (editData.password.trim()) {
                payload.password = editData.password;
            }
            await axios.put(`/api/auth/${editBranch._id}`, payload, config);
            toast.success('Branch Updated Successfully');
            setEditModalOpen(false);
            setEditBranch(null);
            fetchBranches();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update branch');
        }
    };

    // ---- Agent Handlers (Branch Panel) ----
    const handleAgentChange = (e) => {
        setAgentForm({ ...agentForm, [e.target.name]: e.target.value });
    };

    const handleAgentSubmit = async (e) => {
        e.preventDefault();
        try {
            // Create agent as a User with role 'agent' so they can login
            await axios.post('/api/auth/register', {
                name: agentForm.name,
                username: agentForm.username,
                password: agentForm.password,
                mobile: agentForm.mobile,
                role: 'agent',
            }, config);
            toast.success('Agent Created Successfully! They can now login.');
            setAgentForm({ name: '', username: '', password: '', mobile: '' });
            fetchAgents();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add agent');
        }
    };

    const handleAgentDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this agent?')) {
            try {
                await axios.delete(`/api/auth/${id}`, config);
                toast.success('Agent Deleted');
                fetchAgents();
            } catch (error) {
                toast.error('Failed to delete agent');
            }
        }
    };

    if (user?.role !== 'admin' && user?.role !== 'branch') {
        return <div className="p-4 text-red-600 font-bold">Access Denied.</div>;
    }

    const isAdmin = user?.role === 'admin';
    const isBranch = user?.role === 'branch';

    return (
        <div className="max-w-5xl mx-auto mt-6">
            <Toaster />

            {/* ========== ADMIN VIEW: Branch Management ========== */}
            {isAdmin && (
                <>
                    <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <GitBranch className="text-blue-600" /> Branch Management
                    </h1>

                    {/* Add Branch Form */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
                        <h2 className="text-lg font-bold mb-3">Create New Branch</h2>
                        <form onSubmit={handleBranchSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Branch Name <span className="text-red-500">*</span></label>
                                <input type="text" name="name" value={branchForm.name} onChange={handleBranchChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Pune Branch" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Username <span className="text-red-500">*</span></label>
                                <input type="text" name="username" value={branchForm.username} onChange={handleBranchChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Login username" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Password <span className="text-red-500">*</span></label>
                                <input type="text" name="password" value={branchForm.password} onChange={handleBranchChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Login password" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Email</label>
                                <input type="email" name="email" value={branchForm.email} onChange={handleBranchChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="branch@email.com" />
                            </div>
                            <div className="md:col-span-2">
                                <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-bold transition flex items-center gap-2">
                                    <Plus size={18} /> Create Branch
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Branch List */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-8">
                        <h2 className="text-lg font-bold mb-3">All Branches ({branches.length})</h2>
                        {branches.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <GitBranch size={40} className="mx-auto mb-2 opacity-50" />
                                <p>No branches created yet. Create your first branch above.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">#</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Branch Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Username</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Agents</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Customers</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {branches.map((b, idx) => (
                                            <tr key={b._id} className="hover:bg-gray-50 transition">
                                                <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-gray-800">{b.name}</div>
                                                    {b.email && <div className="text-xs text-gray-400">{b.email}</div>}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{b.username}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold">
                                                        {branchStats[b._id]?.agents || 0}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-bold">
                                                        {branchStats[b._id]?.customers || 0}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2 flex-wrap">
                                                        <button
                                                            onClick={() => navigate(`/branch/${b._id}`)}
                                                            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 font-bold flex items-center gap-1 transition"
                                                        >
                                                            <Eye size={14} /> View Details
                                                        </button>
                                                        <button onClick={() => openEditModal(b)} className="bg-yellow-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-yellow-600 font-bold flex items-center gap-1 transition">
                                                            <Edit3 size={14} /> Edit
                                                        </button>
                                                        <button onClick={() => handleDeleteBranch(b._id)} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-red-700 font-bold flex items-center gap-1 transition">
                                                            <Trash2 size={14} /> Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ========== BRANCH VIEW: Agent Management ========== */}
            {isBranch && (
                <>
                    <h1 className="text-2xl font-bold mb-4">{isBranch ? 'Agent Management' : 'All Agents'}</h1>

                    {/* Add Agent Form */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
                        <h2 className="text-lg font-bold mb-3">Add New Agent</h2>
                        <form onSubmit={handleAgentSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-bold mb-1">Agent Name <span className="text-red-500">*</span></label>
                                <input type="text" name="name" value={agentForm.name} onChange={handleAgentChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Full name" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Username <span className="text-red-500">*</span></label>
                                <input type="text" name="username" value={agentForm.username} onChange={handleAgentChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Login username" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Password <span className="text-red-500">*</span></label>
                                <input type="password" name="password" value={agentForm.password} onChange={handleAgentChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Login password" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Mobile</label>
                                <input type="text" name="mobile" value={agentForm.mobile} onChange={handleAgentChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Mobile number" />
                            </div>
                            <div>
                                <button type="submit" className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 font-bold w-full transition">+ Add Agent</button>
                            </div>
                        </form>
                    </div>

                    {/* Agent List */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold mb-3">Existing Agents ({agents.length})</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Agent Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Username</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Mobile</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {agents.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No agents added yet.</td>
                                        </tr>
                                    ) : (
                                        agents.map((a, idx) => (
                                            <tr key={a._id} className="hover:bg-gray-50 transition">
                                                <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                                                <td className="px-4 py-3 text-sm font-semibold text-gray-800">{a.name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{a.username}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{a.mobile || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <button onClick={() => handleAgentDelete(a._id)} className="bg-red-100 text-red-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-200 transition">
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Edit Branch Modal — Admin Only */}
            {isAdmin && editModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="bg-[#1e293b] text-white px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold">✏️ Edit Branch</h3>
                            <button onClick={() => setEditModalOpen(false)} className="text-white/70 hover:text-white text-2xl leading-none">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Branch Name</label>
                                <input type="text" name="name" value={editData.name} onChange={handleEditChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
                                <input type="text" name="username" value={editData.username} onChange={handleEditChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                <input type="email" name="email" value={editData.email} onChange={handleEditChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="branch@email.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    New Password <span className="text-gray-400 font-normal text-xs">(leave blank to keep current)</span>
                                </label>
                                <input type="text" name="password" value={editData.password} onChange={handleEditChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter new password..." />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-bold hover:bg-green-700 transition">✅ Save Changes</button>
                                <button type="button" onClick={() => setEditModalOpen(false)} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-bold hover:bg-gray-300 transition">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
