import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import * as XLSX from 'xlsx';

const LuggageTable = () => {
    const [luggage, setLuggage] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const userId = searchParams.get('userId');

    // Today's date as default
    const today = new Date().toISOString().split('T')[0];

    // Filter states — default dateFrom & dateTo to today
    const [agentFilter, setAgentFilter] = useState('');
    const [dateFrom, setDateFrom] = useState(today);
    const [dateTo, setDateTo] = useState(today);
    const [agentsList, setAgentsList] = useState([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        fetchLuggage();
        fetchAgents();
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

            if (userId && (user.role === 'admin' || user.role === 'branch')) {
                config.params.userId = userId;
            }

            const { data } = await axios.get('/api/luggage', config);
            setLuggage(data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const fetchAgents = async () => {
        try {
            const { data } = await axios.get('/api/agents', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setAgentsList(data);
        } catch (error) {
            console.error('Error fetching agents:', error);
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
                fetchLuggage();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Delete failed');
            }
        }
    };

    // Apply all filters
    const filteredLuggage = luggage.filter((item) => {
        const term = searchTerm.toLowerCase();

        // Search filter
        const matchesSearch = !term || (
            (item.manualLrNo && item.manualLrNo.toLowerCase().includes(term)) ||
            (item.senderName && item.senderName.toLowerCase().includes(term)) ||
            (item.receiverName && item.receiverName.toLowerCase().includes(term)) ||
            (item.station && item.station.toLowerCase().includes(term)) ||
            (item.agent && item.agent.toLowerCase().includes(term))
        );

        // Agent filter
        const matchesAgent = !agentFilter || item.agent === agentFilter;

        // Date range filter
        const itemDate = new Date(item.date || item.createdAt).toISOString().split('T')[0];
        const matchesDateFrom = !dateFrom || itemDate >= dateFrom;
        const matchesDateTo = !dateTo || itemDate <= dateTo;

        return matchesSearch && matchesAgent && matchesDateFrom && matchesDateTo;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredLuggage.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedLuggage = filteredLuggage.slice(startIndex, startIndex + itemsPerPage);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, agentFilter, dateFrom, dateTo]);

    // Export to Excel
    const exportToExcel = () => {
        if (filteredLuggage.length === 0) {
            toast.error('No data to export');
            return;
        }

        const exportData = filteredLuggage.map((item, idx) => ({
            '#': idx + 1,
            'Date': new Date(item.date || item.createdAt).toLocaleDateString('en-GB'),
            'LR No': item.manualLrNo || '-',
            'Sender': item.senderName || '',
            'Sender Mobile': item.senderMobile || '',
            'Receiver': item.receiverName || '',
            'Receiver Mobile': item.receiverMobile || '',
            'Destination': item.station || '',
            'Agent': item.agent || '-',
            'No. of Parcels': item.noOfParcels || 0,
            'Weight': item.actualWeight || 0,
            'Payment Mode': item.paymentMode || '',
            'Freight': item.freight || 0,
            'Grand Total': item.grandTotal || 0,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Luggage Entries');

        const filename = `Luggage_Entries_${dateFrom || 'all'}_to_${dateTo || 'all'}.xlsx`;
        XLSX.writeFile(wb, filename);
        toast.success(`Downloaded ${filename}`);
    };

    // Clear all filters (resets to today)
    const clearFilters = () => {
        setAgentFilter('');
        setDateFrom(today);
        setDateTo(today);
        setSearchTerm('');
    };

    const hasCustomFilters = agentFilter || dateFrom !== today || dateTo !== today || searchTerm;

    return (
        <div className="bg-white rounded shadow p-4">
            {/* Search + Filters Row */}
            <div className="space-y-3 mb-4">
                <div className="flex flex-col md:flex-row gap-3">
                    <input
                        type="text"
                        placeholder="Search by LR No, Sender, Receiver, Station, Agent..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={exportToExcel}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-bold flex items-center gap-2 whitespace-nowrap"
                    >
                        📥 Download Excel
                    </button>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-col md:flex-row gap-3 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Agent</label>
                        <select
                            value={agentFilter}
                            onChange={(e) => setAgentFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Agents</option>
                            {agentsList.map((agent) => (
                                <option key={agent._id} value={agent.name}>{agent.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">From Date</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">To Date</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {hasCustomFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-red-500 hover:text-red-700 text-sm font-bold whitespace-nowrap px-3 py-2"
                        >
                            ✕ Clear Filters
                        </button>
                    )}
                </div>

                {/* Results count */}
                <div className="text-xs text-gray-400">
                    Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredLuggage.length)} of {filteredLuggage.length} entries
                    {filteredLuggage.length < luggage.length && ` (filtered from ${luggage.length} total)`}
                </div>
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
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Agent</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedLuggage.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-5 py-8 text-center text-gray-400">No entries found for the selected date.</td>
                            </tr>
                        ) : (
                            paginatedLuggage.map((item) => (
                                <tr key={item._id}>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{new Date(item.date || item.createdAt).toLocaleDateString('en-GB')}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.manualLrNo || '-'}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.senderName}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.receiverName}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.station}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.agent || '-'}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.grandTotal}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <button
                                            onClick={() => window.open(`/print/${item._id}`, '_blank')}
                                            className="text-white bg-blue-600 hover:bg-blue-700 font-bold py-1 px-3 rounded text-xs mr-2"
                                        >
                                            Print
                                        </button>
                                        {(user.role === 'admin' || user.role === 'branch') && (
                                            <button
                                                onClick={() => deleteLuggage(item._id)}
                                                className="text-white bg-red-600 hover:bg-red-700 font-bold py-1 px-3 rounded text-xs"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg text-sm font-bold ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                        ← Previous
                    </button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                                // Show first, last, current, and pages around current
                                return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                            })
                            .reduce((pages, page, i, arr) => {
                                // Add ellipsis between non-consecutive pages
                                if (i > 0 && page - arr[i - 1] > 1) {
                                    pages.push('...');
                                }
                                pages.push(page);
                                return pages;
                            }, [])
                            .map((page, idx) =>
                                page === '...' ? (
                                    <span key={`dots-${idx}`} className="px-2 text-gray-400">...</span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-9 h-9 rounded-lg text-sm font-bold ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    >
                                        {page}
                                    </button>
                                )
                            )}
                    </div>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-lg text-sm font-bold ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
};

export default LuggageTable;
