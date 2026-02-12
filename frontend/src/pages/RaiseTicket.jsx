import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthContext from '../context/AuthContext';
import PublicNavbar from '../components/PublicNavbar';

const RaiseTicket = () => {
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactMobile, setContactMobile] = useState('');
    const [receiptNo, setReceiptNo] = useState('');

    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            // Add token if user is logged in
            if (user && user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }

            await axios.post('/api/complaints', {
                subject,
                description,
                receiptNo,
                contactName: user ? undefined : contactName,
                contactMobile: user ? undefined : contactMobile
            }, config);

            toast.success('Ticket raised successfully');
            if (user) {
                navigate('/complaints');
            } else {
                navigate('/');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to raise ticket');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {!user && <PublicNavbar />}
            <div className="p-6 flex justify-center flex-grow">
                <div className="w-full max-w-2xl">
                    <h1 className="text-2xl font-bold mb-6 text-center">Raise a New Ticket</h1>
                    <div className="bg-white p-6 rounded shadow-md">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!user && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-medium mb-1">Your Name</label>
                                        <input
                                            type="text"
                                            value={contactName}
                                            onChange={(e) => setContactName(e.target.value)}
                                            className="w-full border p-2 rounded"
                                            placeholder="Enter your name"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-medium mb-1">Mobile Number</label>
                                        <input
                                            type="text"
                                            value={contactMobile}
                                            onChange={(e) => setContactMobile(e.target.value)}
                                            className="w-full border p-2 rounded"
                                            placeholder="Enter your mobile"
                                            required
                                        />
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block font-medium mb-1">Receipt / ONL Number</label>
                                <input
                                    type="text"
                                    value={receiptNo}
                                    onChange={(e) => setReceiptNo(e.target.value)}
                                    className="w-full border p-2 rounded"
                                    placeholder="e.g. ONL-12345"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full border p-2 rounded"
                                    placeholder="Brief summary of the issue"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full border p-2 rounded h-32"
                                    placeholder="Detailed description of the problem..."
                                    required
                                ></textarea>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold">
                                Submit Ticket
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RaiseTicket;
