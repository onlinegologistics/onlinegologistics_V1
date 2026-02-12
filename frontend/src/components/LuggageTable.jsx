import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

const LuggageTable = () => {
    const [luggage, setLuggage] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const userId = searchParams.get('userId');

    useEffect(() => {
        fetchLuggage();
    }, [userId]);

    const fetchLuggage = async () => {
        try {
            const token = user.token;
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {}
            };

            if (userId && user.role === 'admin') {
                config.params.userId = userId;
            }

            const { data } = await axios.get('/api/luggage', config);
            setLuggage(data);
        } catch (error) {
            console.error('Error fetching data:', error);
            // toast.error('Failed to load data');
        }
    };

    const deleteLuggage = async (id) => {
        if (window.confirm('Are you sure you want to delete this entry?')) {
            try {
                const token = user.token;
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                };
                await axios.delete(`/api/luggage/${id}`, config);
                toast.success('Entry Deleted');
                fetchLuggage(); // Refresh list
            } catch (error) {
                toast.error(error.response?.data?.message || 'Delete failed');
            }
        }
    };

    const filteredLuggage = luggage.filter((item) => {
        const term = searchTerm.toLowerCase();
        return (
            (item.manualLrNo && item.manualLrNo.toLowerCase().includes(term)) ||
            (item.senderName && item.senderName.toLowerCase().includes(term)) ||
            (item.receiverName && item.receiverName.toLowerCase().includes(term)) ||
            (item.station && item.station.toLowerCase().includes(term))
        );
    });

    return (
        <div className="bg-white rounded shadow p-4">
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by LR No, Sender, Receiver, or Station..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">LR No</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sender</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Receiver</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dest.</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLuggage.map((item) => (
                            <tr key={item._id}>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{new Date(item.createdAt).toLocaleDateString()}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.manualLrNo || '-'}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.senderName}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.receiverName}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.station}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.grandTotal}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <button
                                        onClick={() => window.open(`/print/${item._id}`, '_blank')}
                                        className="text-white bg-blue-600 hover:bg-blue-700 font-bold py-1 px-3 rounded text-xs mr-2"
                                    >
                                        Print
                                    </button>
                                    {user.role === 'admin' && (
                                        <button
                                            onClick={() => deleteLuggage(item._id)}
                                            className="text-white bg-red-600 hover:bg-red-700 font-bold py-1 px-3 rounded text-xs"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LuggageTable;
