import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminUserRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    // If user is a customer, redirect to customer dashboard
    if (user.role === 'customer') {
        return <Navigate to="/customer/dashboard" />;
    }

    return <Outlet />;
};

export default AdminUserRoute;
