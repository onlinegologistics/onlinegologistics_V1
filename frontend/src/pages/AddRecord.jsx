import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import {
    Plus,
    Download,
    Trash2,
    Users,
    Briefcase,
    CalendarClock,
    ChevronUp,
    Eye,
    X,
    Package,
    DollarSign,
    TrendingUp,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import ViewDetailsModal from '../components/ViewDetailsModal';

const TABS = [
    { id: 'regular', label: 'Client', icon: Users, color: 'blue' },
    { id: 'agent', label: 'Agent', icon: Briefcase, color: 'green' },
    { id: 'Customer', label: 'Customer', icon: CalendarClock, color: 'purple' },
];

const emptyClient = {
    clientName: '', mobile: '', address: '', company: '',
    fromCity: '', date: new Date().toISOString().split('T')[0],
};

const emptyDest = {
    toCity: '', noOfParcels: 1, weight: '', parcelType: '',
    freight: 0, otherCharges: 0, totalAmount: 0, paymentMode: 'Paid', status: 'Booked',
    description: '', remarks: ''
};

const AddRecord = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState('regular');

    const [clientForm, setClientForm] = useState({ ...emptyClient, fromCity: 'Pune' });
    const [destinations, setDestinations] = useState([{ ...emptyDest }]);
    
    const [records, setRecords] = useState([]);
    const [fetchingRecords, setFetchingRecords] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [filterType, setFilterType] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    
    const [selectedRecord, setSelectedRecord] = useState(null); // For View Details modal

    const getAuthHeaders = () => {
        const token = user?.token || JSON.parse(localStorage.getItem('userInfo') || '{}')?.token;
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const fetchRecords = async () => {
        setFetchingRecords(true);
        try {
            const headers = getAuthHeaders();
            const params = filterType ? { clientType: filterType } : {};
            const { data } = await axios.get('/api/parcel-records', { headers, params });
            setRecords(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Failed to load parcel records:', e);
            toast.error(e.response?.data?.message || 'Failed to load records');
        } finally {
            setFetchingRecords(false);
        }
    };

    useEffect(() => {
        fetchRecords();
        setCurrentPage(1);
    }, [filterType]);

    const formatCurrency = (val) => {
        const num = Number(val) || 0;
        if (isNaN(num) || !isFinite(num)) return '0.00';
        return num.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const stats = useMemo(() => {
        let tRecords = records.length;
        let tAmount = 0;
        let pAmount = 0;
        let tpAmount = 0;
        let cAmount = 0;

        for (let i = 0; i < records.length; i++) {
            const r = records[i];
            const dests = r.destinations && r.destinations.length > 0 ? r.destinations : [r];
            for (let j = 0; j < dests.length; j++) {
                const d = dests[j];
                const amt = parseFloat(d.totalAmount) || 0;
                if (amt > 0 && amt < 1e12) {
                    tAmount += amt;
                    const pMode = d.paymentMode || r.paymentMode || 'Paid';
                    if (pMode === 'Paid') pAmount += amt;
                    else if (pMode === 'ToPay') tpAmount += amt;
                    else if (pMode === 'Credit') cAmount += amt;
                }
            }
        }

        return {
            totalRecords: tRecords,
            totalAmount: tAmount,
            paidAmount: pAmount,
            toPayAmount: tpAmount,
            creditAmount: cAmount,
        };
    }, [records]);

    const filteredRecords = useMemo(() => {
        if (!searchQuery.trim()) return records;
        const q = searchQuery.toLowerCase().trim();

        return records.filter(r => {
            const clientName = (r.clientName || '').toLowerCase();
            const mobile = String(r.mobile || '');
            if (clientName.includes(q) || mobile.includes(q)) return true;

            const company = (r.company || '').toLowerCase();
            const fromCity = (r.fromCity || '').toLowerCase();
            if (company.includes(q) || fromCity.includes(q)) return true;

            const branch = (r.createdBy?.name || '').toLowerCase();
            if (branch.includes(q)) return true;

            const dests = r.destinations && r.destinations.length > 0 ? r.destinations : [r];
            for (let i = 0; i < dests.length; i++) {
                const d = dests[i];
                if ((d.toCity && d.toCity.toLowerCase().includes(q)) ||
                    (d.status && d.status.toLowerCase().includes(q))) {
                    return true;
                }
            }

            return false;
        });
    }, [records, searchQuery]);

    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRecords = useMemo(() => {
        return filteredRecords.slice(indexOfFirstItem, indexOfLastItem);
    }, [filteredRecords, indexOfFirstItem, indexOfLastItem]);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const handleClientChange = (e) => {
        setClientForm({ ...clientForm, [e.target.name]: e.target.value });
    };

    const handleDestChange = (index, e) => {
        const { name, value } = e.target;
        const newDests = [...destinations];
        newDests[index][name] = value;
        
        if (name === 'freight' || name === 'otherCharges') {
            const f = parseFloat(newDests[index].freight) || 0;
            const o = parseFloat(newDests[index].otherCharges) || 0;
            newDests[index].totalAmount = f + o;
        }
        setDestinations(newDests);
    };

    const addDestination = () => {
        setDestinations([...destinations, { ...emptyDest }]);
    };

    const removeDestination = (index) => {
        if (destinations.length > 1) {
            setDestinations(destinations.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!clientForm.clientName || !clientForm.mobile) {
            return toast.error('Client Name and Mobile are required');
        }
        
        for (let i = 0; i < destinations.length; i++) {
            if (!destinations[i].toCity) {
                return toast.error(`To City is required for destination ${i + 1}`);
            }
        }

        setLoading(true);
        try {
            const headers = getAuthHeaders();
            const payload = {
                clientType: tab,
                ...clientForm,
                destinations: destinations
            };

            const { data } = await axios.post('/api/parcel-records', payload, { headers });
            if (data?.whatsappSent) {
                toast.success('Record added & WhatsApp confirmation sent! 📦');
            } else {
                toast.success('Record added successfully! 📦');
            }

            setClientForm({ ...emptyClient, fromCity: 'Pune' });
            setDestinations([{ ...emptyDest }]);
            setShowForm(false);
            fetchRecords();
        } catch (e) { 
            toast.error(e.response?.data?.message || 'Failed to save record'); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this record?')) return;
        try {
            const headers = getAuthHeaders();
            await axios.delete(`/api/parcel-records/${id}`, { headers });
            toast.success('Deleted');
            fetchRecords();
        } catch (e) { 
            toast.error(e.response?.data?.message || 'Delete failed'); 
        }
    };

    const handleDownload = async () => {
        try {
            const headers = getAuthHeaders();
            const params = filterType ? { clientType: filterType } : {};
            const res = await axios.get('/api/parcel-records/download/csv', {
                headers,
                params,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `parcel_records_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('CSV Downloaded!');
        } catch (e) { 
            toast.error(e.response?.data?.message || 'Download failed'); 
        }
    };

    const typeLabel = (t) => t === 'regular' ? 'Client' : t === 'agent' ? 'Agent' : t === 'Customer' ? 'Customer' : t;
    const typeBadge = (t) => {
        const c = t === 'regular' ? 'bg-blue-100 text-blue-700' : t === 'agent' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700';
        return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c}`}>{typeLabel(t)}</span>;
    };
    const statusBadge = (s) => {
        const c = s === 'Delivered' ? 'bg-green-100 text-green-700' : s === 'Cancelled' ? 'bg-red-100 text-red-700' : s === 'In Transit' ? 'bg-yellow-100 text-yellow-700' : s === 'Mixed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700';
        return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c}`}>{s}</span>;
    };

    return (
        <div className="space-y-5">
            <Toaster position="top-right" />
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">📦 Parcel Records</h1>
                    <p className="text-gray-500 text-sm">Client, Agent, Customer ke parcel records</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setShowForm(!showForm)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 flex items-center gap-1.5 shadow-lg text-sm">
                        {showForm ? <><ChevronUp size={16} /> Hide Form</> : <><Plus size={16} /> New Entry</>}
                    </button>
                    <button onClick={handleDownload}
                        className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-700 flex items-center gap-1.5 shadow text-sm">
                        <Download size={16} /> Download CSV
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow">
                    <p className="text-xs uppercase font-medium opacity-80">Total Records</p>
                    <div className="flex justify-between items-end mt-1">
                        <h3 className="text-2xl font-bold">{stats.totalRecords.toLocaleString('en-IN')}</h3>
                        <Package size={24} className="opacity-60" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-4 rounded-xl shadow">
                    <p className="text-xs uppercase font-medium opacity-80">Total Amount</p>
                    <div className="flex justify-between items-end mt-1">
                        <h3 className="text-2xl font-bold">₹{formatCurrency(stats.totalAmount)}</h3>
                        <DollarSign size={24} className="opacity-60" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow">
                    <p className="text-xs uppercase font-medium opacity-80">Paid</p>
                    <div className="flex justify-between items-end mt-1">
                        <h3 className="text-2xl font-bold">₹{formatCurrency(stats.paidAmount)}</h3>
                        <TrendingUp size={24} className="opacity-60" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-4 rounded-xl shadow">
                    <p className="text-xs uppercase font-medium opacity-80">To Pay</p>
                    <div className="flex justify-between items-end mt-1">
                        <h3 className="text-2xl font-bold">₹{formatCurrency(stats.toPayAmount)}</h3>
                        <TrendingUp size={24} className="opacity-60" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-xl shadow col-span-2 md:col-span-1">
                    <p className="text-xs uppercase font-medium opacity-80">Credit</p>
                    <div className="flex justify-between items-end mt-1">
                        <h3 className="text-2xl font-bold">₹{formatCurrency(stats.creditAmount)}</h3>
                        <TrendingUp size={24} className="opacity-60" />
                    </div>
                </div>
            </div>

            {/* Collapsible Form */}
            {showForm && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-800">Add New Parcel Record</h2>
                        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tab Selection */}
                    <div className="flex gap-2 mb-6 border-b border-gray-200 pb-3">
                        {TABS.map((t) => {
                            const Icon = t.icon;
                            const isActive = tab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                                        isActive
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <Icon size={16} />
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Client Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    {tab === 'regular' ? 'Client Name' : tab === 'agent' ? 'Agent Name' : 'Customer Name'} *
                                </label>
                                <input
                                    type="text"
                                    name="clientName"
                                    value={clientForm.clientName}
                                    onChange={handleClientChange}
                                    required
                                    placeholder="Full name"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Mobile Number *</label>
                                <input
                                    type="tel"
                                    name="mobile"
                                    value={clientForm.mobile}
                                    onChange={handleClientChange}
                                    required
                                    placeholder="10-digit mobile"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Company / Business</label>
                                <input
                                    type="text"
                                    name="company"
                                    value={clientForm.company}
                                    onChange={handleClientChange}
                                    placeholder="Company name"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">From City</label>
                                <input
                                    type="text"
                                    name="fromCity"
                                    value={clientForm.fromCity}
                                    onChange={handleClientChange}
                                    placeholder="Origin city"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Booking Date</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={clientForm.date}
                                    onChange={handleClientChange}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={clientForm.address}
                                    onChange={handleClientChange}
                                    placeholder="Full address"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Destinations */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <h3 className="text-sm font-bold text-gray-700">Parcel Destinations</h3>
                                <button
                                    type="button"
                                    onClick={addDestination}
                                    className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                                >
                                    <Plus size={14} /> Add Destination
                                </button>
                            </div>

                            {destinations.map((dest, index) => (
                                <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3 relative">
                                    {destinations.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeDestination(index)}
                                            className="absolute top-3 right-3 text-red-400 hover:text-red-600"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}

                                    <div className="text-xs font-bold text-gray-500 mb-2">
                                        Destination #{index + 1}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">To City *</label>
                                            <input
                                                type="text"
                                                name="toCity"
                                                value={dest.toCity}
                                                onChange={(e) => handleDestChange(index, e)}
                                                required
                                                placeholder="Destination city"
                                                className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">No. of Parcels</label>
                                            <input
                                                type="number"
                                                name="noOfParcels"
                                                min="1"
                                                value={dest.noOfParcels}
                                                onChange={(e) => handleDestChange(index, e)}
                                                className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Weight</label>
                                            <input
                                                type="text"
                                                name="weight"
                                                value={dest.weight}
                                                onChange={(e) => handleDestChange(index, e)}
                                                placeholder="e.g. 5 kg"
                                                className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Parcel Type</label>
                                            <input
                                                type="text"
                                                name="parcelType"
                                                value={dest.parcelType}
                                                onChange={(e) => handleDestChange(index, e)}
                                                placeholder="Box, Bag, etc."
                                                className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Freight (₹)</label>
                                            <input
                                                type="number"
                                                name="freight"
                                                min="0"
                                                value={dest.freight}
                                                onChange={(e) => handleDestChange(index, e)}
                                                className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Other Charges (₹)</label>
                                            <input
                                                type="number"
                                                name="otherCharges"
                                                min="0"
                                                value={dest.otherCharges}
                                                onChange={(e) => handleDestChange(index, e)}
                                                className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Total (₹)</label>
                                            <input
                                                type="number"
                                                name="totalAmount"
                                                value={dest.totalAmount}
                                                readOnly
                                                className="w-full px-3 py-1.5 border rounded-lg text-sm bg-gray-100 font-bold text-gray-700"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Payment Mode</label>
                                            <select
                                                name="paymentMode"
                                                value={dest.paymentMode}
                                                onChange={(e) => handleDestChange(index, e)}
                                                className="w-full px-3 py-1.5 border rounded-lg text-sm bg-white"
                                            >
                                                <option value="Paid">Paid</option>
                                                <option value="ToPay">To Pay</option>
                                                <option value="Credit">Credit</option>
                                                <option value="FOC">FOC</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-5 py-2 border rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-md shadow-blue-200"
                            >
                                {loading ? 'Saving...' : 'Save Record'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table & Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-500 uppercase">Filter:</span>
                        <button
                            onClick={() => setFilterType('')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                filterType === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterType('regular')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                filterType === 'regular' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Client
                        </button>
                        <button
                            onClick={() => setFilterType('agent')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                filterType === 'agent' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Agent
                        </button>
                        <button
                            onClick={() => setFilterType('Customer')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                filterType === 'Customer' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Customer
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search client, mobile, route..."
                                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                            className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={10}>10 / page</option>
                            <option value={25}>25 / page</option>
                            <option value={50}>50 / page</option>
                            <option value={100}>100 / page</option>
                        </select>
                    </div>
                </div>

                {fetchingRecords ? (
                    <div className="text-center py-12 text-gray-400 text-sm">
                        Loading records...
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Package size={48} className="mx-auto mb-2 opacity-30" />
                        <p className="font-semibold text-gray-600">No records found</p>
                        <p className="text-xs text-gray-400 mt-1">Add a record to get started</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                                    <tr>
                                        <th className="py-3 px-3 text-left">Date</th>
                                        <th className="py-3 px-3 text-left">Type</th>
                                        <th className="py-3 px-3 text-left">Client</th>
                                        <th className="py-3 px-3 text-left">Mobile</th>
                                        <th className="py-3 px-3 text-left">Route</th>
                                        <th className="py-3 px-3 text-center">Parcels</th>
                                        <th className="py-3 px-3 text-right">Total (₹)</th>
                                        <th className="py-3 px-3 text-center">Payment</th>
                                        <th className="py-3 px-3 text-center">Status</th>
                                        <th className="py-3 px-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {currentRecords.map((r) => {
                                        const dests = r.destinations && r.destinations.length > 0 ? r.destinations : [r];
                                        const firstDest = dests[0] || {};
                                        const routeText = dests.length > 1
                                            ? `${r.fromCity || '-'} -> ${firstDest.toCity || '-'} (+${dests.length - 1} more)`
                                            : `${r.fromCity || '-'} -> ${firstDest.toCity || '-'}`;
                                        const totalParcels = dests.reduce((acc, d) => acc + (Number(d.noOfParcels) || 0), 0);
                                        const totalAmt = dests.reduce((acc, d) => acc + (parseFloat(d.totalAmount) || 0), 0);
                                        const pMode = dests.length === 1 ? (firstDest.paymentMode || r.paymentMode || 'Paid') : 'Mixed';
                                        const pStatus = dests.length === 1 ? (firstDest.status || r.status || 'Booked') : 'Mixed';

                                        return (
                                            <tr key={r._id} className="hover:bg-gray-50/80 transition">
                                                <td className="py-3 px-3 text-gray-600 whitespace-nowrap">
                                                    {new Date(r.date || r.createdAt).toLocaleDateString('en-IN')}
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    {typeBadge(r.clientType)}
                                                </td>
                                                <td className="py-3 px-3 font-semibold text-gray-800">
                                                    {r.clientName}
                                                    {r.company && <span className="block text-[10px] text-gray-400 font-normal">{r.company}</span>}
                                                </td>
                                                <td className="py-3 px-3 text-gray-600 whitespace-nowrap font-mono">
                                                    {r.mobile}
                                                </td>
                                                <td className="py-3 px-3 text-gray-700">
                                                    {routeText}
                                                </td>
                                                <td className="py-3 px-3 text-center font-bold text-gray-800">
                                                    {totalParcels}
                                                </td>
                                                <td className="py-3 px-3 text-right font-bold text-gray-800">
                                                    ₹{formatCurrency(totalAmt)}
                                                </td>
                                                <td className="py-3 px-3 text-center whitespace-nowrap">
                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                                        pMode === 'Paid' ? 'bg-green-50 text-green-700 border border-green-200' :
                                                        pMode === 'ToPay' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                        pMode === 'Credit' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                                                        'bg-gray-50 text-gray-700'
                                                    }`}>
                                                        {pMode}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-center whitespace-nowrap">
                                                    {statusBadge(pStatus)}
                                                </td>
                                                <td className="py-3 px-3 text-center whitespace-nowrap">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => setSelectedRecord(r)}
                                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                            title="View Details"
                                                        >
                                                            <Eye size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(r._id)}
                                                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                            title="Delete Record"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-gray-100 rounded-b-xl">
                            <div className="text-xs text-gray-500">
                                Showing <span className="font-semibold text-gray-700">{filteredRecords.length === 0 ? 0 : indexOfFirstItem + 1}</span> to{' '}
                                <span className="font-semibold text-gray-700">{Math.min(indexOfLastItem, filteredRecords.length)}</span> of{' '}
                                <span className="font-semibold text-gray-700">{filteredRecords.length.toLocaleString('en-IN')}</span> records
                                {searchQuery && ` (filtered from ${records.length.toLocaleString('en-IN')})`}
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        title="First Page"
                                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronsLeft size={16} />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        title="Previous Page"
                                        className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-medium flex items-center gap-1 transition"
                                    >
                                        <ChevronLeft size={15} />
                                        <span className="hidden sm:inline">Prev</span>
                                    </button>

                                    {(() => {
                                        const maxVisible = 5;
                                        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                                        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                                        if (endPage - startPage < maxVisible - 1) {
                                            startPage = Math.max(1, endPage - maxVisible + 1);
                                        }

                                        const pages = [];
                                        if (startPage > 1) {
                                            pages.push(
                                                <button
                                                    key={1}
                                                    onClick={() => setCurrentPage(1)}
                                                    className="w-8 h-8 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
                                                >
                                                    1
                                                </button>
                                            );
                                            if (startPage > 2) {
                                                pages.push(<span key="start-dots" className="px-1 text-gray-400 text-xs">...</span>);
                                            }
                                        }

                                        for (let p = startPage; p <= endPage; p++) {
                                            pages.push(
                                                <button
                                                    key={p}
                                                    onClick={() => setCurrentPage(p)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                                                        currentPage === p
                                                            ? 'bg-blue-600 text-white shadow-sm'
                                                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {p}
                                                </button>
                                            );
                                        }

                                        if (endPage < totalPages) {
                                            if (endPage < totalPages - 1) {
                                                pages.push(<span key="end-dots" className="px-1 text-gray-400 text-xs">...</span>);
                                            }
                                            pages.push(
                                                <button
                                                    key={totalPages}
                                                    onClick={() => setCurrentPage(totalPages)}
                                                    className="w-8 h-8 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
                                                >
                                                    {totalPages}
                                                </button>
                                            );
                                        }

                                        return pages;
                                    })()}

                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        title="Next Page"
                                        className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-medium flex items-center gap-1 transition"
                                    >
                                        <span className="hidden sm:inline">Next</span>
                                        <ChevronRight size={15} />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        title="Last Page"
                                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronsRight size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* View Details Modal */}
            {selectedRecord && (
                <ViewDetailsModal 
                    record={selectedRecord} 
                    onClose={() => setSelectedRecord(null)} 
                    onUpdate={() => {
                        fetchRecords();
                        setSelectedRecord(null);
                    }}
                    config={{ headers: getAuthHeaders() }}
                />
            )}
        </div>
    );
};

export default AddRecord;
