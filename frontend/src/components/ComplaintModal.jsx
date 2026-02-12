import { useState, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import { X } from 'lucide-react'; // Assuming lucide-react is installed, if not we'll use a text X

const ComplaintModal = ({ isOpen, onClose }) => {
    const [subject, setSubject] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [description, setDescription] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactMobile, setContactMobile] = useState('');
    const [receiptNo, setReceiptNo] = useState('');
    const [loading, setLoading] = useState(false);

    const { user } = useContext(AuthContext);

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

            if (user && user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }

            await axios.post('/api/complaints', {
                subject,
                priority,
                description,
                receiptNo,
                contactName,
                contactMobile
            }, config);

            toast.success('Complaint Registered Successfully!');
            onClose();
            // Reset form
            setSubject('');
            setDescription('');
            setReceiptNo('');
            setPriority('Medium');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to raise complaint');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in-down">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
                <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white">
                    <h2 className="text-xl font-bold">Raise a Complaint</h2>
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
                                value={contactName}
                                onChange={(e) => setContactName(e.target.value)}
                                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                placeholder="Your Name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                            <input
                                type="text"
                                value={contactMobile}
                                onChange={(e) => setContactMobile(e.target.value)}
                                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                placeholder="Mobile No"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Receipt / ONL Number <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={receiptNo}
                            onChange={(e) => setReceiptNo(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            placeholder="e.g. ONL-12345"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                placeholder="Issue Summary"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 rounded-lg h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                            placeholder="Describe your issue in detail..."
                            required
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition transform hover:-translate-y-0.5 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Submitting...' : 'Submit Complaint'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ComplaintModal;
