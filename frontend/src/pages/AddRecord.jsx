import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { Plus, Download, Trash2, Users, Briefcase, CalendarClock, X, ChevronDown, ChevronUp } from 'lucide-react';

const TABS = [
    { id: 'regular', label: 'Regular Client', icon: Users, color: 'blue' },
    { id: 'agent', label: 'Agent', icon: Briefcase, color: 'green' },
    { id: 'Customer', label: 'Customer', icon: CalendarClock, color: 'purple' },
];

const emptyForm = {
    clientName: '', mobile: '', address: '', company: '',
    fromCity: '', toCity: '', noOfParcels: 1, weight: '',
    description: '', parcelType: '', freight: 0, otherCharges: 0,
    totalAmount: 0, paymentMode: 'Paid', status: 'Booked', remarks: '',
    date: new Date().toISOString().split('T')[0],
};

const AddRecord = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState('regular');
    const [form, setForm] = useState({ ...emptyForm });
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [filterType, setFilterType] = useState('');
    const config = { headers: { Authorization: `Bearer ${user?.token}` } };

    useEffect(() => { fetchRecords(); }, [filterType]);

    const fetchRecords = async () => {
        try {
            const params = filterType ? { clientType: filterType } : {};
            const { data } = await axios.get('/api/parcel-records', { ...config, params });
            setRecords(data);
        } catch (e) { toast.error('Failed to load records'); }
    };

    const onChange = (e) => {
        const { name, value } = e.target;
        const updated = { ...form, [name]: value };
        const f = parseFloat(updated.freight) || 0;
        const o = parseFloat(updated.otherCharges) || 0;
        updated.totalAmount = f + o;
        setForm(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.clientName || !form.fromCity || !form.toCity) {
            return toast.error('Client Name, From City, To City required!');
        }
        setLoading(true);
        try {
            await axios.post('/api/parcel-records', { ...form, clientType: tab }, config);
            toast.success('Record added! ✅');
            setForm({ ...emptyForm });
            setShowForm(false);
            fetchRecords();
        } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
        finally { setLoading(false); }
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

        const typeLabel = (t) => t === 'regular' ? 'Regular' : t === 'agent' ? 'Agent' : t === 'Customer' ? 'Customer' : t;
    const typeBadge = (t) => {
        const c = t === 'regular' ? 'bg-blue-100 text-blue-700' : t === 'agent' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700';
        return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c}`}>{typeLabel(t)}</span>;
    };
    const statusBadge = (s) => {
        const c = s === 'Delivered' ? 'bg-green-100 text-green-700' : s === 'Cancelled' ? 'bg-red-100 text-red-700' : s === 'In Transit' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700';
        return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c}`}>{s}</span>;
    };

    return (
        <div className="space-y-5">
            <Toaster position="top-right" />
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">📦 Parcel Records</h1>
                    <p className="text-gray-500 text-sm">Regular Client, Agent, Customer ke parcel records</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setShowForm(!showForm)}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 flex items-center gap-1.5 shadow-lg text-sm">
                        {showForm ? <><ChevronUp size={16} /> Hide Form</> : <><Plus size={16} /> Add Record</>}
                    </button>
                    <button onClick={handleDownload}
                        className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 flex items-center gap-1.5 shadow-lg text-sm">
                        <Download size={16} /> Download CSV
                    </button>
                </div>
            </div>

            {/* Add Form */}
            {showForm && (
                <div className="bg-white rounded-2xl shadow border overflow-hidden">
                    {/* Tabs */}
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
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        {/* Row 1: Client Info */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Client Name *</label>
                                <input name="clientName" value={form.clientName} onChange={onChange} required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Name" /></div>
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Mobile</label>
                                <input name="mobile" value={form.mobile} onChange={onChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Mobile" /></div>
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Company</label>
                                <input name="company" value={form.company} onChange={onChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Company" /></div>
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Date</label>
                                <input type="date" name="date" value={form.date} onChange={onChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" /></div>
                        </div>
                        {/* Row 2: Route + Parcel */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">From City *</label>
                                <input name="fromCity" value={form.fromCity} onChange={onChange} required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" placeholder="From" /></div>
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">To City *</label>
                                <input name="toCity" value={form.toCity} onChange={onChange} required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" placeholder="To" /></div>
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">No. of Parcels</label>
                                <input type="number" name="noOfParcels" value={form.noOfParcels} onChange={onChange} min="1" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" /></div>
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Weight</label>
                                <input name="weight" value={form.weight} onChange={onChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" placeholder="e.g. 5kg" /></div>
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Parcel Type</label>
                                <select name="parcelType" value={form.parcelType} onChange={onChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none">
                                    <option value="">Select</option>
                                    <option>Box</option><option>Bag</option><option>Envelope</option><option>Bundle</option><option>Other</option>
                                </select></div>
                        </div>
                        {/* Row 3: Charges */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Freight ₹</label>
                                <input type="number" name="freight" value={form.freight} onChange={onChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" /></div>
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Other Charges ₹</label>
                                <input type="number" name="otherCharges" value={form.otherCharges} onChange={onChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" /></div>
                            <div><label className="text-xs font-bold text-green-600 block mb-1">Total ₹</label>
                                <input type="number" readOnly value={form.totalAmount} className="w-full border-2 border-green-200 bg-green-50 rounded-lg px-3 py-2 text-sm font-bold text-green-700" /></div>
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Payment</label>
                                <select name="paymentMode" value={form.paymentMode} onChange={onChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none">
                                    <option>Paid</option><option>ToPay</option><option>Credit</option><option>FOC</option>
                                </select></div>
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Status</label>
                                <select name="status" value={form.status} onChange={onChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none">
                                    <option>Booked</option><option>In Transit</option><option>Delivered</option><option>Cancelled</option>
                                </select></div>
                        </div>
                        {/* Row 4: Desc + Remarks */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Description</label>
                                <input name="description" value={form.description} onChange={onChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Parcel description" /></div>
                            <div><label className="text-xs font-bold text-gray-500 block mb-1">Remarks</label>
                                <input name="remarks" value={form.remarks} onChange={onChange} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none" placeholder="Any notes" /></div>
                        </div>
                        <div className="flex gap-3 pt-1">
                            <button type="submit" disabled={loading}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 flex items-center gap-2 shadow-lg disabled:opacity-50 text-sm">
                                {loading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Plus size={16} />}
                                Add {TABS.find(t => t.id === tab)?.label} Record
                            </button>
                            <button type="button" onClick={() => setForm({ ...emptyForm })} className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 text-sm">Reset</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filter Bar */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-500">Filter:</span>
                {[{ id: '', label: 'All' }, { id: 'regular', label: 'Regular' }, { id: 'agent', label: 'Agent' }, { id: 'Customer', label: 'Customer' }].map(f => (
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
                                    <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase">Mobile</th>
                                    <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase">Route</th>
                                    <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase">Parcels</th>
                                    <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase">Total ₹</th>
                                    <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase">Payment</th>
                                    <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                                    {user?.role === 'admin' && <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase">Branch</th>}
                                    <th className="px-3 py-3 text-xs font-bold text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {records.map((r, i) => (
                                    <tr key={r._id} className="hover:bg-gray-50/50">
                                        <td className="px-3 py-3 text-gray-500">{i + 1}</td>
                                        <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{new Date(r.date).toLocaleDateString('en-IN')}</td>
                                        <td className="px-3 py-3">{typeBadge(r.clientType)}</td>
                                        <td className="px-3 py-3 font-semibold text-gray-800">{r.clientName}</td>
                                        <td className="px-3 py-3 text-gray-600">{r.mobile || '-'}</td>
                                        <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{r.fromCity} → {r.toCity}</td>
                                        <td className="px-3 py-3 text-gray-700 font-semibold text-center">{r.noOfParcels}</td>
                                        <td className="px-3 py-3 font-bold text-green-700">₹{r.totalAmount}</td>
                                        <td className="px-3 py-3 text-gray-600">{r.paymentMode}</td>
                                        <td className="px-3 py-3">{statusBadge(r.status)}</td>
                                        {user?.role === 'admin' && <td className="px-3 py-3 text-gray-500 text-xs">{r.createdBy?.name || '-'}</td>}
                                        <td className="px-3 py-3">
                                            {user?.role === 'admin' && (
                                                <button onClick={() => handleDelete(r._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddRecord;
