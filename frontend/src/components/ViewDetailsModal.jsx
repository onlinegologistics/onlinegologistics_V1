import React, { useState } from 'react';
import { Eye, X, Edit2, Save, Printer, FileSpreadsheet, Trash2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ViewDetailsModal = ({ record, onClose, onUpdate, config }) => {
    const [isEditing, setIsEditing] = useState(false);
    
    // Normalize formData to always have destinations array
    const [formData, setFormData] = useState(() => {
        const data = { ...record };
        if (!data.destinations || data.destinations.length === 0) {
            data.destinations = [{
                toCity: data.toCity,
                noOfParcels: data.noOfParcels,
                weight: data.weight,
                description: data.description,
                parcelType: data.parcelType,
                freight: data.freight,
                otherCharges: data.otherCharges,
                totalAmount: data.totalAmount,
                paymentMode: data.paymentMode,
                status: data.status,
                remarks: data.remarks
            }];
        }
        return data;
    });
    const [loading, setLoading] = useState(false);

    if (!record) return null;

    const handleClientChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDestChange = (index, e) => {
        const { name, value } = e.target;
        const newDests = [...formData.destinations];
        newDests[index] = { ...newDests[index], [name]: value };
        
        if (name === 'freight' || name === 'otherCharges') {
            const f = parseFloat(newDests[index].freight) || 0;
            const o = parseFloat(newDests[index].otherCharges) || 0;
            newDests[index].totalAmount = f + o;
        }
        setFormData({ ...formData, destinations: newDests });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await axios.put(`/api/parcel-records/${record._id}`, formData, config);
            toast.success('Record updated successfully');
            setIsEditing(false);
            if (onUpdate) onUpdate();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to update record');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this entire record? This action cannot be undone.')) return;
        setLoading(true);
        try {
            await axios.delete(`/api/parcel-records/${record._id}`, config);
            toast.success('Record deleted successfully');
            if (onUpdate) onUpdate();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to delete record');
            setLoading(false);
        }
    };

    const typeBadge = (t) => {
        const c = t === 'regular' ? 'bg-blue-100 text-blue-700' : t === 'agent' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700';
        return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c}`}>{t === 'regular' ? 'Client' : t}</span>;
    };
    const statusBadge = (s) => {
        const c = s === 'Delivered' ? 'bg-green-100 text-green-700' : s === 'Cancelled' ? 'bg-red-100 text-red-700' : s === 'In Transit' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700';
        return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c}`}>{s}</span>;
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadCSV = () => {
        const headers = ["Date", "Type", "Client Name", "Mobile", "Company", "From City", "To City", "Parcels", "Parcel Type", "Weight", "Freight", "Other Charges", "Total Amount", "Payment Mode", "Status", "Description", "Remarks"];
        
        let csvContent = headers.join(",") + "\n";

        formData.destinations.forEach(dest => {
            const values = [
                new Date(formData.date).toLocaleDateString('en-IN'), formData.clientType, formData.clientName, formData.mobile, formData.company,
                formData.fromCity, dest.toCity, dest.noOfParcels, dest.parcelType, dest.weight,
                dest.freight, dest.otherCharges, dest.totalAmount, dest.paymentMode, dest.status, dest.description, dest.remarks
            ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`);
            csvContent += values.join(",") + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `parcel_${formData._id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <style type="text/css" media="print">
                {`
                    body * { visibility: hidden; }
                    #printable-modal, #printable-modal * { visibility: visible; }
                    #printable-modal { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; margin: 0; padding: 20px; }
                    .print\\:hidden { display: none !important; }
                `}
            </style>
            <div id="printable-modal" className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center shrink-0 print:hidden">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        {isEditing ? <Edit2 className="text-blue-600" /> : <Eye className="text-blue-600" />} 
                        {isEditing ? 'Edit Record' : 'Record Details'}
                    </h2>
                    <div className="flex gap-2">
                        {!isEditing && (
                            <>
                                <button onClick={handleDownloadCSV} className="text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1">
                                    <FileSpreadsheet size={16} /> Excel
                                </button>
                                <button onClick={handlePrint} className="text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1">
                                    <Printer size={16} /> Print
                                </button>
                                <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1">
                                    <Edit2 size={16} /> Edit
                                </button>
                                <button onClick={handleDelete} disabled={loading} className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1">
                                    <Trash2 size={16} /> Delete
                                </button>
                            </>
                        )}
                        {isEditing && (
                            <button onClick={() => { setIsEditing(false); setFormData({ ...record }); }} className="text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                                Cancel
                            </button>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:bg-gray-200 p-1.5 rounded-full transition-colors"><X size={20} /></button>
                    </div>
                </div>
                
                <div className="p-6 overflow-y-auto flex-grow space-y-6">
                    {/* Client Info Section */}
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <h3 className="text-sm font-bold text-blue-800 mb-4 border-b border-blue-200 pb-2">Client Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Date</p>
                                {isEditing ? <input type="date" name="date" value={formData.date?.split('T')[0] || ''} onChange={handleClientChange} className="w-full border rounded px-2 py-1" /> : <p className="font-semibold text-gray-800">{new Date(formData.date).toLocaleDateString('en-IN')}</p>}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Client Type</p>
                                {isEditing ? (
                                    <select name="clientType" value={formData.clientType} onChange={handleClientChange} className="w-full border rounded px-2 py-1">
                                        <option value="regular">Client</option><option value="agent">Agent</option><option value="Customer">Customer</option>
                                    </select>
                                ) : <p>{typeBadge(formData.clientType)}</p>}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">From City</p>
                                {isEditing ? <input name="fromCity" value={formData.fromCity} onChange={handleClientChange} className="w-full border rounded px-2 py-1" /> : <p className="font-semibold text-gray-800">{formData.fromCity}</p>}
                            </div>
                            <div></div>

                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Client Name</p>
                                {isEditing ? <input name="clientName" value={formData.clientName} onChange={handleClientChange} className="w-full border rounded px-2 py-1" /> : <p className="font-semibold text-gray-800">{formData.clientName}</p>}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Mobile</p>
                                {isEditing ? <input name="mobile" value={formData.mobile} onChange={handleClientChange} className="w-full border rounded px-2 py-1" /> : <p className="font-semibold text-gray-800">{formData.mobile || '-'}</p>}
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Company</p>
                                {isEditing ? <input name="company" value={formData.company} onChange={handleClientChange} className="w-full border rounded px-2 py-1" /> : <p className="font-semibold text-gray-800">{formData.company || '-'}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Destinations Section */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2">Destinations ({formData.destinations.length})</h3>
                        <div className="space-y-4">
                            {formData.destinations.map((dest, index) => (
                                <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">To City</p>
                                            {isEditing ? <input name="toCity" value={dest.toCity} onChange={(e) => handleDestChange(index, e)} className="w-full border rounded px-2 py-1" /> : <p className="font-bold text-blue-700">{dest.toCity}</p>}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Status</p>
                                            {isEditing ? (
                                                <select name="status" value={dest.status} onChange={(e) => handleDestChange(index, e)} className="w-full border rounded px-2 py-1">
                                                    <option>Booked</option><option>In Transit</option><option>Delivered</option><option>Cancelled</option>
                                                </select>
                                            ) : <p>{statusBadge(dest.status)}</p>}
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Parcels / Type / Weight</p>
                                            {isEditing ? (
                                                <div className="flex gap-1">
                                                    <input type="number" name="noOfParcels" value={dest.noOfParcels} onChange={(e) => handleDestChange(index, e)} className="w-16 border rounded px-1 py-1 text-center" />
                                                    <select name="parcelType" value={dest.parcelType} onChange={(e) => handleDestChange(index, e)} className="w-24 border rounded px-1 py-1">
                                                        <option value="">Select</option><option>Box</option><option>Bag</option><option>Envelope</option><option>Bundle</option><option>Other</option>
                                                    </select>
                                                    <input name="weight" value={dest.weight} onChange={(e) => handleDestChange(index, e)} placeholder="Wt" className="w-16 border rounded px-1 py-1" />
                                                </div>
                                            ) : <p className="font-semibold text-gray-800">{dest.noOfParcels} x {dest.parcelType || 'Box'} ({dest.weight || '-'})</p>}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Freight ₹</p>
                                            {isEditing ? <input type="number" name="freight" value={dest.freight} onChange={(e) => handleDestChange(index, e)} className="w-full border rounded px-2 py-1" /> : <p className="font-semibold text-gray-800">₹{dest.freight}</p>}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Other Charges ₹</p>
                                            {isEditing ? <input type="number" name="otherCharges" value={dest.otherCharges} onChange={(e) => handleDestChange(index, e)} className="w-full border rounded px-2 py-1" /> : <p className="font-semibold text-gray-800">₹{dest.otherCharges}</p>}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Amount ₹</p>
                                            <p className="font-bold text-green-700 text-lg">₹{dest.totalAmount}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Payment Mode</p>
                                            {isEditing ? (
                                                <select name="paymentMode" value={dest.paymentMode} onChange={(e) => handleDestChange(index, e)} className="w-full border rounded px-2 py-1">
                                                    <option>Paid</option><option>ToPay</option><option>Credit</option><option>FOC</option>
                                                </select>
                                            ) : <p className="font-semibold text-gray-800">{dest.paymentMode}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Description</p>
                                            {isEditing ? <input name="description" value={dest.description} onChange={(e) => handleDestChange(index, e)} className="w-full border rounded px-2 py-1" /> : <p className="text-gray-800">{dest.description || '-'}</p>}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Remarks</p>
                                            {isEditing ? <input name="remarks" value={dest.remarks} onChange={(e) => handleDestChange(index, e)} className="w-full border rounded px-2 py-1" /> : <p className="text-gray-800">{dest.remarks || '-'}</p>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {isEditing && (
                    <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
                        <button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold transition-colors flex items-center gap-2">
                            {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewDetailsModal;
