import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Download, Trash2, Users, Briefcase, CalendarClock, ChevronUp, Eye, X, Package, DollarSign, TrendingUp } from 'lucide-react';
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
    
    const [clientForm, setClientForm] = useState({ ...emptyClient });
    const [destinations, setDestinations] = useState([{ ...emptyDest }]);
    
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [filterType, setFilterType] = useState('');
    
    const [selectedRecord, setSelectedRecord] = useState(null); // For View Details modal

    const [stats, setStats] = useState({
        totalRecords: 0,
        totalAmount: 0,
        paidAmount: 0,
        toPayAmount: 0,
        creditAmount: 0,
    });

    const config = { headers: { Authorization: `Bearer ${user?.token}` } };

    useEffect(() => { fetchRecords(); }, [filterType]);

    useEffect(() => {
        let tRecords = records.length;
        let tAmount = 0;
        let pAmount = 0;
        let tpAmount = 0;
        let cAmount = 0;

        records.forEach(r => {
            const dests = r.destinations && r.destinations.length > 0 ? r.destinations : [r];
            dests.forEach(d => {
                const amt = parseFloat(d.totalAmount) || 0;
                tAmount += amt;
                if (d.paymentMode === 'Paid') pAmount += amt;
                else if (d.paymentMode === 'ToPay') tpAmount += amt;
                else if (d.paymentMode === 'Credit') cAmount += amt;
            });
        });

        setStats({
            totalRecords: tRecords,
            totalAmount: tAmount.toFixed(2),
            paidAmount: pAmount.toFixed(2),
            toPayAmount: tpAmount.toFixed(2),
            creditAmount: cAmount.toFixed(2),
        });
    }, [records]);

    const fetchRecords = async () => {
        try {
            const params = filterType ? { clientType: filterType } : {};
            const { data } = await axios.get('/api/parcel-records', { ...config, params });
            setRecords(data);
        } catch (e) { toast.error('Failed to load records'); }
    };

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

    const sendWhatsAppMessage = (data) => {
        if (!data.mobile) return;
        
        let message = `*Hello ${data.clientName},*\n\nYour parcel booking with *OnlineGo* is confirmed! 📦\n\n`;
        message += `*Date:* ${new Date(data.date).toLocaleDateString('en-IN')}\n`;
        message += `*From:* ${data.fromCity}\n\n`;
        
        message += `*Destinations:*\n`;
        let grandTotal = 0;
        data.destinations.forEach((d, i) => {
            message += `${i+1}. *To:* ${d.toCity}\n`;
            message += `   *Parcels:* ${d.noOfParcels} (${d.parcelType})\n`;
            message += `   *Amount:* ₹${d.totalAmount} (${d.paymentMode})\n`;
            grandTotal += parseFloat(d.totalAmount) || 0;
        });

        message += `\n*Grand Total:* ₹${grandTotal}\n\n`;
        message += `Thank you for choosing us! 🚚`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/91${data.mobile}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
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
            const payload = {
                clientType: tab,
                ...clientForm,
                destinations: destinations
            };

            await axios.post('/api/parcel-records', payload, config);
            toast.success('Record added successfully! ✅');
            
            if (payload.mobile) {
                const wantMsg = window.confirm('Record saved! Do you want to send a WhatsApp confirmation message to the client?');
                if (wantMsg) {
                    sendWhatsAppMessage(payload);
                }
            }
            
            setClientForm({ ...emptyClient });
            setDestinations([{ ...emptyDest }]);
            setShowForm(false);
            fetchRecords();
        } catch (e) { 
            toast.error(e.response?.data?.message || 'Failed'); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this record?')) return;
        try {
            await axios.delete(`/api/parcel-records/${id}`, config);
            toast.success('Deleted');
            fetchRecords();
        } catch (e) { toast.error('Delete failed'); }
    };

    const handleDownload = async () => {
        try {
            const params = filterType ? { clientType: filterType } : {};
            const res = await axios.get('/api/parcel-records/download/csv', {
                ...config, params, responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `parcel_records_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('CSV Downloaded!');
        } catch (e) { toast.error('Download failed'); }
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
                        className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 flex items-center gap-1.5 shadow-lg text-sm">
                        <Download size={16} /> Download CSV
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-5 rounded-xl shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-xs font-bold uppercase">Total Records</p>
                            <p className="text-2xl font-bold mt-1">{stats.totalRecords}</p>
                        </div>
                        <Package className="w-10 h-10 text-purple-200 opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-5 rounded-xl shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-xs font-bold uppercase">Total Amount</p>
                            <p className="text-2xl font-bold mt-1">₹{stats.totalAmount}</p>
                        </div>
                        <DollarSign className="w-10 h-10 text-green-200 opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 rounded-xl shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-xs font-bold uppercase">Paid</p>
                            <p className="text-2xl font-bold mt-1">₹{stats.paidAmount}</p>
                        </div>
                        <TrendingUp className="w-10 h-10 text-blue-200 opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-5 rounded-xl shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-100 text-xs font-bold uppercase">To Pay</p>
                            <p className="text-2xl font-bold mt-1">₹{stats.toPayAmount}</p>
                        </div>
                        <TrendingUp className="w-10 h-10 text-yellow-200 opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-5 rounded-xl shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-xs font-bold uppercase">Credit</p>
                            <p className="text-2xl font-bold mt-1">₹{stats.creditAmount}</p>
                        </div>
                        <TrendingUp className="w-10 h-10 text-orange-200 opacity-80" />
                    </div>
                </div>
            </div>

            {/* Add Form */}
            {showForm && (
                <div className="bg-white rounded-2xl shadow border overflow-hidden">
                    <div className="flex border-b">
                        {TABS.map(t => {
                            const Icon = t.icon;
                            const active = tab === t.id;
                            const colors = t.color === 'blue' ? 'border-blue-600 text-blue-700 bg-blue-50' : t.color === 'green' ? 'border-green-600 text-green-700 bg-green-50' : 'border-purple-600 text-purple-700 bg-purple-50';
                            return (
                                <button key={t.id} onClick={() => setTab(t.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold border-b-2 transition-all ${active ? colors : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                                    <Icon size={16} /> {t.label}
                                </button>
                            );
                        })}
                    </div>
                    <form onSubmit={handleSubmit} className="p-5 space-y-6">
                        
                        {/* Client/Agent Details Section */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2">{typeLabel(tab)} Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div><label className="text-xs font-bold text-gray-500 block mb-1">{typeLabel(tab)} Name *</label>
                                    <input name="clientName" value={clientForm.clientName} onChange={handleClientChange} required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Name" /></div>
                                <div><label className="text-xs font-bold text-gray-500 block mb-1">Mobile</label>
                                    <input name="mobile" value={clientForm.mobile} onChange={handleClientChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Mobile" /></div>
                                <div><label className="text-xs font-bold text-gray-500 block mb-1">Company</label>
                                    <input name="company" value={clientForm.company} onChange={handleClientChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Company" /></div>
                                <div><label className="text-xs font-bold text-gray-500 block mb-1">From City *</label>
                                    <input name="fromCity" value={clientForm.fromCity} onChange={handleClientChange} required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" placeholder="From" /></div>
                                <div><label className="text-xs font-bold text-gray-500 block mb-1">Date</label>
                                    <input type="date" name="date" value={clientForm.date} onChange={handleClientChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" /></div>
                            </div>
                        </div>

                        {/* Destinations Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-700 border-b pb-2">Destinations / Parcels</h3>
                            {destinations.map((dest, index) => (
                                <div key={index} className="relative p-4 rounded-xl border border-blue-100 bg-white shadow-sm">
                                    {destinations.length > 1 && (
                                        <button type="button" onClick={() => removeDestination(index)} className="absolute top-2 right-2 text-red-500 hover:bg-red-50 p-1 rounded-full">
                                            <X size={16} />
                                        </button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
                                        <div><label className="text-xs font-bold text-gray-500 block mb-1">To City *</label>
                                            <input name="toCity" value={dest.toCity} onChange={(e) => handleDestChange(index, e)} required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" placeholder="To" /></div>
                                        <div><label className="text-xs font-bold text-gray-500 block mb-1">No. of Parcels</label>
                                            <input type="number" name="noOfParcels" value={dest.noOfParcels} onChange={(e) => handleDestChange(index, e)} min="1" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" /></div>
                                        <div><label className="text-xs font-bold text-gray-500 block mb-1">Weight</label>
                                            <input name="weight" value={dest.weight} onChange={(e) => handleDestChange(index, e)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" placeholder="e.g. 5kg" /></div>
                                        <div><label className="text-xs font-bold text-gray-500 block mb-1">Parcel Type</label>
                                            <select name="parcelType" value={dest.parcelType} onChange={(e) => handleDestChange(index, e)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none">
                                                <option value="">Select</option>
                                                <option>Box</option><option>Bag</option><option>Envelope</option><option>Bundle</option><option>Other</option>
                                            </select></div>
                                        <div><label className="text-xs font-bold text-gray-500 block mb-1">Status</label>
                                            <select name="status" value={dest.status} onChange={(e) => handleDestChange(index, e)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none">
                                                <option>Booked</option><option>In Transit</option><option>Delivered</option><option>Cancelled</option>
                                            </select></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                                        <div><label className="text-xs font-bold text-gray-500 block mb-1">Freight ₹</label>
                                            <input type="number" name="freight" value={dest.freight} onChange={(e) => handleDestChange(index, e)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" /></div>
                                        <div><label className="text-xs font-bold text-gray-500 block mb-1">Other Charges ₹</label>
                                            <input type="number" name="otherCharges" value={dest.otherCharges} onChange={(e) => handleDestChange(index, e)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" /></div>
                                        <div><label className="text-xs font-bold text-green-600 block mb-1">Total ₹</label>
                                            <input type="number" readOnly value={dest.totalAmount} className="w-full border-2 border-green-200 bg-green-50 rounded-lg px-3 py-2 text-sm font-bold text-green-700" /></div>
                                        <div><label className="text-xs font-bold text-gray-500 block mb-1">Payment</label>
                                            <select name="paymentMode" value={dest.paymentMode} onChange={(e) => handleDestChange(index, e)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none">
                                                <option>Paid</option><option>ToPay</option><option>Credit</option><option>FOC</option>
                                            </select></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div><input name="description" value={dest.description} onChange={(e) => handleDestChange(index, e)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Parcel description" /></div>
                                        <div><input name="remarks" value={dest.remarks} onChange={(e) => handleDestChange(index, e)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Remarks/Notes" /></div>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={addDestination} className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:text-blue-800">
                                <Plus size={16} /> Add Another Destination
                            </button>
                        </div>

                        <div className="flex gap-3 pt-3 border-t">
                            <button type="submit" disabled={loading}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 flex items-center gap-2 shadow-lg disabled:opacity-50 text-sm">
                                {loading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Plus size={16} />}
                                Add Record
                            </button>
                            <button type="button" onClick={() => { setClientForm({ ...emptyClient }); setDestinations([{ ...emptyDest }]); }} className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 text-sm">Reset</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filter Bar */}
            <div className="flex items-center gap-2 flex-wrap mt-4">
                <span className="text-sm font-semibold text-gray-500">Filter:</span>
                {[{ id: '', label: 'All' }, { id: 'regular', label: 'Client' }, { id: 'agent', label: 'Agent' }, { id: 'Customer', label: 'Customer' }].map(f => (
                    <button key={f.id} onClick={() => setFilterType(f.id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${filterType === f.id ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {f.label}
                    </button>
                ))}
                <span className="ml-auto text-sm text-gray-400">{records.length} records</span>
            </div>

            {/* Records Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {records.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-gray-400 text-lg">No records found</p>
                        <p className="text-gray-300 text-sm mt-1">Add a record to get started</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-left">
                                    <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase">#</th>
                                    <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase">Date</th>
                                    <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase">Type</th>
                                    <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase">Client</th>
                                    <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase">Company</th>
                                    <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase">Route</th>
                                    <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase text-center">Parcels</th>
                                    <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase">Total ₹</th>
                                    <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                                    {user?.role === 'admin' && <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase">Branch</th>}
                                    <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {records.map((r, i) => {
                                    const dests = r.destinations && r.destinations.length > 0 ? r.destinations : [r];
                                    const toCityStr = dests.map(d => d.toCity).join(', ');
                                    const totalParcels = dests.reduce((sum, d) => sum + (Number(d.noOfParcels) || 0), 0);
                                    const totalAmount = dests.reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0);
                                    const statuses = [...new Set(dests.map(d => d.status))];
                                    const displayStatus = statuses.length === 1 ? statuses[0] : 'Mixed';

                                    return (
                                        <tr key={r._id} className="hover:bg-gray-50/50">
                                            <td className="px-3 py-3 text-gray-500">{i + 1}</td>
                                            <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{new Date(r.date).toLocaleDateString('en-IN')}</td>
                                            <td className="px-3 py-3">{typeBadge(r.clientType)}</td>
                                            <td className="px-3 py-3 font-semibold text-gray-800">{r.clientName}</td>
                                            <td className="px-3 py-3 text-gray-600">{r.company || '-'}</td>
                                            <td className="px-3 py-3 text-gray-600">
                                                {r.fromCity} → <span className="font-semibold">{toCityStr}</span>
                                            </td>
                                            <td className="px-3 py-3 text-gray-700 font-semibold text-center">{totalParcels}</td>
                                            <td className="px-3 py-3 font-bold text-green-700">₹{totalAmount}</td>
                                            <td className="px-3 py-3">{statusBadge(displayStatus)}</td>
                                            {user?.role === 'admin' && <td className="px-3 py-3 text-gray-500 text-xs">{r.createdBy?.name || '-'}</td>}
                                            <td className="px-3 py-3 flex gap-1 justify-end">
                                                <button onClick={() => setSelectedRecord(r)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Eye size={15} /></button>
                                                {user?.role === 'admin' && (
                                                    <button onClick={() => handleDelete(r._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
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
                    config={config}
                />
            )}
        </div>
    );
};

export default AddRecord;
