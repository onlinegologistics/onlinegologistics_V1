import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import {
    AlertCircle,
    CheckCircle2,
    Loader2,
    MessageCircle,
    RefreshCw,
} from 'lucide-react';

const WhatsApp = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState({
        connected: false,
        qr: null,
        state: 'starting',
        message: 'Connecting to WhatsApp',
    });
    const [loading, setLoading] = useState(true);
    const [requestError, setRequestError] = useState('');
    const [restarting, setRestarting] = useState(false);
    const [showRetry, setShowRetry] = useState(false);

    const config = { headers: { Authorization: `Bearer ${user?.token}` } };

    const fetchStatus = async () => {
        try {
            const { data } = await axios.get('/api/whatsapp/status', config);
            setStatus(data);
            setRequestError('');
        } catch (e) {
            setRequestError(e.response?.data?.message || 'WhatsApp status load nahi ho saka.');
        } finally {
            setLoading(false);
        }
    };

    const generateNewQr = async () => {
        setRestarting(true);
        setRequestError('');
        try {
            const { data } = await axios.post('/api/whatsapp/restart', {}, config);
            setStatus(data);
            setShowRetry(false);
            toast.success('Naya QR code generate ho raha hai');
        } catch (e) {
            setRequestError(e.response?.data?.message || 'Naya QR code generate nahi ho saka.');
        } finally {
            setRestarting(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (status.connected || status.qr) {
            setShowRetry(false);
            return undefined;
        }

        const timer = setTimeout(() => setShowRetry(true), 15000);
        return () => clearTimeout(timer);
    }, [status.connected, status.qr, status.updatedAt]);

    return (
        <div className="space-y-5">
            <Toaster position="top-right" />

            <div>
                <h1 className="text-2xl font-bold text-gray-800">WhatsApp Connection</h1>
                <p className="text-gray-500 text-sm">Booking confirmation messages WhatsApp ke through bhejne ke liye connect karein</p>
            </div>

            <div className="bg-white rounded-2xl shadow border p-6 flex flex-col items-center justify-center text-center min-h-[320px]">
                {loading ? (
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Loader2 className="animate-spin" size={32} />
                        <p className="text-sm">Loading status...</p>
                    </div>
                ) : status.connected ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold flex items-center gap-2">
                            <CheckCircle2 size={20} />
                            WhatsApp Connected ✅
                        </div>
                        <p className="text-gray-500 text-sm">Booking confirmations ab automatically WhatsApp par bhej di jayengi.</p>
                    </div>
                ) : status.qr ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full font-bold flex items-center gap-2 mb-2">
                            <MessageCircle size={16} />
                            Scan QR to Connect
                        </div>
                        <img src={status.qr} alt="WhatsApp QR Code" className="w-64 h-64 border rounded-xl shadow-sm" />
                        <p className="text-gray-500 text-sm max-w-sm">
                            WhatsApp app kholein → <span className="font-semibold">Settings</span> → <span className="font-semibold">Linked Devices</span> → <span className="font-semibold">Link a Device</span> → is QR code ko scan karein.
                        </p>
                    </div>
                ) : requestError || status.state === 'error' ? (
                    <div className="flex max-w-md flex-col items-center gap-3 text-gray-600">
                        <AlertCircle className="text-red-500" size={36} />
                        <p className="font-semibold text-gray-800">QR code generate nahi ho saka</p>
                        <p className="text-sm">
                            {requestError || status.message || 'WhatsApp connection start nahi ho paaya.'}
                        </p>
                        <button
                            type="button"
                            onClick={generateNewQr}
                            disabled={restarting}
                            className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCw className={restarting ? 'animate-spin' : ''} size={17} />
                            {restarting ? 'Generating...' : 'Generate New QR'}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Loader2 className="animate-spin" size={32} />
                        <p className="text-sm">{status.message || 'QR code generate ho raha hai, please wait...'}</p>
                        {showRetry && (
                            <button
                                type="button"
                                onClick={generateNewQr}
                                disabled={restarting}
                                className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-lg border border-cyan-700 px-4 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <RefreshCw className={restarting ? 'animate-spin' : ''} size={17} />
                                {restarting ? 'Generating...' : 'Generate New QR'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhatsApp;
