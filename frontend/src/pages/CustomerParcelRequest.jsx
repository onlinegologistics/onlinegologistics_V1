import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Send, MapPin, Calendar, Package, Weight, Hash, MessageSquare, ArrowLeft } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const CustomerParcelRequest = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        pickupAddress: '',
        deliveryAddress: '',
        pickupDate: '',
        packageDescription: '',
        weight: '',
        quantity: 1,
        remarks: '',
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user.token}`,
                },
            };
            await axios.post('/api/parcel-requests', form, config);
            toast.success('Parcel request submitted successfully!');
            setTimeout(() => navigate('/customer/dashboard'), 1500);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/customer/dashboard')}
                    className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors mb-4"
                >
                    <ArrowLeft size={18} />
                    Back to Dashboard
                </button>
                <h1 className="text-2xl font-bold text-gray-800">New Parcel Request</h1>
                <p className="text-gray-500 mt-1">Fill in the details below to request a parcel pickup.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-6 md:p-8 space-y-6">
                {/* Pickup Address */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <MapPin size={16} className="text-emerald-600" />
                        Pickup Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        name="pickupAddress"
                        value={form.pickupAddress}
                        onChange={handleChange}
                        required
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none text-sm"
                        placeholder="Enter complete pickup address"
                    />
                </div>

                {/* Delivery Address */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <MapPin size={16} className="text-red-500" />
                        Delivery Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        name="deliveryAddress"
                        value={form.deliveryAddress}
                        onChange={handleChange}
                        required
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none text-sm"
                        placeholder="Enter complete delivery address"
                    />
                </div>

                {/* Pickup Date & Package Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            <Calendar size={16} className="text-blue-600" />
                            Pickup Date
                        </label>
                        <input
                            type="date"
                            name="pickupDate"
                            value={form.pickupDate}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            <Package size={16} className="text-purple-600" />
                            Package Description
                        </label>
                        <input
                            type="text"
                            name="packageDescription"
                            value={form.packageDescription}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
                            placeholder="e.g., Electronics, Documents"
                        />
                    </div>
                </div>

                {/* Weight & Quantity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            <Weight size={16} className="text-orange-600" />
                            Weight (kg)
                        </label>
                        <input
                            type="number"
                            name="weight"
                            value={form.weight}
                            onChange={handleChange}
                            min="0"
                            step="0.1"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
                            placeholder="Enter weight"
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                            <Hash size={16} className="text-teal-600" />
                            Quantity
                        </label>
                        <input
                            type="number"
                            name="quantity"
                            value={form.quantity}
                            onChange={handleChange}
                            min="1"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
                        />
                    </div>
                </div>

                {/* Remarks */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <MessageSquare size={16} className="text-gray-500" />
                        Remarks
                    </label>
                    <textarea
                        name="remarks"
                        value={form.remarks}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none text-sm"
                        placeholder="Any special instructions or notes"
                    />
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                        <>
                            <Send size={18} />
                            Submit Parcel Request
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default CustomerParcelRequest;
