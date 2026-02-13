import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

const UserManagement = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        role: 'user',
    });

    // Edit modal state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [editData, setEditData] = useState({
        name: '',
        username: '',
        password: '',
        role: 'user',
    });

    // Agent state
    const [agents, setAgents] = useState([]);
    const [agentForm, setAgentForm] = useState({ name: '', mobile: '' });

    const config = {
        headers: {
            Authorization: `Bearer ${user?.token}`,
        },
    };

    const fetchUsers = async () => {
        try {
            const { data } = await axios.get('/api/auth/users', config);
            setUsers(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch users');
        }
    };

    const fetchAgents = async () => {
        try {
            const { data } = await axios.get('/api/agents', config);
            setAgents(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch agents');
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchUsers();
        }
        if (user?.token) {
            fetchAgents();
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/auth/register', formData, config);
            toast.success('User Added Successfully');
            setFormData({
                name: '',
                username: '',
                password: '',
                role: 'user',
            });
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add user');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await axios.delete(`/api/auth/${id}`, config);
                toast.success('User Deleted');
                fetchUsers();
            } catch (error) {
                toast.error('Failed to delete user');
            }
        }
    };

    // Open edit modal
    const openEditModal = (u) => {
        setEditUser(u);
        setEditData({
            name: u.name,
            username: u.username,
            password: '',
            role: u.role,
        });
        setEditModalOpen(true);
    };

    // Handle edit form change
    const handleEditChange = (e) => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    // Submit edit
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: editData.name,
                username: editData.username,
                role: editData.role,
            };
            if (editData.password.trim()) {
                payload.password = editData.password;
            }

            await axios.put(`/api/auth/${editUser._id}`, payload, config);
            toast.success('User Updated Successfully');
            setEditModalOpen(false);
            setEditUser(null);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update user');
        }
    };

    // Agent handlers
    const handleAgentChange = (e) => {
        setAgentForm({ ...agentForm, [e.target.name]: e.target.value });
    };

    const handleAgentSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/agents', agentForm, config);
            toast.success('Agent Added Successfully');
            setAgentForm({ name: '', mobile: '' });
            fetchAgents();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add agent');
        }
    };

    const handleAgentDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this agent?')) {
            try {
                await axios.delete(`/api/agents/${id}`, config);
                toast.success('Agent Deleted');
                fetchAgents();
            } catch (error) {
                toast.error('Failed to delete agent');
            }
        }
    };

    if (user?.role !== 'admin') {
        return <div className="p-4 text-red-600 font-bold">Access Denied. Admins Only.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto mt-6">
            <Toaster />
            <h1 className="text-2xl font-bold mb-4">User Management</h1>

            {/* Add User Form */}
            <div className="bg-white p-4 rounded shadow mb-6">
                <h2 className="text-lg font-bold mb-2">Add New User</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="border p-2 w-full rounded" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Username</label>
                        <input type="text" name="username" value={formData.username} onChange={handleChange} className="border p-2 w-full rounded" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Password</label>
                        <input type="text" name="password" value={formData.password} onChange={handleChange} className="border p-2 w-full rounded" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Role</label>
                        <select name="role" value={formData.role} onChange={handleChange} className="border p-2 w-full rounded">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold">Add User</button>
                    </div>
                </form>
            </div>

            {/* User List */}
            <div className="bg-white p-4 rounded shadow mb-6">
                <h2 className="text-lg font-bold mb-2">Existing Users</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full border">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border p-2 text-left">Name</th>
                                <th className="border p-2 text-left">Username</th>
                                <th className="border p-2 text-left">Role</th>
                                <th className="border p-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u._id} className="border-b">
                                    <td className="border p-2">{u.name}</td>
                                    <td className="border p-2">{u.username}</td>
                                    <td className="border p-2 capitalize">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="border p-2">
                                        <div className="flex gap-2 flex-wrap">
                                            <Link
                                                to={`/dashboard?userId=${u._id}&name=${encodeURIComponent(u.name)}`}
                                                className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 flex items-center"
                                            >
                                                View Dashboard
                                            </Link>
                                            <button onClick={() => openEditModal(u)} className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 font-bold">
                                                ✏️ Edit
                                            </button>
                                            <button onClick={() => handleDelete(u._id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700">
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Agent Management Section */}
            <h1 className="text-2xl font-bold mb-4 mt-8">Agent Management</h1>

            {/* Add Agent Form */}
            <div className="bg-white p-4 rounded shadow mb-6">
                <h2 className="text-lg font-bold mb-2">Add New Agent</h2>
                <form onSubmit={handleAgentSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-bold mb-1">Agent Name <span className="text-red-500">*</span></label>
                        <input type="text" name="name" value={agentForm.name} onChange={handleAgentChange} className="border p-2 w-full rounded" placeholder="Enter agent name" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Mobile</label>
                        <input type="text" name="mobile" value={agentForm.mobile} onChange={handleAgentChange} className="border p-2 w-full rounded" placeholder="Agent mobile number" />
                    </div>
                    <div>
                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-bold w-full">+ Add Agent</button>
                    </div>
                </form>
            </div>

            {/* Agent List */}
            <div className="bg-white p-4 rounded shadow">
                <h2 className="text-lg font-bold mb-2">Existing Agents</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full border">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border p-2 text-left">#</th>
                                <th className="border p-2 text-left">Agent Name</th>
                                <th className="border p-2 text-left">Mobile</th>
                                <th className="border p-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {agents.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="border p-4 text-center text-gray-400">No agents added yet.</td>
                                </tr>
                            ) : (
                                agents.map((a, idx) => (
                                    <tr key={a._id} className="border-b">
                                        <td className="border p-2">{idx + 1}</td>
                                        <td className="border p-2 font-semibold">{a.name}</td>
                                        <td className="border p-2">{a.mobile || '-'}</td>
                                        <td className="border p-2">
                                            <button onClick={() => handleAgentDelete(a._id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700">
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

            {/* Edit User Modal */}
            {editModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="bg-[#1e293b] text-white px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold">✏️ Edit User</h3>
                            <button onClick={() => setEditModalOpen(false)} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                                <input type="text" name="name" value={editData.name} onChange={handleEditChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
                                <input type="text" name="username" value={editData.username} onChange={handleEditChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    New Password <span className="text-gray-400 font-normal text-xs">(leave blank to keep current)</span>
                                </label>
                                <input type="text" name="password" value={editData.password} onChange={handleEditChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter new password..." />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                                <select name="role" value={editData.role} onChange={handleEditChange} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
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
