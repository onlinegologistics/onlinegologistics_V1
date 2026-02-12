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
        role: 'user', // default role
    });

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

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchUsers();
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
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="border p-2 w-full rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="border p-2 w-full rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Password</label>
                        <input
                            type="text"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="border p-2 w-full rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Role</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="border p-2 w-full rounded"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold"
                        >
                            Add User
                        </button>
                    </div>
                </form>
            </div>

            {/* User List */}
            <div className="bg-white p-4 rounded shadow">
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
                                    <td className="border p-2 flex gap-2">
                                        <Link
                                            to={`/dashboard?userId=${u._id}&name=${encodeURIComponent(u.name)}`}
                                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 flex items-center"
                                        >
                                            View Dashboard
                                        </Link>

                                        <button
                                            onClick={() => handleDelete(u._id)}
                                            className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
