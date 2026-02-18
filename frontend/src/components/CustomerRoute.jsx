import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CustomerRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    // If user is not a customer, redirect to admin/user dashboard
    if (user.role !== 'customer') {
        return <Navigate to="/dashboard" />;
    }

    return <Outlet />;
};

export default CustomerRoute;
