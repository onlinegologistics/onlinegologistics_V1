import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X, LogOut } from "lucide-react";

const Layout = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-white/10 shadow-lg print:hidden">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 group relative shrink-0">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg blur opacity-25 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative bg-white p-1 rounded-xl border border-white/10 shadow-xl group-hover:scale-105 transition-all duration-300">
              <img src="/assets/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
            </div>
            <div className="relative flex flex-col">
              <span className="text-lg font-black tracking-tight text-white leading-none">
                ONLINE <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">GO</span>
              </span>
              <span className="text-[0.55rem] font-medium text-gray-400 tracking-widest uppercase">Admin Dashboard</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center gap-3 flex-1 justify-end">

            <div className="bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shrink-0">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-gray-300 text-xs font-medium">
                <span className="text-white font-semibold">{user?.name}</span>
              </span>
            </div>

            <div className="flex items-center gap-0.5 bg-white/5 rounded-full px-1 py-1 border border-white/10">
              {[
                { to: "/dashboard", label: "Dashboard" },
                { to: "/new-entry", label: "New Entry" },
                { to: "/complaints", label: "Complaints" },
                { to: "/enquiries", label: "Enquiries" },
                { to: "/credit-offices", label: "Offices" },
                { to: "/customers", label: "Customers" },
                { to: "/parcel-requests", label: "Parcels" },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}

              {user?.role === "admin" && (
                <Link
                  to="/users"
                  className="px-3 py-1.5 rounded-full text-xs font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 transition-all duration-300 whitespace-nowrap"
                >
                  Users
                </Link>
              )}

              <Link
                to="/profile"
                className="px-3 py-1.5 rounded-full text-xs font-medium text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 transition-all duration-300 whitespace-nowrap"
              >
                Profile
              </Link>
            </div>

            <button
              onClick={logout}
              className="shrink-0 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="xl:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="xl:hidden bg-slate-900 border-b border-white/10 p-4 absolute top-full left-0 right-0 shadow-2xl">
            <div className="flex flex-col gap-3">
              <div className="bg-white/5 px-4 py-2 rounded-xl flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-gray-300 text-sm">Welcome, <span className="text-white font-semibold">{user?.name}</span></span>
              </div>

              <div className="flex flex-col gap-1">
                {[
                  { to: "/dashboard", label: "Dashboard" },
                  { to: "/new-entry", label: "New Entry" },
                  { to: "/complaints", label: "Complaints" },
                  { to: "/enquiries", label: "Enquiries" },
                  { to: "/credit-offices", label: "Offices" },
                  { to: "/customers", label: "Customers" },
                  { to: "/parcel-requests", label: "Parcel Requests" },
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}

                {user?.role === "admin" && (
                  <Link
                    to="/users"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-2.5 rounded-lg text-sm font-bold text-amber-400 hover:bg-amber-400/10 transition-colors"
                  >
                    Manage Users
                  </Link>
                )}

                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-cyan-400 hover:bg-cyan-400/10 transition-colors"
                >
                  My Profile
                </Link>
              </div>

              <button
                onClick={logout}
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow bg-gray-50 container mx-auto p-4 print:p-0 print:m-0 print:w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;