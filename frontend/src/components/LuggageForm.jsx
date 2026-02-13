import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import PrintReceipt from './PrintReceipt';

const LuggageForm = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const componentRef = useRef();

    // State for storing data to print (separate from form data)
    const [printData, setPrintData] = useState(null);
    const [creditOfficesList, setCreditOfficesList] = useState([]);
    const [globalPricing, setGlobalPricing] = useState(null);
    const [agentsList, setAgentsList] = useState([]);
    const [showAgentModal, setShowAgentModal] = useState(false);
    const [newAgentName, setNewAgentName] = useState('');
    const [newAgentMobile, setNewAgentMobile] = useState('');

    useEffect(() => {
        // Fetch credit offices, global pricing & agents
        const fetchData = async () => {
            try {
                const officesRes = await axios.get('/api/credit-offices');
                setCreditOfficesList(officesRes.data);

                const pricingRes = await axios.get('/api/pricing');
                if (pricingRes.data) {
                    setGlobalPricing(pricingRes.data);
                }

                const token = user?.token;
                if (token) {
                    const agentsRes = await axios.get('/api/agents', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setAgentsList(agentsRes.data);
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
            }
        };
        fetchData();
    }, []);

    // Create agent inline
    const handleCreateAgent = async () => {
        if (!newAgentName.trim()) {
            toast.error('Agent name is required');
            return;
        }
        try {
            const token = user?.token;
            const { data } = await axios.post('/api/agents', { name: newAgentName, mobile: newAgentMobile }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Agent created!');
            setAgentsList(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
            setFormData(prev => ({ ...prev, agent: data.name }));
            setNewAgentName('');
            setNewAgentMobile('');
            setShowAgentModal(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create agent');
        }
    };

    const initialFormState = {
        date: (() => {
            const d = new Date();
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        })(),
        senderName: '',
        senderAddress: '',
        senderMobile: '',
        senderGst: '',
        receiverName: '',
        receiverAddress: '',
        receiverMobile: '',
        receiverGst: '',
        station: '',
        agent: '',
        paymentMode: 'Paid',
        creditParty: '',
        creditOffice: '',
        noOfParcels: '',
        unit: 'Parcel',
        manualLrNo: '',
        remarks: '',
        freight: 0,
        insurance: 0,
        cartage: 0,
        loading: 0,
        unloading: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        cgstPercent: 0,
        sgstPercent: 0,
        igstPercent: 0,
        ewayBillNo: '',
        ewayBillDate: '',
    };

    const [formData, setFormData] = useState(initialFormState);

    const [totals, setTotals] = useState({
        totalAmount: 0,
        grandTotal: 0,
    });

    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const { freight, insurance, cartage, loading, unloading, cgstPercent, sgstPercent, igstPercent } = formData;
        const subTotal = (parseFloat(freight) || 0) + (parseFloat(insurance) || 0) + (parseFloat(cartage) || 0) + (parseFloat(loading) || 0) + (parseFloat(unloading) || 0);

        // Calculate Tax Amounts based on Percentages
        const cAmount = (subTotal * (parseFloat(cgstPercent) || 0)) / 100;
        const sAmount = (subTotal * (parseFloat(sgstPercent) || 0)) / 100;
        const iAmount = (subTotal * (parseFloat(igstPercent) || 0)) / 100;

        // Check if we need to update formData to avoid infinite loop
        // We only update if the calculated amount is significantly different from stored amount
        // However, updating formData in useEffect can be tricky.
        // A better way is to calculate totals here, but if we want to save the calculated tax amounts in formData
        // we might need a separate effect or just calculate them before save.
        // But the UI needs to show them.

        // Let's rely on the fact that we will render the calculated values if we want, OR
        // we update formData here but carefully. 
        // ACTUALLY, to avoid useEffect loop, we can just calculate them for 'totals' and 'display', 
        // AND update them in formData only when they change.

        // Simpler approach: Calculate these here, and if they are different from formData.cgst, update formData.
        // But updating formData triggers this effect again.
        // So we compare values.

        const currentC = parseFloat(formData.cgst) || 0;
        const currentS = parseFloat(formData.sgst) || 0;
        const currentI = parseFloat(formData.igst) || 0;

        if (Math.abs(cAmount - currentC) > 0.01 || Math.abs(sAmount - currentS) > 0.01 || Math.abs(iAmount - currentI) > 0.01) {
            setFormData(prev => ({
                ...prev,
                cgst: cAmount.toFixed(2),
                sgst: sAmount.toFixed(2),
                igst: iAmount.toFixed(2)
            }));
            // This WILL trigger useEffect again, but next time the values will match, so it won't update again.
            return;
        }

        const tax = cAmount + sAmount + iAmount;
        const grand = subTotal + tax;

        setTotals({
            totalAmount: subTotal.toFixed(2),
            grandTotal: grand.toFixed(2),
        });
    }, [formData.freight, formData.insurance, formData.cartage, formData.loading, formData.unloading, formData.cgstPercent, formData.sgstPercent, formData.igstPercent, formData.cgst, formData.sgst, formData.igst]);

    // Auto-calculate Freight based on Global Pricing categories
    // Auto-calculate Freight based on Global Pricing categories
    useEffect(() => {
        if (globalPricing?.categories && formData.noOfParcels) {
            const qty = parseFloat(formData.noOfParcels) || 0;
            const unitType = formData.unit;
            const category = globalPricing.categories.find(c => c.name === unitType);
            const price = category ? category.price : 0;
            const calculatedFreight = price * qty;

            // Only update if value is different to avoid loop/unnecessary renders
            if (parseFloat(formData.freight) !== calculatedFreight) {
                setFormData(prev => ({ ...prev, freight: calculatedFreight }));
            }
        }
    }, [formData.noOfParcels, formData.unit, globalPricing]);

    // Track the current system date to detect day changes
    const lastSystemDate = useRef((() => {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    })());

    // Automatically update date daywise (only when day crosses midnight)
    useEffect(() => {
        const checkDate = () => {
            const d = new Date();
            const currentToday = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

            if (currentToday !== lastSystemDate.current) {
                lastSystemDate.current = currentToday;
                setFormData(prev => ({ ...prev, date: currentToday }));
            }
        };

        const interval = setInterval(checkDate, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = user.token;
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            };

            const payload = {
                ...formData,
                totalAmount: totals.totalAmount,
                grandTotal: totals.grandTotal,
            };

            const { data } = await axios.post('/api/luggage', payload, config);
            toast.success('Luggage Entry Created!');

            // Set data for printing
            setPrintData(data);
            setIsSaved(true);

            // Reset form for next entry - DISABLED as per user request
            // setFormData(initialFormState);
            // setTotals({ totalAmount: 0, grandTotal: 0 });
            // Don't navigate immediately, allow printing
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error creating entry');
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Receipt-${printData?.senderName || formData.senderName || 'New'}`,
    });

    const handleReset = () => {
        setFormData(initialFormState);
        setTotals({ totalAmount: 0, grandTotal: 0 });
        setIsSaved(false);
        setPrintData(null);
        toast.success('Form Reset');
    };

    // Helper to get current unit price for display
    const currentCategory = globalPricing?.categories?.find(c => c.name === formData.unit);
    const currentPrice = currentCategory ? currentCategory.price : 0;

    return (
        <div className="bg-gray-100 min-h-screen p-6">
            <Toaster />

            <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-[#1e293b] text-white p-4 flex justify-between items-center px-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-wide">📦 New Luggage Entry</h1>
                        <p className="text-xs text-gray-400 mt-1">Create a new booking receipt</p>
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                        ↩ Back to Dashboard
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">

                    {/* Top Meta Data: Date, Station, Credit Office (if applicable), LR */}
                    <div className={`grid grid-cols-1 ${formData.paymentMode === 'Credit' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-6 bg-blue-50/50 p-6 rounded-xl border border-blue-100`}>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange}
                                className="w-full bg-white border border-gray-300 rounded-lg p-3 font-semibold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Destination Station <span className="text-red-500">*</span></label>
                            <select name="station" value={formData.station} onChange={handleChange} className="w-full bg-white border border-gray-300 rounded-lg p-3 font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" required>
                                <option value="">-- Select Station --</option>
                                {creditOfficesList.map((office) => (
                                    <option key={office._id} value={office.name}>{office.name}</option>
                                ))}
                            </select>
                        </div>

                        {formData.paymentMode === 'Credit' && (
                            <div className="animate-fade-in">
                                <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Credit Office <span className="text-red-500">*</span></label>
                                <select
                                    name="creditOffice"
                                    value={creditOfficesList.some(o => o.name === formData.creditOffice) ? formData.creditOffice : (formData.creditOffice ? 'Other' : '')}
                                    onChange={(e) => {
                                        if (e.target.value === 'Other') setFormData(prev => ({ ...prev, creditOffice: ' ' }));
                                        else handleChange(e);
                                    }}
                                    className="w-full bg-white border-2 border-blue-200 rounded-lg p-3 font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                >
                                    <option value="">-- Select Office --</option>
                                    {creditOfficesList.map(office => <option key={office._id} value={office.name}>{office.name}</option>)}
                                    <option value="Other">Other (Manual)</option>
                                </select>
                                {formData.creditOffice && !creditOfficesList.some(o => o.name === formData.creditOffice) && (
                                    <input
                                        type="text"
                                        name="creditOffice"
                                        value={formData.creditOffice.trim() === '' ? '' : formData.creditOffice}
                                        onChange={handleChange}
                                        placeholder="Enter Office Name Manual"
                                        className="w-full mt-2 border p-2 rounded text-sm focus:border-blue-500 outline-none"
                                        autoFocus
                                    />
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Agent</label>
                            <div className="flex gap-2">
                                <select name="agent" value={formData.agent} onChange={handleChange} className="flex-1 bg-white border border-gray-300 rounded-lg p-3 font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="">-- Select Agent --</option>
                                    {agentsList.map((agent) => (
                                        <option key={agent._id} value={agent.name}>{agent.name}</option>
                                    ))}
                                </select>
                                <button type="button" onClick={() => setShowAgentModal(true)} className="bg-green-600 text-white px-3 rounded-lg hover:bg-green-700 font-bold text-lg" title="Add New Agent">+</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Receipt No (LR)</label>
                            <input value={formData.manualLrNo} readOnly placeholder="Auto-Generated"
                                className="w-full bg-gray-100 border border-gray-200 rounded-lg p-3 text-gray-500 cursor-not-allowed" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Sender Card */}
                        <div className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2">
                                📤 Sender Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">Name</label>
                                    <input name="senderName" value={formData.senderName} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-400" placeholder="Sender Full Name" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1">Mobile</label>
                                        <input name="senderMobile" value={formData.senderMobile} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-400" placeholder="10-digit number" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1">GST No</label>
                                        <input name="senderGst" value={formData.senderGst} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-400" placeholder="Optional" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">Address</label>
                                    <textarea name="senderAddress" value={formData.senderAddress} onChange={handleChange} rows="2" className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-400" placeholder="Full Address" />
                                </div>
                            </div>
                        </div>

                        {/* Receiver Card */}
                        <div className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2">
                                📥 Receiver Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">Name</label>
                                    <input name="receiverName" value={formData.receiverName} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-400" placeholder="Receiver Full Name" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1">Mobile</label>
                                        <input name="receiverMobile" value={formData.receiverMobile} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-400" placeholder="10-digit number" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1">GST No</label>
                                        <input name="receiverGst" value={formData.receiverGst} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-400" placeholder="Optional" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">Address</label>
                                    <textarea name="receiverAddress" value={formData.receiverAddress} onChange={handleChange} rows="2" className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-400" placeholder="Full Address" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shipment & Pricing - The Core */}
                    <div className="bg-blue-600 rounded-xl p-1 shadow-lg">
                        <div className="bg-white rounded-lg p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                🚛 Shipment & Pricing
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                                {/* Parcel Info */}
                                <div className="md:col-span-3">
                                    <label className="block text-sm font-bold text-gray-600 mb-1">Unit Type</label>
                                    <select name="unit" value={formData.unit} onChange={handleChange} className="w-full border-2 border-blue-100 rounded-lg p-3 font-semibold text-gray-800 focus:border-blue-500 outline-none transition">
                                        {globalPricing?.categories?.length > 0 ? (
                                            globalPricing.categories.map((cat) => (
                                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                                            ))
                                        ) : (
                                            <option value="Parcel">Parcel</option>
                                        )}
                                    </select>
                                    <p className="text-xs text-blue-600 mt-1 font-semibold">Rate: ₹{currentPrice} / {formData.unit}</p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-600 mb-1">No. of Parcels</label>
                                    <input type="number" name="noOfParcels" value={formData.noOfParcels} onChange={handleChange}
                                        className="w-full border-2 border-blue-100 rounded-lg p-3 font-bold text-xl text-center text-blue-900 focus:border-blue-500 outline-none transition" required placeholder="0" />
                                </div>

                                <div className="md:col-span-1 flex justify-center pb-4">
                                    <span className="text-gray-400 text-2xl">✖</span>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unit Price</label>
                                    <input value={currentPrice} readOnly className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-center text-gray-600 font-semibold cursor-not-allowed" />
                                </div>

                                <div className="md:col-span-1 flex justify-center pb-4">
                                    <span className="text-gray-400 text-2xl">=</span>
                                </div>

                                {/* Auto Calculated Freight */}
                                <div className="md:col-span-3">
                                    <label className="block text-sm font-bold text-green-700 mb-1">Total Freight (₹)</label>
                                    <input type="number" name="freight" value={formData.freight} onChange={handleChange}
                                        className="w-full bg-green-50 border-2 border-green-200 rounded-lg p-3 font-bold text-2xl text-right text-green-800 focus:border-green-500 outline-none transition" />
                                </div>
                            </div>

                            {/* E-way Bill Info (Optional) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-dashed">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">E-Way Bill No (Optional)</label>
                                    <input name="ewayBillNo" value={formData.ewayBillNo} onChange={handleChange} className="w-full border rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-400" placeholder="Enter E-Way Bill Number" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">E-Way Bill Date</label>
                                    <input type="date" name="ewayBillDate" value={formData.ewayBillDate} onChange={handleChange} className="w-full border rounded-lg p-2 outline-none focus:ring-1 focus:ring-blue-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment & Other Charges */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Payment Mode */}
                        <div className="lg:col-span-1 bg-white border rounded-xl p-6 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-4">💳 Payment Details</h3>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {['Paid', 'ToPay', 'FOC', 'Credit'].map(mode => (
                                    <label key={mode} className={`cursor-pointer flex items-center justify-center py-2 rounded-lg border font-medium transition ${formData.paymentMode === mode ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                                        <input type="radio" name="paymentMode" value={mode} checked={formData.paymentMode === mode} onChange={handleChange} className="hidden" />
                                        {mode}
                                    </label>
                                ))}
                            </div>

                            {formData.paymentMode === 'Credit' && (
                                <div className="space-y-3 animate-fade-in bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <div>
                                        <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Party Name</label>
                                        <input name="creditParty" value={formData.creditParty} onChange={handleChange} className="w-full border p-2 rounded text-sm focus:border-blue-500 outline-none" placeholder="Party Name" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Extra Charges */}
                        <div className="lg:col-span-2 bg-white border rounded-xl p-6 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-4">💰 Extra Charges & Taxes</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div><label className="text-xs font-bold text-gray-500">Insurance</label><input type="number" name="insurance" value={formData.insurance} onChange={handleChange} className="w-full border rounded p-2 text-right font-medium" /></div>
                                <div><label className="text-xs font-bold text-gray-500">Cartage</label><input type="number" name="cartage" value={formData.cartage} onChange={handleChange} className="w-full border rounded p-2 text-right font-medium" /></div>
                                <div><label className="text-xs font-bold text-gray-500">Loading</label><input type="number" name="loading" value={formData.loading} onChange={handleChange} className="w-full border rounded p-2 text-right font-medium" /></div>
                                <div><label className="text-xs font-bold text-gray-500">Unloading</label><input type="number" name="unloading" value={formData.unloading} onChange={handleChange} className="w-full border rounded p-2 text-right font-medium" /></div>
                            </div>

                            <div className="border-t pt-4 grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-1">SGST (%)</label>
                                    <div className="flex gap-2"><input type="number" name="sgstPercent" value={formData.sgstPercent} onChange={handleChange} className="w-16 border rounded p-1 text-center" placeholder="0" />
                                        <span className="text-gray-400 text-sm py-1">₹{formData.sgst}</span></div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-1">CGST (%)</label>
                                    <div className="flex gap-2"><input type="number" name="cgstPercent" value={formData.cgstPercent} onChange={handleChange} className="w-16 border rounded p-1 text-center" placeholder="0" />
                                        <span className="text-gray-400 text-sm py-1">₹{formData.cgst}</span></div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block mb-1">IGST (%)</label>
                                    <div className="flex gap-2"><input type="number" name="igstPercent" value={formData.igstPercent} onChange={handleChange} className="w-16 border rounded p-1 text-center" placeholder="0" />
                                        <span className="text-gray-400 text-sm py-1">₹{formData.igst}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer: Remarks & Totals */}
                    <div className="bg-gray-800 text-white rounded-xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="w-full md:w-1/2">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Remarks</label>
                            <input name="remarks" value={formData.remarks} onChange={handleChange} className="w-full bg-gray-700 border-none rounded p-3 text-white placeholder-gray-500 focus:ring-1 focus:ring-gray-500" placeholder="Add any special instructions..." />
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-400">Total Payable Amount</p>
                            <h2 className="text-4xl font-bold tracking-tight text-green-400">₹ {totals.grandTotal}</h2>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={handleReset} className="px-6 py-3 rounded-lg font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 transition">
                            Reset Form
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            disabled={!isSaved}
                            className={`px-6 py-3 rounded-lg font-bold text-white flex items-center gap-2 transition ${isSaved ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg' : 'bg-gray-400 cursor-not-allowed'}`}
                        >
                            🖨️ Print Receipt
                        </button>
                        <button type="submit" className="px-10 py-3 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 shadow-xl transform hover:scale-105 transition-all">
                            {isSaved ? '✅ Entry Saved' : 'Create Booking 🚀'}
                        </button>
                    </div>

                </form>

                {/* Agent Creation Modal */}
                {showAgentModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
                            <div className="bg-green-600 text-white px-5 py-3 flex justify-between items-center">
                                <h3 className="font-bold">➕ Add New Agent</h3>
                                <button onClick={() => setShowAgentModal(false)} className="text-white/70 hover:text-white text-xl">×</button>
                            </div>
                            <div className="p-5 space-y-3">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Agent Name <span className="text-red-500">*</span></label>
                                    <input type="text" value={newAgentName} onChange={(e) => setNewAgentName(e.target.value)} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="Enter agent name" autoFocus />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Mobile</label>
                                    <input type="text" value={newAgentMobile} onChange={(e) => setNewAgentMobile(e.target.value)} className="border border-gray-300 p-2.5 w-full rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="Mobile number" />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={handleCreateAgent} className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-bold hover:bg-green-700 transition">✅ Create</button>
                                    <button onClick={() => setShowAgentModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-bold hover:bg-gray-300 transition">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Hidden Print Component */}
                <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                    <div ref={componentRef}>
                        <PrintReceipt data={printData} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LuggageForm;
