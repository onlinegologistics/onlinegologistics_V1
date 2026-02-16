import React, { useState } from 'react';
import PublicNavbar from '../components/PublicNavbar';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import EnquiryModal from '../components/EnquiryModal';
import ComplaintModal from '../components/ComplaintModal';
import {
    Train,
    FileText,
    Truck,
    Package,
    Shield,
    MapPin,
    ArrowRight,
    Bus,
    Zap,
    Send
} from 'lucide-react';

const Services = () => {
    const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
    const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);

    const services = [
        {
            icon: Train,
            title: "Railway Cargo & Luggage",
            description: "Specialized handling for railway luggage. We ensure your parcels reach the station on time and are loaded securely for their journey.",
            color: "blue"
        },
        {
            icon: FileText,
            title: "GST Compliant Billing",
            description: "Automated, instant billing with full GST compliance. Get detailed tax invoices for all your commercial shipments.",
            color: "indigo"
        },
        {
            icon: Truck,
            title: "Door-to-Door Delivery",
            description: "Premium pickup and drop service. We collect from your doorstep and deliver safely to the destination address.",
            color: "emerald"
        },
        {
            icon: Package,
            title: "Bulk Parcel Management",
            description: "Efficient solutions for businesses sending multiple parcels daily. Special rates and priority handling for bulk orders.",
            color: "cyan"
        },
        {
            icon: Shield,
            title: "Secure Warehousing",
            description: "Short-term storage facilities available at major hubs to keep your goods safe before transit or after arrival.",
            color: "violet"
        },
        {
            icon: MapPin,
            title: "Real-Time Tracking",
            description: "Stay updated with the location of your luggage. SMS updates and live status checks for peace of mind.",
            color: "rose"
        }
    ];

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
            <PublicNavbar />

            {/* Modal */}
            <EnquiryModal
                isOpen={isEnquiryModalOpen}
                onClose={() => setIsEnquiryModalOpen(false)}
            />
            <ComplaintModal
                isOpen={isComplaintModalOpen}
                onClose={() => setIsComplaintModalOpen(false)}
            />

            {/* Premium Header Section */}
            <section className="relative pt-32 pb-24 overflow-hidden bg-slate-950">
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                    <img
                        src="https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=2000"
                        alt="Background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl mx-auto"
                    >
                        <span className="inline-block px-4 py-1.5 bg-blue-500/10 backdrop-blur-md border border-blue-500/20 rounded-full text-blue-400 text-xs font-black tracking-widest uppercase mb-6">
                            Our Excellence
                        </span>
                        <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-8 tracking-tight">
                            Premium <span className="text-blue-600 italic">Logistics</span> <br /> Solutions
                        </h1>
                        <p className="text-xl text-slate-300 leading-relaxed">
                            Comprehensive logistics solutions tailored for individuals and businesses across Maharashtra,
                            ensuring speed, safety, and reliability at every step.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Services Grid Section */}
            <section className="py-24 px-6 bg-slate-50/50 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                <div className="container mx-auto relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                        {services.map((service, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1, duration: 0.6 }}
                                whileHover={{ y: -12 }}
                                className="group relative bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 hover:border-blue-100 transition-all duration-500 overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-${service.color}-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-[3] transition-transform duration-700`}></div>

                                <div className={`w-16 h-16 rounded-2xl bg-${service.color}-50 flex items-center justify-center mb-8 relative z-10 group-hover:bg-white group-hover:shadow-xl group-hover:shadow-${service.color}-500/10 transition-all duration-500`}>
                                    <service.icon className={`w-8 h-8 text-${service.color}-600`} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-4 relative z-10">
                                    {service.title}
                                </h3>
                                <p className="text-slate-600 leading-relaxed mb-8 relative z-10">
                                    {service.description}
                                </p>
                                <Link
                                    onClick={() => {
                                        if (service.title === "GST Compliant Billing") {
                                            setIsComplaintModalOpen(true);
                                        } else {
                                            setIsEnquiryModalOpen(true);
                                        }
                                    }}
                                    className="relative z-10 flex items-center text-blue-600 font-bold group-hover:translate-x-2 transition-transform duration-300 cursor-pointer"
                                >
                                    {service.title === "GST Compliant Billing" ? (
                                        <>Raise Complaint <ArrowRight className="ml-2 w-4 h-4" /></>
                                    ) : (
                                        <>Book Now <ArrowRight className="ml-2 w-4 h-4" /></>
                                    )}
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Exclusive Offer Section */}
            <section className="py-24 px-6 bg-white">
                <div className="container mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="relative rounded-[3rem] overflow-hidden bg-slate-900 shadow-2xl p-1 md:p-2"
                    >
                        <div className="relative rounded-[2.5rem] overflow-hidden py-16 px-8 md:px-16 flex flex-col lg:flex-row items-center gap-16 min-h-[500px]">
                            {/* Background Image */}
                            <div className="absolute inset-0">
                                <img
                                    src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2000"
                                    alt="Bus Background"
                                    className="w-full h-full object-cover opacity-70 scale-105 group-hover:scale-100 transition-transform duration-1000"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-900/40 to-transparent"></div>
                            </div>

                            <div className="relative z-10 flex-1 text-center lg:text-left">
                                <span className="inline-block px-4 py-1.5 bg-yellow-400 text-blue-900 rounded-full text-xs font-black tracking-widest uppercase mb-6 shadow-xl shadow-yellow-400/20">
                                    Strategic Partner
                                </span>
                                <h2 className="text-4xl md:text-6xl font-black text-white leading-tight mb-8">
                                    Travel Smart with <br />
                                    <span className="text-yellow-400">Online Go Bus</span>
                                </h2>
                                <p className="text-xl text-blue-100/80 mb-10 max-w-xl leading-relaxed">
                                    The most reliable bus booking platform. Premium comfort, on-time departures, and affordable rates across India. Join the future of travel.
                                </p>
                                <a
                                    href="https://onlinego.in"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-3 bg-yellow-400 text-blue-900 px-10 py-5 rounded-2xl font-black text-lg hover:bg-yellow-300 hover:scale-105 transition-all duration-300 group shadow-2xl shadow-yellow-400/20"
                                >
                                    Book Your Seat <Bus className="w-6 h-6 transform group-hover:rotate-12 transition-transform" />
                                </a>
                            </div>

                            <div className="relative z-10 flex-1 hidden lg:block">
                                <div className="relative">
                                    <img
                                        src="/assets/onlinego.png"
                                        alt="App Preview"
                                        className="rounded-3xl shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700 border-4 border-white/10"
                                    />
                                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-400 rounded-full flex items-center justify-center -rotate-12 shadow-2xl">
                                        <span className="text-blue-950 font-black text-center text-sm leading-tight uppercase tracking-tighter">
                                            Best <br /> Rates <br /> 100%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
            {/* Daily Parcel Services & Network - New Added Section */}
            <section className="py-24 bg-white relative">
                <div className="container mx-auto px-6">
                    {/* Header */}
                    <div className="text-center max-w-4xl mx-auto mb-20">
                        <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-900 rounded-full text-xs font-black tracking-widest uppercase mb-6">
                            Network Coverage
                        </span>
                        <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight mb-6">
                            Our Daily Bus <span className="text-blue-600 italic">Parcel Services</span>
                        </h2>
                        <p className="text-3xl text-slate-500 font-bold uppercase tracking-widest mb-4">
                            Super Fast Delivery • 
                        </p>
                        <p className="text-lg md:text-xl font-bold text-slate-600">
                            For Daily route information visit : <a href="https://www.onlinego.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline decoration-2 underline-offset-4 decoration-blue-200 hover:decoration-blue-600 transition-all">www.onlinego.in</a>
                        </p>
                    </div>

                    {/* Routes Grid */}
                    <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-16 flex justify-center">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-16 gap-y-8 w-fit">
                            {/* Column 1 */}
                            <ul className="space-y-4">
                                {['Ahmedabad', 'Washim', 'Pusad', 'Mehkar', 'Akola', 'Parali', 'Beed', 'Sonpeth', 'Solapur'].map((city, i) => (
                                    <li key={i} className="flex items-center gap-3 group cursor-default">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:scale-125 transition-transform"></span>
                                        <span className="text-sm md:text-base font-bold text-slate-600 group-hover:text-blue-600 transition-colors uppercase tracking-wider font-['Inter']">{city}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Column 2 */}
                            <ul className="space-y-4">
                                {['Nashik', 'Latur', 'Jalna', 'Risod', 'Digras', 'Amravati', 'Akot', 'G.Khed', 'Humanabad'].map((city, i) => (
                                    <li key={i} className="flex items-center gap-3 group cursor-default">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:scale-125 transition-transform"></span>
                                        <span className="text-sm md:text-base font-bold text-slate-600 group-hover:text-blue-600 transition-colors uppercase tracking-wider font-['Inter']">{city}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Column 3 */}
                            <ul className="space-y-4">
                                {['Majalgaon', 'Shahagad', 'Akkalkot', 'Shirdi', 'Udagir', 'Jintur', 'Hingoli', 'Arani', 'Bidar'].map((city, i) => (
                                    <li key={i} className="flex items-center gap-3 group cursor-default">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:scale-125 transition-transform"></span>
                                        <span className="text-sm md:text-base font-bold text-slate-600 group-hover:text-blue-600 transition-colors uppercase tracking-wider font-['Inter']">{city}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Column 4 */}
                            <ul className="space-y-4">
                                {['Nagpur', 'Daryapur', 'Nanded', 'Gevrai', 'Ambad', 'Gulbarga', 'Surat', 'Devoni', 'Hyderabad'].map((city, i) => (
                                    <li key={i} className="flex items-center gap-3 group cursor-default">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:scale-125 transition-transform"></span>
                                        <span className="text-sm md:text-base font-bold text-slate-600 group-hover:text-blue-600 transition-colors uppercase tracking-wider font-['Inter']">{city}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Contact Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Pune Office */}
                        <div className="bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <MapPin className="w-24 h-24" />
                            </div>
                            <h3 className="text-2xl font-black mb-1">PUNE HUB</h3>
                            <p className="text-white/50 font-bold text-xs tracking-widest uppercase mb-6">Sangamwadi</p>
                            <p className="text-lg text-slate-300 leading-relaxed mb-6">
                                Sangamwadi parking 3,<br /> Sangamwadi, Pune
                            </p>
                            <a href="tel:+919766649757" className="inline-flex items-center gap-2 text-blue-400 font-black text-xl hover:text-white transition-colors">
                                +91 97666 49757 <ArrowRight className="w-5 h-5" />
                            </a>
                        </div>

                        {/* Bhosari Office */}
                        <div className="bg-blue-600 text-white p-8 rounded-3xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <MapPin className="w-24 h-24" />
                            </div>
                            <h3 className="text-2xl font-black mb-1">BHOSARI HUB</h3>
                            <p className="text-blue-200 font-bold text-xs tracking-widest uppercase mb-6">PMT Chowk</p>
                            <p className="text-lg text-blue-100 leading-relaxed mb-6">
                                Pmt Chowk,<br /> Bhosari
                            </p>
                            <a href="tel:+919172911722" className="inline-flex items-center gap-2 text-white font-black text-xl hover:translate-x-1 transition-transform">
                                +91 9209061234 <ArrowRight className="w-5 h-5" />
                            </a>
                        </div>

                        {/* Logistics Store */}
                        <div className="bg-slate-100 text-slate-900 p-8 rounded-3xl relative overflow-hidden group hover:bg-slate-200 transition-colors">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Package className="w-24 h-24" />
                            </div>
                            <h3 className="text-2xl font-black mb-1">LOGISTICS STORE</h3>
                            <p className="text-slate-500 font-bold text-xs tracking-widest uppercase mb-6">Godown</p>
                            <p className="text-lg text-slate-600 leading-relaxed mb-6">
                                Our Logistics Store,<br /> Talawade
                            </p>
                            <span className="inline-flex items-center gap-2 text-slate-900 font-black text-xl">
                                Central Hub
                            </span>
                        </div>
                    </div>
                </div>
            </section>
            {/* Ready to Ship Section */}
            <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent"></div>

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="max-w-2xl mx-auto"
                    >
                        <h2 className="text-4xl md:text-6xl font-black leading-tight mb-8">
                            Ready to <span className="text-blue-500 italic uppercase">Transform</span> <br /> Your Logistics?
                        </h2>
                        <p className="text-slate-400 text-lg mb-12">
                            Join hundreds of satisfied transport offices who trust OnlineGo to manage their end-to-end logistics every single day.
                        </p>
                        <div className="flex flex-wrap justify-center gap-6">
                            <Link to="/login" className="px-10 py-5 bg-white text-slate-950 rounded-2xl font-black hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-xl flex items-center gap-3 group">
                                Start Shipping Today <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>



            <Footer />
        </div>
    );
};

export default Services;
