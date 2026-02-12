import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PrintReceipt from '../components/PrintReceipt';

const PrintPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [luggageData, setLuggageData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = user.token;
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const { data } = await axios.get(`/api/luggage/${id}`, config);
                setLuggageData(data);
                setLoading(false);

                // Auto-print after data loads
                setTimeout(() => {
                    window.print();
                }, 1000);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [id, user]);

    if (loading) return <div>Loading Preview...</div>;
    if (!luggageData) return <div>Error loading data.</div>;

    return (
        <div className="bg-gray-500 min-h-screen p-4 flex justify-center print:bg-white print:p-0">
            <div className="bg-white shadow-lg print:shadow-none">
                <PrintReceipt data={luggageData} />
            </div>
        </div>
    );
};

export default PrintPage;
