import React, { useState } from "react";
import PublicNavbar from "../components/PublicNavbar";
import { Link } from "react-router-dom";
import ComplaintModal from "../components/ComplaintModal";
import EnquiryModal from "../components/EnquiryModal";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "../components/Footer";
import {
    MapPin,
    Package,
    Headphones,
    ShieldCheck,
    ArrowRight,
    CheckCircle2,
    BadgeCheck,
    Zap,
    FileText,
    Globe,
    BarChart3,
} from "lucide-react";

// Swiper Imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";

// Swiper Styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

const Home = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <PublicNavbar />
            <ComplaintModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
            <EnquiryModal
                isOpen={isEnquiryModalOpen}
                onClose={() => setIsEnquiryModalOpen(false)}
            />

            {/* Swiper Hero Section */}
            <header className="relative h-screen min-h-[600px] md:min-h-[750px] w-full overflow-hidden bg-slate-900">
                <Swiper
                    modules={[Autoplay, Pagination, EffectFade]}
                    effect="fade"
                    fadeEffect={{ crossFade: true }}
                    speed={1000}
                    autoplay={{
                        delay: 5000,
                        disableOnInteraction: false,
                    }}
                    pagination={{ clickable: true, dynamicBullets: true }}
                    className="h-full w-full"
                >
                    {[
                        {
                            type: "video",
                            src: "/Seamless.mp4",
                            badge: "Next-Gen Logistics",
                            title: (
                                <>
                                    Seamless <span className="text-blue-500">Logistics</span>{" "}
                                    <br className="hidden md:block" /> For Your Business
                                </>
                            ),
                            desc: "The ultimate solution for transport offices. Manage billing, track shipments across Maharashtra, and generate GST-compliant receipts instantly.",
                            align: "left",
                        },
                        {
                            type: "image",
                            src: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000",
                            badge: "Real-time Tracking",
                            title: (
                                <>
                                    Efficient <span className="text-yellow-400">Shipment</span>{" "}
                                    <br className="hidden md:block" /> Tracking System
                                </>
                            ),
                            desc: "Monitor every parcel in real-time. Our advanced dashboard gives you full control over your transport operations across 50+ cities.",
                            align: "left",
                        },
                        {
                            type: "video",
                            src: "/datadriven.mp4",
                            badge: "Secure & Fast",
                            title: (
                                <>
                                    DATA DRIVEN <br />{" "}
                                    <span className="text-blue-500 italic">LOGISTICS</span>
                                </>
                            ),
                            desc: "Experience 100% secure and fast data management. Join hundreds of transport offices using OnlineGo to automate their daily logistics.",
                            align: "left",
                        },
                    ].map((slide, index) => (
                        <SwiperSlide key={index}>
                            {/* SwiperSlide adds 'swiper-slide-active' class which we can use or just rely on CSS */}
                            <div className="relative h-full w-full flex items-center overflow-hidden">
                                {slide.type === "video" ? (
                                    <video
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        className="absolute inset-0 w-full h-full object-cover"
                                        style={{ filter: "brightness(0.35)" }}
                                    >
                                        <source src={slide.src} type="video/mp4" />
                                    </video>
                                ) : (
                                    <img
                                        src={slide.src}
                                        alt="Slide Background"
                                        className="absolute inset-0 w-full h-full object-cover"
                                        style={{ filter: "brightness(0.3)" }}
                                    />
                                )}

                                <div className="container mx-auto px-6 md:px-12 relative z-10 transition-opacity duration-700">
                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8, delay: 0.2 }}
                                        className={`max-w-4xl ${slide.align === "center" ? "mx-auto text-center" : "text-left"}`}
                                    >
                                        {slide.badge && (
                                            <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-xs md:text-sm font-bold tracking-widest uppercase mb-6">
                                                {slide.badge}
                                            </span>
                                        )}
                                        <h1 className="text-3xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-4 md:mb-6 tracking-tight">
                                            {slide.title}
                                        </h1>
                                        <p
                                            className={`text-base md:text-xl text-gray-300 mb-8 md:mb-10 max-w-2xl leading-relaxed ${slide.align === "center" ? "mx-auto" : ""}`}
                                        >
                                            {slide.desc}
                                        </p>
                                        <div
                                            className={`flex flex-wrap gap-4 ${slide.align === "center" ? "justify-center" : ""}`}
                                        >
                                            <Link
                                                to="/services"
                                                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg text-center min-w-[160px]"
                                            >
                                                Explore Services
                                            </Link>
                                            <button
                                                onClick={() => setIsModalOpen(true)}
                                                className="px-8 py-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition shadow-lg text-center min-w-[160px]"
                                            >
                                                Raise Complaint
                                            </button>
                                            <button
                                                onClick={() => setIsEnquiryModalOpen(true)}
                                                className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl font-bold hover:bg-white/20 transition text-center min-w-[160px]"
                                            >
                                                Enquiry
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </header>

            {/* Premium Stats Section */}
            <section className="relative z-20 -mt-10 md:-mt-20 px-4 md:px-6">
                <div className="container mx-auto">
                    <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] md:rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white p-6 md:p-12">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 divide-y sm:divide-y-0 lg:divide-x divide-gray-100">
                            {[
                                {
                                    icon: MapPin,
                                    label: "Cities Covered",
                                    value: "50+",
                                    color: "blue",
                                },
                                {
                                    icon: Package,
                                    label: "Daily Parcels",
                                    value: "10k+",
                                    color: "indigo",
                                },
                                {
                                    icon: Headphones,
                                    label: "Expert Support",
                                    value: "24/7",
                                    color: "cyan",
                                },
                                {
                                    icon: ShieldCheck,
                                    label: "Secure Logistics",
                                    value: "100%",
                                    color: "emerald",
                                },
                            ].map((stat, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1, duration: 0.8 }}
                                    viewport={{ once: true }}
                                    className={`flex flex-col items-center lg:items-start px-4 md:px-8 first:pl-0 last:pr-0 ${idx > 0 ? "pt-8 sm:pt-0" : ""}`}
                                >
                                    <div
                                        className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                                    >
                                        <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                                            {stat.value}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[0.7rem] mt-2">
                                        {stat.label}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Premium Features Section */}
            <section className="py-32 px-6 relative overflow-hidden bg-slate-50/50">
                {/* Subtle Background Pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                    }}
                ></div>

                <div className="container mx-auto relative z-10">
                    <div className="max-w-3xl mx-auto text-center mb-24">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black tracking-widest uppercase mb-6"
                        >
                            Why Choose OnlineGo
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-8"
                        >
                            Built for Efficiency & <br className="hidden md:block" />
                            <span className="text-blue-600 italic">Reliability</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg md:text-xl text-slate-600 leading-relaxed"
                        >
                            Our platform is designed to handle the complexities of modern
                            logistics with ease, ensuring your data is always accurate,
                            secure, and accessible 24/7.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                        {[
                            {
                                icon: FileText,
                                title: "Instant GST Billing",
                                desc: "Generate professional, GST-compliant invoices and receipts in seconds. Automatic calculations for CGST, SGST, and IGST.",
                                color: "blue",
                                delay: 0.1,
                            },
                            {
                                icon: Globe,
                                title: "Network Coverage",
                                desc: "Seamlessly manage shipments across major hubs like Pune, Mumbai, Nagpur, and 50+ other stations in Maharashtra.",
                                color: "indigo",
                                delay: 0.2,
                            },
                            {
                                icon: BarChart3,
                                title: "Real-time Reporting",
                                desc: "Track your business performance with comprehensive dashboards. Monitor daily revenue, paid vs. credit entries, and more.",
                                color: "emerald",
                                delay: 0.3,
                            },
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: feature.delay, duration: 0.6 }}
                                whileHover={{ y: -12 }}
                                className="group relative bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 hover:border-blue-100 transition-all duration-500 overflow-hidden"
                            >
                                {/* Card Hover Highlight */}
                                <div
                                    className={`absolute top-0 right-0 w-32 h-32 bg-${feature.color}-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-[3] transition-transform duration-700`}
                                ></div>

                                <div
                                    className={`w-16 h-16 rounded-2xl bg-${feature.color}-50 flex items-center justify-center mb-8 relative z-10 group-hover:bg-white group-hover:shadow-xl group-hover:shadow-blue-500/10 transition-all duration-500`}
                                >
                                    <feature.icon
                                        className={`w-8 h-8 text-${feature.color}-600`}
                                    />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-4 relative z-10 transition-colors duration-300">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-600 leading-relaxed relative z-10 group-hover:text-slate-700 transition-colors">
                                    {feature.desc}
                                </p>

                                <div className="mt-8 relative z-10 flex items-center text-blue-600 font-bold group-hover:translate-x-2 transition-transform duration-300 cursor-pointer">
                                    Learn More <ArrowRight className="ml-2 w-4 h-4" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Partners Section */}
            <section className="py-24 bg-white border-y border-gray-100 overflow-hidden">
                <div className="container mx-auto px-6 mb-12 text-center">
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="text-blue-600 font-black uppercase tracking-[0.3em] text-[0.65rem] mb-4"
                    >
                        Trusted by Industry Leaders
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-3xl font-black text-slate-900"
                    >
                        Our Strategic <span className="text-blue-600">Partners</span>
                    </motion.h2>
                </div>

                <div className="flex overflow-hidden group">
                    <div className="flex animate-marquee whitespace-nowrap gap-12 py-4">
                        {[
                            "https://logo.clearbit.com/fedex.com",
                            "https://logo.clearbit.com/dhl.com",
                            "https://logo.clearbit.com/ups.com",
                            "https://logo.clearbit.com/maersk.com",
                            "https://logo.clearbit.com/blue-dart.com",
                            "https://logo.clearbit.com/delhivery.com"
                        ].concat([
                            "https://logo.clearbit.com/fedex.com",
                            "https://logo.clearbit.com/dhl.com",
                            "https://logo.clearbit.com/ups.com",
                            "https://logo.clearbit.com/maersk.com",
                            "https://logo.clearbit.com/blue-dart.com",
                            "https://logo.clearbit.com/delhivery.com"
                        ]).map((logo, idx) => (
                            <div key={idx} className="flex items-center justify-center min-w-[150px] px-8 py-4 bg-slate-50 rounded-2xl grayscale opacity-50 hover:grayscale-0 hover:opacity-100 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 cursor-pointer">
                                <img
                                    src={logo}
                                    alt="Partner Logo"
                                    className="h-10 w-auto object-contain"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes marquee {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .animate-marquee {
                        animation: marquee 30s linear infinite;
                    }
                    .animate-marquee:hover {
                        animation-play-state: paused;
                    }
                `}} />
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default Home;
