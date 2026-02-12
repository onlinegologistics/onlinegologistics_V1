import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import PublicNavbar from '../components/PublicNavbar';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, LogIn, ArrowLeft, ShieldCheck, Zap, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await login(username, password);
            if (result.success) {
                toast.success('Logged in successfully');
                setTimeout(() => navigate('/new-entry'), 500);
            } else {
                toast.error(result.message);
                setIsLoading(false);
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
            <Toaster position="top-right" />

            {/* Navbar Spacer */}
            <div className="z-50">
                <PublicNavbar />
            </div>

            {/* Main Content Area - Perfectly Centered without Scroll */}
            <main className="flex-grow flex flex-col items-center justify-center pt-20 px-6 lg:px-12">
                <div className="w-full max-w-7xl mx-auto h-auto min-h-[500px] lg:h-[70vh] flex flex-col lg:flex-row bg-white rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden">

                    {/* Left Side - Visual/Branding */}
                    <div className="hidden lg:flex lg:w-5/12 relative bg-slate-950 items-center justify-center p-10 overflow-hidden h-full">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -mr-64 -mt-64"></div>
                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -ml-64 -mb-64"></div>

                        <div className="relative z-10 w-full">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                                <span className="inline-block px-4 py-1.5 bg-blue-500/10 backdrop-blur-md border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black tracking-widest uppercase mb-6">
                                    Administrator Access
                                </span>
                                <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-6">
                                    Empowering <br />
                                    <span className="text-blue-600 italic uppercase">Logistics</span> <br />
                                    Excellence.
                                </h1>
                                <p className="text-sm text-slate-400 leading-relaxed mb-10">
                                    Securely access your dashboard to manage billing and track shipments across Maharashtra's premier network.
                                </p>
                            </motion.div>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { icon: ShieldCheck, label: "Secure Data" },
                                    { icon: Zap, label: "Fast Billing" },
                                    { icon: Globe, label: "State-wide" },
                                    { icon: User, label: "Easy Access" }
                                ].map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 + (idx * 0.1) }}
                                        className="flex items-center gap-3 text-slate-300"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                                            <item.icon className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <span className="font-bold text-[10px] tracking-wide uppercase">{item.label}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Login Form */}
                    <div className="flex-1 flex items-center justify-center p-8 lg:p-12 bg-white relative h-full">
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="w-full max-w-sm"
                        >
                            <div className="text-center lg:text-left mb-8">
                                <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter uppercase tracking-widest">Sign In</h2>
                                <p className="text-slate-500 text-xs font-medium">Enter your details to access your account.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] ml-1">Username</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 font-medium text-slate-900 placeholder-slate-400 text-sm"
                                            placeholder="admin_id"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Password</label>
                                        <a href="#" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors">Forgot?</a>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                            <Lock className="h-5 w-5" />
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 font-medium text-slate-900 placeholder-slate-400 text-sm"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center items-center gap-3 py-4 px-4 bg-slate-950 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all duration-300 shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed group"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>Sign In Now <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                                <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-xs tracking-tight">
                                    <ArrowLeft className="w-4 h-4" /> Back to Homepage
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>

            {/* Micro Footer - Sticky at the very bottom */}
            <div className="py-6 text-center">
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.5em] opacity-50">
                    &copy; {new Date().getFullYear()} ONLINE GO Luggage Billing. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default Login;
