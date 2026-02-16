import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Phone } from 'lucide-react';

const PublicNavbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300">
            {/* Glass Background Layer - Changed to White/Glass */}
            {/* Solid Background Layer - Changed to Solid White */}
            <div className="absolute inset-0 bg-white border-b border-slate-200 shadow-sm"></div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex justify-between items-center h-20">
                    {/* Logo Section */}
                    <Link to="/" className="flex items-center gap-3 group">
                        {/* Logo Image - Background Removed */}
                        <div className="group-hover:scale-105 transition-transform duration-300">
                            <img
                                src="/assets/logo.png"
                                alt="Logo"
                                className="h-10 md:h-14 w-auto object-contain"
                            />
                        </div>
                        <div className="flex flex-col -space-y-1">
                            {/* Text colors updated for white background */}
                            <span className="text-2xl md:text-3xl font-black tracking-tight text-blue-600 leading-none font-['Exo_2'] italic">
                                Online<span className="text-slate-900">Go</span>
                            </span>
                            <span className="text-[0.5rem] md:text-[0.65rem] font-bold text-slate-500 tracking-[0.35em] uppercase ml-1 font-['Exo_2']">
                                Logistics
                            </span>
                        </div>
                    </Link>

                    {/* Navigation Flow */}
                    <div className="flex items-center gap-10">
                        {/* Desktop Links - Changed to Blue as requested */}
                        <div className="hidden md:flex items-center gap-8">
                            {['Home', 'Services'].map((item) => (
                                <Link
                                    key={item}
                                    to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                                    className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors tracking-wide uppercase relative group/link"
                                >
                                    {item}
                                    {/* Link Underline Effect */}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover/link:w-full"></span>
                                </Link>
                            ))}
                        </div>

                        {/* Premium Login Button - Glass White Style */}
                        <Link
                            to="/login"
                            className="hidden md:block relative group px-8 py-2.5 rounded-xl font-extrabold text-sm uppercase tracking-wider overflow-hidden transition-all duration-300"
                        >
                            {/* Glass Background */}
                            <div className="absolute inset-0 bg-white/40 backdrop-blur-md border border-white/50 shadow-[0_4px_12px_rgba(0,0,0,0.05)] group-hover:bg-blue-600 transition-all duration-300"></div>

                            {/* Content */}
                            <span className="relative z-10 text-blue-700 group-hover:text-white transition-colors duration-300 flex items-center gap-2">
                                User Login
                                {/* Subtle arrow on hover */}
                                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                            </span>

                            {/* Shine Effect */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
                            </div>
                        </Link>

                        {/* Help Line Number - Moved to right */}
                        <div className="hidden md:flex items-center gap-3 border-l border-slate-200 pl-6 ml-2">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center hover:scale-110 transition-transform duration-300">
                                <Phone className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Help Line</span>
                                <a href="tel:9209061234" className="text-base font-black text-slate-800 hover:text-blue-600 transition-colors tracking-tight">
                                    9209061234
                                </a>
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={toggleMenu}
                            className="md:hidden p-2 text-slate-600 hover:text-blue-600 transition-colors"
                        >
                            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div
                className={`md:hidden fixed inset-0 z-50 bg-white/95 backdrop-blur-lg transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                style={{ top: '80px' }} // Below navbar
            >
                <div className="flex flex-col p-6 space-y-6">
                    {['Home', 'Services'].map((item) => (
                        <Link
                            key={item}
                            to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                            className="text-xl font-bold text-slate-800 hover:text-blue-600 transition-colors uppercase tracking-wide border-b border-slate-100 pb-4"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {item}
                        </Link>
                    ))}
                    <Link
                        to="/login"
                        className="text-xl font-bold text-slate-800 hover:text-blue-600 transition-colors uppercase tracking-wide border-b border-slate-100 pb-4"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        User Login
                    </Link>

                    <a
                        href="tel:9209061234"
                        className="flex items-center gap-4 text-xl font-bold text-slate-800 hover:text-blue-600 transition-colors uppercase tracking-wide pt-2"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <Phone className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Help Line</span>
                            <span>9209061234</span>
                        </span>
                    </a>
                </div>
            </div>
        </nav>
    );
};

export default PublicNavbar;
