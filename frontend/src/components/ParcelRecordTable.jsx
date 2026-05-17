import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Eye, X } from 'lucide-react';
import ViewDetailsModal from './ViewDetailsModal';

const ParcelRecordTable = ({ limit }) => {
    const { user } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState(null);

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user?.token}` } };
                const { data } = await axios.get('/api/parcel-records', config);
                
                let sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                if (limit) {
                    sortedData = sortedData.slice(0, limit);
                }
                setRecords(sortedData);
            } catch (e) {
                console.error('Failed to load parcel records', e);
            } finally {
                setLoading(false);
            }
        };

        if (user?.token) {
            fetchRecords();
        }
    }, [user, limit]);

    const typeLabel = (t) => t === 'regular' ? 'Client' : t === 'agent' ? 'Agent' : t === 'Customer' ? 'Customer' : t;
    const typeBadge = (t) => {
        const c = t === 'regular' ? 'bg-blue-100 text-blue-700' : t === 'agent' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700';
        return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c}`}>{typeLabel(t)}</span>;
    };
    const statusBadge = (s) => {
        const c = s === 'Delivered' ? 'bg-green-100 text-green-700' : s === 'Cancelled' ? 'bg-red-100 text-red-700' : s === 'In Transit' ? 'bg-yellow-100 text-yellow-700' : s === 'Mixed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700';
        return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c}`}>{s}</span>;
    };

    if (loading) return <div className="p-4 text-center text-gray-500">Loading records...</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-100 text-left">
                        <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Route</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Parcels</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Total ₹</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {records.length === 0 ? (
                        <tr>
                            <td colSpan="9" className="px-5 py-8 text-center text-gray-400">No recent entries found.</td>
                        </tr>
                    ) : (
                        records.map((r) => {
                            const dests = r.destinations && r.destinations.length > 0 ? r.destinations : [r];
                            const toCityStr = dests.map(d => d.toCity).join(', ');
                            const totalParcels = dests.reduce((sum, d) => sum + (Number(d.noOfParcels) || 0), 0);
                            const totalAmount = dests.reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0);
                            const statuses = [...new Set(dests.map(d => d.status))];
                            const displayStatus = statuses.length === 1 ? statuses[0] : 'Mixed';

                            return (
                                <tr key={r._id} className="hover:bg-gray-50 bg-white">
                                    <td className="px-5 py-4 text-gray-700 whitespace-nowrap">{new Date(r.date).toLocaleDateString('en-IN')}</td>
                                    <td className="px-5 py-4">{typeBadge(r.clientType)}</td>
                                    <td className="px-5 py-4 font-semibold text-gray-800">{r.clientName}</td>
                                    <td className="px-5 py-4 text-gray-600">{r.company || '-'}</td>
                                    <td className="px-5 py-4 text-gray-600">
                                        {r.fromCity} → <span className="font-semibold">{toCityStr}</span>
                                    </td>
                                    <td className="px-5 py-4 text-gray-700 font-semibold text-center">{totalParcels}</td>
                                    <td className="px-5 py-4 font-bold text-green-700">₹{totalAmount}</td>
                                    <td className="px-5 py-4">{statusBadge(displayStatus)}</td>
                                    <td className="px-5 py-4 text-right">
                                        <button onClick={() => setSelectedRecord(r)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>

            {/* View Details Modal */}
            {selectedRecord && (
                <ViewDetailsModal 
                    record={selectedRecord} 
                    onClose={() => setSelectedRecord(null)} 
                    onUpdate={() => {
                        const fetchRecords = async () => {
                            try {
                                const config = { headers: { Authorization: `Bearer ${user?.token}` } };
                                const { data } = await axios.get('/api/parcel-records', config);
                                let sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                                if (limit) sortedData = sortedData.slice(0, limit);
                                setRecords(sortedData);
                            } catch (e) {
                                console.error('Failed to load parcel records', e);
                            }
                        };
                        fetchRecords();
                        setSelectedRecord(null);
                    }}
                    config={{ headers: { Authorization: `Bearer ${user?.token}` } }}
                />
            )}
        </div>
    );
};

export default ParcelRecordTable;
