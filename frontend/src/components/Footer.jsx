import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, ArrowRight } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-slate-950 text-white pt-24 pb-12 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] -mr-64 -mt-64"></div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20">
                    {/* Brand Section */}
                    <div className="lg:col-span-4">
                        <Link to="/" className="flex items-center gap-3 group mb-8">
                            <div className="bg-white p-1.5 rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300">
                                <img
                                    src="/assets/logo.png"
                                    alt="Logo"
                                    className="h-8 w-8 object-contain"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-black tracking-tight text-white leading-none">
                                    <span className="text-blue-500">Online</span>Go
                                </span>
                                <span className="text-[0.65rem] font-bold text-slate-400 tracking-[0.2em] uppercase mt-0.5">
                                    Logistics
                                </span>
                            </div>
                        </Link>
                        <p className="text-slate-400 text-lg leading-relaxed max-w-sm mb-10">
                            The ultimate solution for transport offices. Manage billing, track shipments across Maharashtra, and generate GST-compliant receipts instantly.
                        </p>
                        <div className="flex gap-4">
                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, idx) => (
                                <a key={idx} href="#" className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-blue-600 hover:border-blue-500 hover:-translate-y-1 transition-all duration-300">
                                    <Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Sections */}
                    <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-12 gap-12">
                        <div className="text-left sm:col-span-3">
                            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-8">Navigation</h4>
                            <ul className="space-y-4">
                                {['Home', 'Services'].map((item) => (
                                    <li key={item}>
                                        <Link to={item === 'Home' ? '/' : `/${item.toLowerCase().replace(' ', '-')}`} className="text-slate-400 hover:text-blue-400 transition-colors flex items-center group">
                                            <span className="w-0 group-hover:w-4 h-[2px] bg-blue-500 mr-0 group-hover:mr-2 transition-all duration-300"></span>
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="text-left sm:col-span-3">
                            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-8">Support</h4>
                            <ul className="space-y-4">
                                {['Raise Complaint', 'Enquiry', 'Documentation', 'Help Center'].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors flex items-center group">
                                            <span className="w-0 group-hover:w-4 h-[2px] bg-blue-500 mr-0 group-hover:mr-2 transition-all duration-300"></span>
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="text-left sm:col-span-6">
                            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-8">Our Locations</h4>
                            <div className="space-y-6">
                                {/* Sangamwadi */}
                                <div className="flex gap-4 group">
                                    <div className="mt-1 w-8 h-8 rounded-lg bg-slate-900 flex-shrink-0 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                        <MapPin className="w-4 h-4 text-blue-500 group-hover:text-white" />
                                    </div>
                                    <div>
                                        <h5 className="text-white font-bold text-sm mb-1 group-hover:text-blue-400 transition-colors">Pune Hub</h5>
                                        <p className="text-slate-400 text-xs leading-relaxed mb-1">Sangamwadi parking 3, Sangamwadi, Pune</p>
                                        <a href="tel:+919766649757" className="text-blue-500 text-xs font-bold hover:text-white transition-colors flex items-center gap-1">
                                            +91 97666 49757
                                        </a>
                                    </div>
                                </div>

                                {/* Bhosari */}
                                <div className="flex gap-4 group">
                                    <div className="mt-1 w-8 h-8 rounded-lg bg-slate-900 flex-shrink-0 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                        <MapPin className="w-4 h-4 text-blue-500 group-hover:text-white" />
                                    </div>
                                    <div>
                                        <h5 className="text-white font-bold text-sm mb-1 group-hover:text-blue-400 transition-colors">Bhosari Hub</h5>
                                        <p className="text-slate-400 text-xs leading-relaxed mb-1">Pmt chowk, Bhosari</p>
                                        <a href="tel:+919172911722" className="text-blue-500 text-xs font-bold hover:text-white transition-colors flex items-center gap-1">
                                            +91 91729 11722
                                        </a>
                                    </div>
                                </div>

                                {/* Talawade */}
                                <div className="flex gap-4 group">
                                    <div className="mt-1 w-8 h-8 rounded-lg bg-slate-900 flex-shrink-0 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                        <MapPin className="w-4 h-4 text-blue-500 group-hover:text-white" />
                                    </div>
                                    <div>
                                        <h5 className="text-white font-bold text-sm mb-1 group-hover:text-blue-400 transition-colors">Logistics Store</h5>
                                        <p className="text-slate-400 text-xs leading-relaxed">
                                            Business Park, Sr no 199, Jotiba Nagar,<br /> Talawade 411062
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-slate-500 text-sm font-medium">
                        &copy; {new Date().getFullYear()} ONLINE GO Luggage Billing. Built for Scale.
                    </p>
                    <div className="flex gap-8 text-slate-500 text-sm font-medium">
                        <a href="#" className="hover:text-white transition">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition">Terms of Service</a>
                        <a href="#" className="hover:text-white transition">Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
