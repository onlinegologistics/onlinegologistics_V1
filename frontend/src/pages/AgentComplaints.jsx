import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle, Clock, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AgentComplaints = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const config = { headers: { Authorization: `Bearer ${user?.token}` } };

    const fetchComplaints = async () => {
        try {
            const { data } = await axios.get('/api/complaints', config);
            setComplaints(data.complaints);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch complaints');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.token) fetchComplaints();
    }, [user]);

    const filteredComplaints = filter === 'all' ? complaints : complaints.filter(c => c.status === filter);

    const openCount = complaints.filter(c => c.status === 'Open').length;
    const progressCount = complaints.filter(c => c.status === 'In Progress').length;
    const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

    const statusColor = {
        'Open': 'bg-blue-100 text-blue-700 border-blue-200',
        'In Progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
        'Resolved': 'bg-green-100 text-green-700 border-green-200',
        'Closed': 'bg-gray-100 text-gray-700 border-gray-200',
    };

    const priorityColor = {
        'High': 'text-red-600 bg-red-50',
        'Medium': 'text-yellow-600 bg-yellow-50',
        'Low': 'text-green-600 bg-green-50',
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                    <AlertCircle size={24} className="text-red-500" /> My Complaints
                </h1>
                <button
                    onClick={() => navigate('/agent/raise-ticket')}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg"
                >
                    <PlusCircle size={18} /> Raise Ticket
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition" onClick={() => setFilter('all')}>
                    <div className="text-gray-400 text-xs uppercase font-bold">Total</div>
                    <div className="text-2xl font-black text-gray-800">{complaints.length}</div>
                </div>
                <div className={`bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-400 cursor-pointer hover:shadow-md transition ${filter === 'Open' ? 'ring-2 ring-blue-400' : ''}`} onClick={() => setFilter('Open')}>
                    <div className="text-blue-600 text-xs uppercase font-bold flex items-center gap-1"><AlertCircle size={12} /> Open</div>
                    <div className="text-2xl font-black text-blue-600">{openCount}</div>
                </div>
                <div className={`bg-white p-4 rounded-xl shadow-sm border-l-4 border-yellow-400 cursor-pointer hover:shadow-md transition ${filter === 'In Progress' ? 'ring-2 ring-yellow-400' : ''}`} onClick={() => setFilter('In Progress')}>
                    <div className="text-yellow-600 text-xs uppercase font-bold flex items-center gap-1"><Clock size={12} /> In Progress</div>
                    <div className="text-2xl font-black text-yellow-600">{progressCount}</div>
                </div>
                <div className={`bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-400 cursor-pointer hover:shadow-md transition ${filter === 'Resolved' ? 'ring-2 ring-green-400' : ''}`} onClick={() => setFilter('Resolved')}>
                    <div className="text-green-600 text-xs uppercase font-bold flex items-center gap-1"><CheckCircle size={12} /> Resolved</div>
                    <div className="text-2xl font-black text-green-600">{resolvedCount}</div>
                </div>
            </div>

            {/* Complaint List */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">
                        {filter === 'all' ? 'All Complaints' : `${filter} Complaints`} ({filteredComplaints.length})
                    </h2>
                    {filter !== 'all' && (
                        <button onClick={() => setFilter('all')} className="text-xs text-blue-600 font-bold hover:underline">Show All</button>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                ) : filteredComplaints.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <AlertCircle size={40} className="mx-auto mb-2 opacity-50" />
                        <p>No complaints found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredComplaints.map((c) => (
                            <div key={c._id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition bg-gray-50/50">
                                <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor[c.status] || statusColor['Open']}`}>{c.status}</span>
                                        <span className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded">Receipt: {c.receiptNo}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${priorityColor[c.priority] || priorityColor['Medium']}`}>Priority: {c.priority}</span>
                                        <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1 text-lg">{c.subject}</h3>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{c.description}</p>
                                </div>
                                {c.adminResponse && (
                                    <div className="mt-3 bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                                        <strong className="text-blue-600 block mb-1 text-xs uppercase">Admin Response:</strong>
                                        {c.adminResponse}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentComplaints;
