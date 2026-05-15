import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Calendar, ChevronLeft, ChevronRight, Filter, RefreshCw, Download } from 'lucide-react';
import EnquiryModal from './EnquiryModal';

const EnquiryList = () => {
    const [enquiries, setEnquiries] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalEnquiries: 0,
        limit: 10
    });
    const [loading, setLoading] = useState(false);
    const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
    const { user } = useContext(AuthContext);

    // Filter states
    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0], // Today by default
        endDate: new Date().toISOString().split('T')[0],     // Today by default
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [activeFilter, setActiveFilter] = useState('today');

    useEffect(() => {
        fetchEnquiries();
    }, [filters, currentPage, itemsPerPage]);

    const fetchEnquiries = async () => {
        setLoading(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
                params: {
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                    page: currentPage,
                    limit: itemsPerPage
                }
            };
            const { data } = await axios.get('/api/enquiries', config);
            setEnquiries(data.enquiries);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Failed to fetch enquiries:', error);
            toast.error('Failed to fetch enquiries');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            await axios.put(`/api/enquiries/${id}`, { status: newStatus }, config);
            toast.success('Status updated successfully');
            fetchEnquiries();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleQuickFilter = (filterType) => {
        const today = new Date();
        let startDate, endDate;

        switch (filterType) {
            case 'today':
                startDate = endDate = today.toISOString().split('T')[0];
                break;
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                startDate = endDate = yesterday.toISOString().split('T')[0];
                break;
            case 'last7days':
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                startDate = sevenDaysAgo.toISOString().split('T')[0];
                endDate = today.toISOString().split('T')[0];
                break;
            case 'last30days':
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                startDate = thirtyDaysAgo.toISOString().split('T')[0];
                endDate = today.toISOString().split('T')[0];
                break;
            case 'all':
                startDate = '';
                endDate = '';
                break;
            default:
                return;
        }

        setFilters({ startDate, endDate });
        setCurrentPage(1);
        setActiveFilter(filterType);
    };

    const handleCustomDateChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setCurrentPage(1);
        setActiveFilter('custom');
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

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
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                >
                    {i}
                </button>
            );
        }

        return pages;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'In Progress':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Resolved':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'Closed':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <EnquiryModal
                isOpen={isEnquiryModalOpen}
                onClose={() => {
                    setIsEnquiryModalOpen(false);
                    fetchEnquiries();
                }}
            />
            {/* Header */}
            <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Enquiries Management</h2>
                    <p className="text-gray-600">Manage and track customer enquiries</p>
                </div>
                {(user?.role === 'agent' || user?.role === 'customer') && (
                    <button onClick={() => setIsEnquiryModalOpen(true)} className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition shadow-lg">
                        + New Enquiry
                    </button>
                )}
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-lg shadow-sm p-5 mb-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-800">Filters</h3>
                </div>

                {/* Quick Filter Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {[
                        { id: 'today', label: 'Today' },
                        { id: 'yesterday', label: 'Yesterday' },
                        { id: 'last7days', label: 'Last 7 Days' },
                        { id: 'last30days', label: 'Last 30 Days' },
                        { id: 'all', label: 'All Time' }
                    ].map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => handleQuickFilter(filter.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeFilter === filter.id
                                    ? 'bg-green-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {/* Custom Date Range */}
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            From Date
                        </label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            To Date
                        </label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                    </div>
                    <button
                        onClick={fetchEnquiries}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Results Info */}
            <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-800">{enquiries.length}</span> of{' '}
                    <span className="font-semibold text-gray-800">{pagination.totalEnquiries}</span> enquiries
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Items per page:</label>
                    <select
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-green-50 to-green-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Date & Time
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Mobile
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Message
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <RefreshCw className="w-8 h-8 text-green-600 animate-spin mb-2" />
                                            <p className="text-gray-600">Loading enquiries...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : enquiries.length > 0 ? (
                                enquiries.map((enquiry) => (
                                    <tr key={enquiry._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {new Date(enquiry.createdAt).toLocaleDateString('en-IN')}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(enquiry.createdAt).toLocaleTimeString('en-IN')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900">{enquiry.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{enquiry.mobile}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-700 max-w-md truncate" title={enquiry.message}>
                                                {enquiry.message}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(enquiry.status)}`}>
                                                {enquiry.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {(user?.role === 'admin' || user?.role === 'branch') ? (
                                                <select
                                                    value={enquiry.status}
                                                    onChange={(e) => handleStatusUpdate(enquiry._id, e.target.value)}
                                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer hover:border-green-500 transition-colors"
                                                >
                                                    <option value="Open">Open</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Resolved">Resolved</option>
                                                    <option value="Closed">Closed</option>
                                                </select>
                                            ) : (
                                                <span className="text-sm text-gray-500 italic">No action</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                                <Filter className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-600 font-medium">No enquiries found</p>
                                            <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between bg-white px-6 py-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={!pagination.hasPrevPage}
                            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                pagination.hasPrevPage
                                    ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            }`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {renderPageNumbers()}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={!pagination.hasNextPage}
                            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                pagination.hasNextPage
                                    ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            }`}
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnquiryList;
