import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { 
    FileText, 
    Calendar, 
    Filter, 
    Download, 
    Printer,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    MapPin,
    Package,
    DollarSign
} from 'lucide-react';

const Reports = () => {
    const { user } = useAuth();
    const [luggageData, setLuggageData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        fromStation: '',
        toStation: '',
        paymentMode: '',
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Stats
    const [stats, setStats] = useState({
        totalRecords: 0,
        totalAmount: 0,
        paidAmount: 0,
        toPayAmount: 0,
        creditAmount: 0,
    });

    const config = {
        headers: {
            Authorization: `Bearer ${user?.token}`,
        },
    };

    // Fetch all luggage data
    const fetchReportData = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/luggage', config);
            setLuggageData(data);
            setFilteredData(data);
            calculateStats(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch report data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchReportData();
        }
    }, [user]);

    // Calculate statistics
    const calculateStats = (data) => {
        const totalRecords = data.length;
        const totalAmount = data.reduce((sum, item) => sum + (parseFloat(item.grandTotal) || 0), 0);
        const paidAmount = data.filter(item => item.paymentMode === 'Paid').reduce((sum, item) => sum + (parseFloat(item.grandTotal) || 0), 0);
        const toPayAmount = data.filter(item => item.paymentMode === 'ToPay').reduce((sum, item) => sum + (parseFloat(item.grandTotal) || 0), 0);
        const creditAmount = data.filter(item => item.paymentMode === 'Credit').reduce((sum, item) => sum + (parseFloat(item.grandTotal) || 0), 0);

        setStats({
            totalRecords,
            totalAmount: totalAmount.toFixed(2),
            paidAmount: paidAmount.toFixed(2),
            toPayAmount: toPayAmount.toFixed(2),
            creditAmount: creditAmount.toFixed(2),
        });
    };

    // Apply filters
    const applyFilters = () => {
        let filtered = [...luggageData];

        // Date filter
        if (filters.startDate) {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.date);
                const startDate = new Date(filters.startDate);
                return itemDate >= startDate;
            });
        }

        if (filters.endDate) {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.date);
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                return itemDate <= endDate;
            });
        }

        // Station filter (Destination)
        if (filters.toStation) {
            filtered = filtered.filter(item => 
                item.station?.toLowerCase().includes(filters.toStation.toLowerCase())
            );
        }

        // Payment mode filter
        if (filters.paymentMode) {
            filtered = filtered.filter(item => item.paymentMode === filters.paymentMode);
        }

        setFilteredData(filtered);
        calculateStats(filtered);
        setCurrentPage(1);
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            fromStation: '',
            toStation: '',
            paymentMode: '',
        });
        setFilteredData(luggageData);
        calculateStats(luggageData);
        setCurrentPage(1);
    };

    // Helper function to check if field has value
    const hasValue = (value) => {
        return value !== null && value !== undefined && value !== '' && value !== 0;
    };

    // Get unique stations for dropdown
    const uniqueStations = [...new Set(luggageData.map(item => item.station))].filter(Boolean);

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Export to CSV
    const exportToCSV = () => {
        const headers = ['LR No', 'Date', 'Sender', 'Receiver', 'Destination', 'Parcels', 'Payment Mode', 'Amount'];
        const csvData = filteredData.map(item => [
            item.manualLrNo || item._id.slice(-8),
            new Date(item.date).toLocaleDateString('en-GB'),
            item.senderName,
            item.receiverName,
            item.station,
            item.noOfParcels,
            item.paymentMode,
            item.grandTotal
        ]);

        const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `luggage_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('Report exported successfully!');
    };

    // Print report
    const printReport = () => {
        window.print();
    };

    const renderPaginationButtons = () => {
        if (totalPages <= 1) return null;

        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        i === currentPage
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                >
                    {i}
                </button>
            );
        }

        return (
            <div className="flex items-center justify-center gap-2 mt-6 print:hidden">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                </button>

                <div className="flex items-center gap-2">
                    {pages}
                </div>

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                >
                    Next
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        );
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="mb-8 print:mb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                            <FileText className="w-10 h-10 text-purple-600" />
                            Luggage Reports
                        </h1>
                        <p className="text-gray-600">Comprehensive report with filters and analytics</p>
                    </div>
                    <div className="flex gap-3 print:hidden">
                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-700 font-medium transition-all"
                        >
                            <Download className="w-5 h-5" />
                            Export CSV
                        </button>
                        <button
                            onClick={printReport}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 font-medium transition-all"
                        >
                            <Printer className="w-5 h-5" />
                            Print
                        </button>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 print:grid-cols-5">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Total Records</p>
                            <p className="text-3xl font-bold mt-1">{stats.totalRecords}</p>
                        </div>
                        <Package className="w-12 h-12 text-purple-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Total Amount</p>
                            <p className="text-2xl font-bold mt-1">₹{stats.totalAmount}</p>
                        </div>
                        <DollarSign className="w-12 h-12 text-green-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Paid</p>
                            <p className="text-2xl font-bold mt-1">₹{stats.paidAmount}</p>
                        </div>
                        <TrendingUp className="w-12 h-12 text-blue-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-100 text-sm font-medium">To Pay</p>
                            <p className="text-2xl font-bold mt-1">₹{stats.toPayAmount}</p>
                        </div>
                        <TrendingUp className="w-12 h-12 text-yellow-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-medium">Credit</p>
                            <p className="text-2xl font-bold mt-1">₹{stats.creditAmount}</p>
                        </div>
                        <TrendingUp className="w-12 h-12 text-orange-200" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6 print:hidden">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-6 h-6 text-purple-600" />
                    <h2 className="text-xl font-bold text-gray-800">Filters</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold mb-2 text-gray-700">
                            <Calendar className="w-4 h-4 text-purple-600" />
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="border-2 border-gray-300 p-2 w-full rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold mb-2 text-gray-700">
                            <Calendar className="w-4 h-4 text-purple-600" />
                            End Date
                        </label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="border-2 border-gray-300 p-2 w-full rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold mb-2 text-gray-700">
                            <MapPin className="w-4 h-4 text-purple-600" />
                            Destination
                        </label>
                        <select
                            value={filters.toStation}
                            onChange={(e) => setFilters({ ...filters, toStation: e.target.value })}
                            className="border-2 border-gray-300 p-2 w-full rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        >
                            <option value="">All Destinations</option>
                            {uniqueStations.map((station, idx) => (
                                <option key={idx} value={station}>{station}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold mb-2 text-gray-700">
                            <DollarSign className="w-4 h-4 text-purple-600" />
                            Payment Mode
                        </label>
                        <select
                            value={filters.paymentMode}
                            onChange={(e) => setFilters({ ...filters, paymentMode: e.target.value })}
                            className="border-2 border-gray-300 p-2 w-full rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        >
                            <option value="">All Modes</option>
                            <option value="Paid">Paid</option>
                            <option value="ToPay">To Pay</option>
                            <option value="Credit">Credit</option>
                            <option value="FOC">FOC</option>
                        </select>
                    </div>

                    <div className="flex items-end gap-2">
                        <button
                            onClick={applyFilters}
                            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg font-medium transition-all flex-1"
                        >
                            Apply
                        </button>
                        <button
                            onClick={resetFilters}
                            className="bg-gray-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-gray-600 font-medium transition-all"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Table */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4 print:mb-2">
                    <h2 className="text-xl font-bold text-gray-800">Report Data</h2>
                    <div className="text-sm text-gray-600">
                        Showing <span className="font-semibold text-gray-800">{currentItems.length}</span> of{' '}
                        <span className="font-semibold text-gray-800">{filteredData.length}</span> records
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    {loading ? (
                        <div className="text-center p-12">
                            <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
                            <p className="text-gray-600">Loading report data...</p>
                        </div>
                    ) : currentItems.length === 0 ? (
                        <div className="text-center p-12">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-600 font-medium">No records found</p>
                            <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gradient-to-r from-purple-50 to-purple-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">LR No</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Sender</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Receiver</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Destination</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Parcels</th>
                                    {/* Only show columns that have data in filtered results */}
                                    {currentItems.some(item => hasValue(item.weight)) && (
                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Weight</th>
                                    )}
                                    {currentItems.some(item => hasValue(item.senderGst)) && (
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Sender GST</th>
                                    )}
                                    {currentItems.some(item => hasValue(item.receiverGst)) && (
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Receiver GST</th>
                                    )}
                                    {currentItems.some(item => hasValue(item.ewayBillNo)) && (
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">E-way Bill</th>
                                    )}
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Payment</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentItems.map((item, idx) => (
                                    <tr key={item._id} className="hover:bg-purple-50 transition-colors">
                                        <td className="px-4 py-3 font-semibold text-purple-900">
                                            {item.manualLrNo || `LR-${item._id.slice(-8)}`}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {new Date(item.date).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{item.senderName}</div>
                                            {hasValue(item.senderMobile) && (
                                                <div className="text-xs text-gray-500">{item.senderMobile}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{item.receiverName}</div>
                                            {hasValue(item.receiverMobile) && (
                                                <div className="text-xs text-gray-500">{item.receiverMobile}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                                {item.station}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-semibold">
                                            {item.noOfParcels} {item.unit}
                                        </td>
                                        {currentItems.some(i => hasValue(i.weight)) && (
                                            <td className="px-4 py-3 text-center">
                                                {hasValue(item.weight) ? `${item.weight} kg` : '-'}
                                            </td>
                                        )}
                                        {currentItems.some(i => hasValue(i.senderGst)) && (
                                            <td className="px-4 py-3 text-xs">
                                                {hasValue(item.senderGst) ? item.senderGst : '-'}
                                            </td>
                                        )}
                                        {currentItems.some(i => hasValue(i.receiverGst)) && (
                                            <td className="px-4 py-3 text-xs">
                                                {hasValue(item.receiverGst) ? item.receiverGst : '-'}
                                            </td>
                                        )}
                                        {currentItems.some(i => hasValue(i.ewayBillNo)) && (
                                            <td className="px-4 py-3 text-xs">
                                                {hasValue(item.ewayBillNo) ? item.ewayBillNo : '-'}
                                            </td>
                                        )}
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                item.paymentMode === 'Paid' ? 'bg-green-100 text-green-800' :
                                                item.paymentMode === 'ToPay' ? 'bg-yellow-100 text-yellow-800' :
                                                item.paymentMode === 'Credit' ? 'bg-orange-100 text-orange-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {item.paymentMode}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-green-700">
                                            ₹{parseFloat(item.grandTotal).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {renderPaginationButtons()}
            </div>
        </div>
    );
};

export default Reports;
