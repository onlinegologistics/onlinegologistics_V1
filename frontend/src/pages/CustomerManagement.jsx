import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { UserPlus, Trash2, Edit3, X, Users, Eye, EyeOff, Lock } from 'lucide-react';
import { canAddCustomer, canUpdateCustomer, canDeleteCustomer, ROLES } from '../utils/permissions';

// Moved OUTSIDE the main component to prevent re-creation on every render
const Modal = ({ show, onClose, title, children }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b">
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
};

// Moved OUTSIDE the main component to prevent re-creation on every render
const FormFields = ({ data, onChange, isEdit, showPassword, setShowPassword }) => (
    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">Name *</label>
                <input type="text" name="name" value={data.name} onChange={onChange} required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Full Name" />
            </div>
            <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">Username *</label>
                <input type="text" name="username" value={data.username} onChange={onChange} required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Username" />
            </div>
        </div>
        <div>
            <label className="text-sm font-semibold text-gray-600 mb-1 block">
                Password {isEdit ? '(leave blank to keep)' : '*'}
            </label>
            <div className="relative">
                <input type={showPassword ? "text" : "password"} name="password" value={data.password} onChange={onChange} required={!isEdit}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm pr-10" placeholder="Password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">Email</label>
                <input type="email" name="email" value={data.email} onChange={onChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Email" />
            </div>
            <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">Mobile</label>
                <input type="text" name="mobile" value={data.mobile} onChange={onChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Mobile" />
            </div>
        </div>
        <div>
            <label className="text-sm font-semibold text-gray-600 mb-1 block">Company</label>
            <input type="text" name="company" value={data.company} onChange={onChange}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Company name" />
        </div>
        <div>
            <label className="text-sm font-semibold text-gray-600 mb-1 block">Address</label>
            <textarea name="address" value={data.address} onChange={onChange} rows={2}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none" placeholder="Address" />
        </div>
    </div>
);

const CustomerManagement = () => {
    const { user } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({
        name: '', username: '', password: '', email: '', mobile: '', address: '', company: '',
    });
    const [editForm, setEditForm] = useState({
        _id: '', name: '', username: '', email: '', mobile: '', address: '', company: '', password: '',
    });

    const config = { headers: { Authorization: `Bearer ${user.token}` } };

    // Check permissions
    const hasAddPermission = canAddCustomer(user?.role);
    const hasEditPermission = canUpdateCustomer(user?.role);
    const hasDeletePermission = canDeleteCustomer(user?.role);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const { data } = await axios.get('/api/auth/customers', config);
            setCustomers(data);
        } catch (error) {
            toast.error('Failed to fetch customers');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/auth/register', { ...form, role: 'customer' }, config);
            toast.success('Customer created successfully!');
            setForm({ name: '', username: '', password: '', email: '', mobile: '', address: '', company: '' });
            setShowModal(false);
            fetchCustomers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create customer');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this customer?')) return;
        try {
            await axios.delete(`/api/auth/${id}`, config);
            toast.success('Customer deleted');
            fetchCustomers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete customer');
        }
    };

    const openEditModal = (c) => {
        setEditForm({
            _id: c._id, name: c.name, username: c.username, email: c.email || '',
            mobile: c.mobile || '', address: c.address || '', company: c.company || '', password: '',
        });
        setEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const updateData = { ...editForm };
            if (!updateData.password) delete updateData.password;
            await axios.put(`/api/auth/${editForm._id}`, updateData, config);
            toast.success('Customer updated');
            setEditModal(false);
            fetchCustomers();
        } catch (error) {
            toast.error('Failed to update customer');
        }
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
                        <Users className="text-blue-600" /> Customer Management
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {user?.role === ROLES.ADMIN ? 'Full access' : user?.role === ROLES.BRANCH ? 'Branch access' : 'View only'}
                    </p>
                </div>
                
                {hasAddPermission ? (
                    <button onClick={() => setShowModal(true)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 shadow-lg">
                        <UserPlus size={18} /> Add Customer
                    </button>
                ) : (
                    <button disabled
                        className="bg-gray-300 text-gray-600 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 cursor-not-allowed opacity-60">
                        <Lock size={18} /> No Permission
                    </button>
                )}
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {customers.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">No customers yet</p>
                        <p className="text-gray-400 text-sm mt-1">Click "Add Customer" to create the first one</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 text-left">
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Username</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Mobile</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Company</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Created By</th>
                                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {customers.map((c, i) => (
                                    <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4 text-sm text-gray-600">{i + 1}</td>
                                        <td className="px-5 py-4 text-sm font-semibold text-gray-800">{c.name}</td>
                                        <td className="px-5 py-4 text-sm text-gray-600">{c.username}</td>
                                        <td className="px-5 py-4 text-sm text-gray-600">{c.email || '-'}</td>
                                        <td className="px-5 py-4 text-sm text-gray-600">{c.mobile || '-'}</td>
                                        <td className="px-5 py-4 text-sm text-gray-600">{c.company || '-'}</td>
                                        <td className="px-5 py-4 text-sm text-gray-500">{c.createdByUser?.name || '-'}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                {hasEditPermission ? (
                                                    <button onClick={() => openEditModal(c)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                        <Edit3 size={16} />
                                                    </button>
                                                ) : (
                                                    <button disabled
                                                        className="p-2 text-gray-300 cursor-not-allowed" title="No edit permission">
                                                        <Edit3 size={16} />
                                                    </button>
                                                )}
                                                
                                                {hasDeletePermission ? (
                                                    <button onClick={() => handleDelete(c._id)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                ) : (
                                                    <button disabled
                                                        className="p-2 text-gray-300 cursor-not-allowed" title="No delete permission">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {hasAddPermission && (
                <Modal show={showModal} onClose={() => setShowModal(false)} title="Create New Customer">
                    <form onSubmit={handleSubmit}>
                        <FormFields data={form} onChange={handleChange} isEdit={false} showPassword={showPassword} setShowPassword={setShowPassword} />
                        <button type="submit"
                            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2">
                            <UserPlus size={18} /> Create Customer
                        </button>
                    </form>
                </Modal>
            )}

            {/* Edit Modal */}
            {hasEditPermission && (
                <Modal show={editModal} onClose={() => setEditModal(false)} title="Edit Customer">
                    <form onSubmit={handleEditSubmit}>
                        <FormFields data={editForm} onChange={handleEditChange} isEdit={true} showPassword={showPassword} setShowPassword={setShowPassword} />
                        <button type="submit"
                            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2">
                            <Edit3 size={18} /> Update Customer
                        </button>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default CustomerManagement;