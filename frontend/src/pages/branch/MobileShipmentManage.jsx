import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import {
    ArrowLeft,
    Printer,
    User,
    MapPin,
    Box,
    Calendar,
    Clock,
    Phone,
    RefreshCw,
    X,
    AlertTriangle
} from 'lucide-react';

const MobileShipmentManage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const config = useMemo(() => ({
        headers: { Authorization: `Bearer ${user?.token}` }
    }), [user?.token]);

    const [shipment, setShipment] = useState(null);
    const [loading, setLoading] = useState(true);

    // Dialog state for updating location checkpoint/status
    const [isCheckpointModalOpen, setIsCheckpointModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('checkpoint'); // 'checkpoint' | 'destination' | 'update-status'
    const [targetStatus, setTargetStatus] = useState('');
    const [newLocation, setNewLocation] = useState('');
    const [managingBranch, setManagingBranch] = useState('');
    const [checkpointRemark, setCheckpointRemark] = useState('');

    const fetchShipment = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`/api/mobile-users/shipments/${id}`, config);
            setShipment(data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch shipment details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.token && id) {
            fetchShipment();
        }
    }, [user?.token, id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-40">
                <RefreshCw className="animate-spin text-purple-600" size={32} />
            </div>
        );
    }

    if (!shipment) {
        return (
            <div className="text-center py-40 text-slate-400 space-y-4">
                <AlertTriangle size={48} className="mx-auto text-slate-300" />
                <h4 className="font-bold text-slate-700 text-lg">Shipment not found</h4>
                <Link to="/branch/mobile-users" className="text-purple-600 font-bold hover:underline">
                    Back to Mobile Users
                </Link>
            </div>
        );
    }

    // Save Location Checkpoint or Status Update
    const saveLocationCheckpoint = async () => {
        if (!newLocation.trim()) {
            toast.error('Please enter current location');
            return;
        }
        if (!managingBranch.trim()) {
            toast.error('Please enter managing branch');
            return;
        }

        try {
            const nextStatus = modalMode === 'checkpoint' ? shipment.currentStatus : targetStatus;
            
            const { data } = await axios.put(`/api/mobile-users/shipments/${id}`, {
                currentStatus: nextStatus,
                currentLocation: newLocation,
                currentBranch: managingBranch,
                remarks: checkpointRemark || (modalMode === 'checkpoint' ? `Location checkpoint updated to ${newLocation}` : `Shipment updated to ${nextStatus}`)
            }, config);

            toast.success(`Shipment updated successfully`);
            setShipment(data);
            setIsCheckpointModalOpen(false);
            setNewLocation('');
            setManagingBranch('');
            setCheckpointRemark('');
            setTargetStatus('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save update');
        }
    };

    // Open Modal for Status transitions
    const openStatusModal = (status) => {
        setModalMode('update-status');
        setTargetStatus(status);
        setNewLocation(shipment.currentLocation || '');
        setManagingBranch(shipment.currentBranch || 'Central Hub');
        setCheckpointRemark('');
        setIsCheckpointModalOpen(true);
    };

    const steps = [
        'New Requests',
        'Accepted',
        'Pickup Pending',
        'Picked Up',
        'At Branch',
        'In Transit',
        'Destination Arrived',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
        'Issue'
    ];

    // Helper for Operator action card messages
    const getOperatorControls = () => {
        if (!shipment) return { message: '', primaryButton: null };
        const status = shipment.currentStatus || 'Pending';
        switch (status) {
            case 'Pending':
                return {
                    message: "New shipment request received. Review and accept the shipment to proceed.",
                    primaryButton: (
                        <button
                            onClick={() => openStatusModal('Accepted')}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-md transition duration-200 text-xs uppercase tracking-wider"
                        >
                            Accept Shipment
                        </button>
                    )
                };
            case 'Accepted':
                return {
                    message: "Shipment accepted. Mark as pickup pending to schedule dispatch staff.",
                    primaryButton: (
                        <button
                            onClick={() => openStatusModal('Pickup Pending')}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-md transition duration-200 text-xs uppercase tracking-wider"
                        >
                            Mark Pickup Pending
                        </button>
                    )
                };
            case 'Pickup Pending':
                return {
                    message: "Pickup scheduled. When the staff retrieves the parcel, mark it as Picked Up.",
                    primaryButton: (
                        <button
                            onClick={() => openStatusModal('Picked Up')}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-md transition duration-200 text-xs uppercase tracking-wider"
                        >
                            Mark Picked Up
                        </button>
                    )
                };
            case 'Picked Up':
                return {
                    message: "Parcel successfully retrieved. Mark as At Branch once received at the hub.",
                    primaryButton: (
                        <button
                            onClick={() => openStatusModal('At Branch')}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-md transition duration-200 text-xs uppercase tracking-wider"
                        >
                            Mark At Branch
                        </button>
                    )
                };
            case 'At Branch':
                return {
                    message: "Parcel is currently processed at the branch. Mark as In Transit when loaded.",
                    primaryButton: (
                        <button
                            onClick={() => openStatusModal('In Transit')}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-md transition duration-200 text-xs uppercase tracking-wider"
                        >
                            Mark In Transit
                        </button>
                    )
                };
            case 'In Transit':
                return {
                    message: "Parcel is in transit. Update location checkpoints, or mark as Arrived at Destination Branch.",
                    primaryButton: (
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={() => {
                                    setModalMode('checkpoint');
                                    setTargetStatus(shipment.currentStatus);
                                    setNewLocation(shipment.currentLocation || '');
                                    setManagingBranch(shipment.currentBranch || 'Central Hub');
                                    setCheckpointRemark('');
                                    setIsCheckpointModalOpen(true);
                                }}
                                className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold px-5 py-3 rounded-xl shadow-sm transition duration-200 text-xs uppercase tracking-wider bg-white"
                            >
                                Update Location Checkpoint
                            </button>
                            <button
                                onClick={() => {
                                    setModalMode('destination');
                                    setTargetStatus('Destination Arrived');
                                    setNewLocation(shipment.deliveryAddress || shipment.deliveryCity || '');
                                    setManagingBranch(shipment.deliveryCity || 'Central Hub');
                                    setCheckpointRemark('');
                                    setIsCheckpointModalOpen(true);
                                }}
                                className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold px-5 py-3 rounded-xl shadow-md transition duration-200 text-xs uppercase tracking-wider"
                            >
                                Reached Destination Branch
                            </button>
                        </div>
                    )
                };
            case 'Destination Arrived':
                return {
                    message: "Parcel arrived at destination branch. Mark Out for Delivery to assign courier.",
                    primaryButton: (
                        <button
                            onClick={() => openStatusModal('Out for Delivery')}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-md transition duration-200 text-xs uppercase tracking-wider"
                        >
                            Mark Out for Delivery
                        </button>
                    )
                };
            case 'Out for Delivery':
                return {
                    message: "Courier is delivering the parcel. Mark as Delivered once confirmed.",
                    primaryButton: (
                        <button
                            onClick={() => openStatusModal('Delivered')}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-6 py-3 rounded-xl shadow-md transition duration-200 text-xs uppercase tracking-wider"
                        >
                            Mark Delivered
                        </button>
                    )
                };
            default:
                return {
                    message: "Shipment status is update complete or cancelled.",
                    primaryButton: null
                };
        }
    };

    const controls = getOperatorControls();

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />

            {/* Back & Print Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Link
                    to="/branch/mobile-users"
                    className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-bold transition duration-150 print:hidden text-sm"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Mobile Users</span>
                </Link>
                <button
                    onClick={() => window.print()}
                    className="bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-xl border shadow-sm transition duration-200 flex items-center gap-2 text-xs self-end print:hidden"
                >
                    <Printer size={14} />
                    <span>Print Receipt</span>
                </button>
            </div>

            {/* Title Block */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                                Tracking: {shipment.lrNumber || shipment.trackingId || 'N/A'}
                            </h2>
                            <span className="bg-orange-100 text-orange-800 text-xs px-3 py-1 rounded-full font-black tracking-wide uppercase">
                                {shipment.currentStatus || 'Pending'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold">
                            Booked on: {new Date(shipment.createdAt || Date.now()).toLocaleString()}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="bg-purple-50 text-purple-700 text-xs px-3 py-1.5 rounded-lg font-bold">
                            Branch: {shipment.currentBranch || 'N/A'}
                        </span>
                        <span className="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-lg font-bold">
                            Location: {shipment.currentLocation || 'N/A'}
                        </span>
                    </div>
                </div>

                {/* Details Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-slate-100 text-sm">
                    {/* CUSTOMER DETAILS */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <User size={14} className="text-purple-600" />
                            <span>Customer Details</span>
                        </div>
                        <div>
                            <div className="font-extrabold text-slate-800">{shipment.customerName}</div>
                            <div className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-1">
                                <Phone size={12} className="text-slate-400" />
                                <span>{shipment.mobileNumber}</span>
                            </div>
                        </div>
                    </div>

                    {/* SHIPMENT ROUTE */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <MapPin size={14} className="text-purple-600" />
                            <span>Shipment Route</span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                            <div className="flex items-start gap-1">
                                <span className="bg-blue-600 text-white text-[8px] px-1 rounded font-black tracking-wide shrink-0">FROM</span>
                                <div className="text-slate-700 font-bold">
                                    {shipment.pickupCity || 'Unknown'}
                                    <span className="block text-[10px] text-slate-400 font-normal italic">{shipment.pickupAddress}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-1">
                                <span className="bg-green-600 text-white text-[8px] px-1 rounded font-black tracking-wide shrink-0">TO</span>
                                <div className="text-slate-700 font-bold">
                                    {shipment.deliveryCity || 'Unknown'}
                                    <span className="block text-[10px] text-slate-400 font-normal italic">{shipment.deliveryAddress}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PACKAGE SPECIFICATIONS */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <Box size={14} className="text-purple-600" />
                            <span>Package Specifications</span>
                        </div>
                        <div>
                            <div className="font-extrabold text-slate-800">{shipment.parcelType || 'Standard Parcel'}</div>
                            <div className="text-xs text-slate-500 font-semibold mt-0.5">
                                {shipment.quantity || 1} PKG • {shipment.weight || 0} kg
                            </div>
                            <span className="inline-block border border-purple-200 bg-purple-50 text-purple-700 text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider mt-1.5">
                                {shipment.transportType || 'STANDARD'}
                            </span>
                        </div>
                    </div>

                    {/* ADDITIONAL INFO */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <Calendar size={14} className="text-purple-600" />
                            <span>Additional Info</span>
                        </div>
                        <div className="space-y-1 text-xs font-semibold text-slate-600">
                            <div>Expected: <span className="text-slate-800">{shipment.expectedDeliveryDate ? new Date(shipment.expectedDeliveryDate).toLocaleDateString() : 'N/A'}</span></div>
                            {shipment.assignedStaff && <div>Staff: <span className="text-slate-800 font-extrabold">{shipment.assignedStaff}</span></div>}
                            {shipment.remarks && <div className="text-[10px] text-slate-400 italic font-normal">"{shipment.remarks}"</div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stepper Status Bar */}
            <div className="bg-white rounded-2xl border shadow-sm p-4 overflow-x-auto print:hidden">
                <div className="flex items-center min-w-[1000px] gap-2 py-2">
                    {(() => {
                        const currentStatusNormalized = (shipment.currentStatus || 'Pending').toLowerCase().replace(/\s/g, '');
                        const currentStepIndex = steps.findIndex(st => st.toLowerCase().replace(/\s/g, '') === currentStatusNormalized);

                        return steps.map((st, idx) => {
                            const isCurrent = currentStatusNormalized === st.toLowerCase().replace(/\s/g, '');
                            const isPrevious = idx < currentStepIndex && idx < 9;
                            
                            let btnStyle = 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200';
                            if (isCurrent) {
                                btnStyle = 'bg-purple-600 text-white shadow-md border-purple-500';
                            } else if (isPrevious) {
                                btnStyle = 'bg-purple-100 text-purple-800 border-purple-200 cursor-not-allowed';
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => !isPrevious && openStatusModal(st)}
                                    disabled={isPrevious}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-200 shrink-0 border ${btnStyle}`}
                                >
                                    <span className="mr-1">{isCurrent ? '●' : isPrevious ? '✓' : '○'}</span>
                                    {st}
                                </button>
                            );
                        });
                    })()}
                </div>
            </div>

            {/* Operator Actions & History list */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Branch Shipment Operator */}
                <div className="lg:col-span-2 space-y-6 print:hidden">
                    <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-6">
                        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
                            <span className="bg-purple-100 p-2 rounded-lg text-purple-700">🛡️</span>
                            <span>Branch Shipment Operator</span>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border text-sm text-slate-700 space-y-4">
                            <p className="font-semibold text-slate-600">{controls.message}</p>
                            {controls.primaryButton}
                        </div>

                        {/* Smaller control actions */}
                        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                            <button
                                onClick={() => openStatusModal('Issue')}
                                className="border border-orange-200 bg-orange-50/50 hover:bg-orange-50 text-orange-700 font-bold px-4 py-2.5 rounded-xl text-xs transition duration-200 flex items-center gap-1.5"
                            >
                                <AlertTriangle size={14} />
                                <span>Report Delay / Issue</span>
                            </button>
                            <button
                                onClick={() => openStatusModal('Cancelled')}
                                className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs transition duration-200"
                            >
                                <span>Cancel Shipment</span>
                            </button>
                            <a
                                href={`tel:${shipment.mobileNumber}`}
                                className="border border-purple-200 hover:bg-purple-50 text-purple-600 font-bold px-4 py-2.5 rounded-xl text-xs transition duration-200 flex items-center gap-1.5"
                            >
                                <Phone size={14} />
                                <span>Contact Customer</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Tracking History Timeline */}
                <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800 border-b pb-3">
                        <Clock size={18} className="text-purple-600" />
                        <span>Tracking History</span>
                    </div>
                    <div className="pt-2">
                        {(!shipment.trackingHistory || shipment.trackingHistory.length === 0) ? (
                            <p className="text-sm text-slate-400 font-semibold py-10 text-center">
                                No tracking checkpoints registered.
                            </p>
                        ) : (
                            <div className="relative pl-6 border-l border-purple-200 space-y-6">
                                {shipment.trackingHistory.map((t, idx) => (
                                    <div key={t._id || idx} className="relative space-y-1.5">
                                        {/* Dot */}
                                        <span className="absolute -left-[31px] top-1.5 w-4 h-4 bg-purple-600 border-4 border-white rounded-full shadow-sm"></span>
                                        
                                        <div className="flex justify-between items-start">
                                            <div className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">
                                                {t.status}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold">
                                                {new Date(t.dateTime || t.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        
                                        <div className="text-xs text-slate-600 font-medium">
                                            <span className="font-bold text-slate-800">{t.location}</span> ({t.branchName || 'Branch'})
                                        </div>

                                        {t.remark && (
                                            <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                "{t.remark}"
                                            </p>
                                        )}
                                        
                                        <div className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                                            UPDATED BY: {t.updatedBy || 'ADMIN'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Checkpoint/Status Update Dialog Modal */}
            {isCheckpointModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                        <div className="bg-slate-50/80 px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-black text-slate-800 text-base tracking-wider uppercase">
                                    {modalMode === 'checkpoint' ? 'Update Location Checkpoint' : modalMode === 'destination' ? 'Mark Reached Destination Branch' : `Mark ${targetStatus}`}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5 font-semibold">
                                    {modalMode === 'checkpoint' ? 'Add a transit checkpoint update' : `Confirm status change to: ${targetStatus}`}
                                </p>
                            </div>
                            <button onClick={() => {
                                setIsCheckpointModalOpen(false);
                                setTargetStatus('');
                            }} className="text-slate-400 hover:text-slate-700 hover:rotate-90 transition duration-200">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 bg-white">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Location *</label>
                                <input
                                    type="text"
                                    value={newLocation}
                                    onChange={(e) => setNewLocation(e.target.value)}
                                    placeholder="e.g. Pune Hub, Transit Point A"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition duration-150"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Managing Branch *</label>
                                <input
                                    type="text"
                                    value={managingBranch}
                                    onChange={(e) => setManagingBranch(e.target.value)}
                                    placeholder="e.g. Central Hub"
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition duration-150"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remarks / Comments</label>
                                <textarea
                                    rows={3}
                                    value={checkpointRemark}
                                    onChange={(e) => setCheckpointRemark(e.target.value)}
                                    placeholder="Enter additional remarks or update details..."
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition duration-150"
                                />
                            </div>
                        </div>
                        <div className="bg-slate-50/60 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setIsCheckpointModalOpen(false);
                                    setTargetStatus('');
                                }}
                                className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition duration-200 border"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveLocationCheckpoint}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition duration-200 shadow-md"
                            >
                                Save Update
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MobileShipmentManage;
