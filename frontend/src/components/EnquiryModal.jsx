import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const EnquiryModal = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            await axios.post('/api/enquiries', {
                name,
                mobile,
                message,
            }, config);

            toast.success('Enquiry Sent Successfully!');
            onClose();
            // Reset form
            setName('');
            setMobile('');
            setMessage('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send enquiry');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in-down">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
                <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white">
                    <h2 className="text-xl font-bold">Send Enquiry</h2>
                    <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded-full transition">
                        <span className="text-2xl">&times;</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                placeholder="Your Name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                            <input
                                type="text"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                placeholder="Mobile No"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 rounded-lg h-32 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition resize-none"
                            placeholder="How can we help you?"
                            required
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition transform hover:-translate-y-0.5 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sending...' : 'Send Enquiry'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EnquiryModal;
