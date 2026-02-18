import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X, Package, LayoutDashboard, PlusCircle, LogOut } from "lucide-react";

const CustomerLayout = () => {
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const navLinks = [
        { to: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/customer/new-request", label: "New Request", icon: PlusCircle },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <nav className="sticky top-0 z-50 bg-gradient-to-r from-emerald-900 via-teal-900 to-cyan-900 backdrop-blur-md border-b border-white/10 shadow-lg">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Link
                        to="/customer/dashboard"
                        className="flex items-center gap-3 group relative"
                    >
                        <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-lg blur opacity-25 group-hover:opacity-60 transition duration-500"></div>
                        <div className="relative bg-white p-2 rounded-xl border border-white/10 shadow-xl group-hover:scale-105 transition-all duration-300">
                            <Package className="h-7 w-7 text-emerald-700" />
                        </div>
                        <div className="relative flex flex-col">
                            <span className="text-2xl font-black tracking-tight text-white leading-none">
                                ONLINE{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">
                                    GO
                                </span>
                            </span>
                            <span className="text-[0.65rem] font-medium text-emerald-200/70 tracking-widest uppercase">
                                Customer Portal
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-6">
                        <div className="bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                            <span className="text-emerald-100/80 text-sm font-medium">
                                Welcome,{" "}
                                <span className="text-white font-semibold">{user?.name}</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10">
                            {navLinks.map((link) => {
                                const Icon = link.icon;
                                return (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${isActive(link.to)
                                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                                                : "text-gray-300 hover:text-white hover:bg-white/10"
                                            }`}
                                    >
                                        <Icon size={16} />
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>

                        <button
                            onClick={logout}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 group"
                        >
                            <span>Logout</span>
                            <LogOut className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="lg:hidden bg-emerald-950 border-b border-white/10 p-4 absolute top-full left-0 right-0 shadow-2xl">
                        <div className="flex flex-col gap-4">
                            <div className="bg-white/5 px-4 py-3 rounded-xl flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                <span className="text-emerald-100/80 text-sm font-medium">
                                    Welcome,{" "}
                                    <span className="text-white font-semibold">{user?.name}</span>
                                </span>
                            </div>

                            <div className="flex flex-col gap-2">
                                {navLinks.map((link) => {
                                    const Icon = link.icon;
                                    return (
                                        <Link
                                            key={link.to}
                                            to={link.to}
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${isActive(link.to)
                                                    ? "bg-emerald-500/20 text-emerald-300"
                                                    : "text-gray-300 hover:text-white hover:bg-white/10"
                                                }`}
                                        >
                                            <Icon size={18} />
                                            {link.label}
                                        </Link>
                                    );
                                })}
                            </div>

                            <button
                                onClick={logout}
                                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <span>Logout</span>
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </nav>
            <main className="flex-grow container mx-auto p-4 md:p-6">
                <Outlet />
            </main>
        </div>
    );
};

export default CustomerLayout;
