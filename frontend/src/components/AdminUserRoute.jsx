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

    if (user.role === 'customer') {
        return <Navigate to="/customer/dashboard" />;
    }

    if (user.role === 'agent') {
        return <Navigate to="/agent/dashboard" />;
    }

    return <Outlet />;
};

export default AdminUserRoute;