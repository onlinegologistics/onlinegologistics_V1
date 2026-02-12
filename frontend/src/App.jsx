import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewEntry from './pages/NewEntry';
import PrintPage from './pages/PrintPage';
import UserManagement from './pages/UserManagement';
import CreditOffices from './pages/CreditOffices';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

import Home from './pages/Home';
import Services from './pages/Services';
import ComplaintList from './pages/ComplaintList';
import Enquiries from './pages/Enquiries';
import RaiseTicket from './pages/RaiseTicket';
import Reports from './pages/Reports';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/raise-ticket" element={<RaiseTicket />} />

                    <Route element={<PrivateRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/new-entry" element={<NewEntry />} />
                            <Route path="/print/:id" element={<PrintPage />} />
                            <Route path="/complaints" element={<ComplaintList />} />
                            <Route path="/enquiries" element={<Enquiries />} />
                            <Route path="/users" element={<UserManagement />} />
                            <Route path="/credit-offices" element={<CreditOffices />} />
                            <Route path="/reports" element={<Reports />} />
                        </Route>
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
