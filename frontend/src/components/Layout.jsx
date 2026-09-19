import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  BarChart3,
  Building2,
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquareWarning,
  PackageCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Smartphone,
  UserCircle,
  Users,
  X,
} from "lucide-react";

const getNavLinks = (role) => {
  const common = [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }];

  switch (role) {
    case "admin":
      return [
        ...common,
        { to: "/users", label: "Branches & Users", icon: Users },
        { to: "/credit-offices", label: "Offices", icon: Building2 },
        { to: "/add-record", label: "New Entry", icon: FilePlus2 },
        { to: "/reports", label: "Reports", icon: BarChart3 },
        { to: "/complaints", label: "Complaints", icon: MessageSquareWarning },
        { to: "/agent-parcel-requests", label: "Parcels Requests", icon: PackageCheck },
        { to: "/branch/mobile-users", label: "Mobile Users", icon: Smartphone },
        { to: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
      ];
    case "branch":
      return [
        ...common,
        { to: "/add-record", label: "New Entry", icon: FilePlus2 },
        { to: "/agent-parcel-requests", label: "Parcels Requests", icon: PackageCheck },
        { to: "/complaints", label: "Complaints", icon: MessageSquareWarning },
        { to: "/reports", label: "Reports", icon: BarChart3 },
        { to: "/branch/mobile-shipments", label: "Mobile Shipments", icon: Smartphone },
      ];
    case "user":
      return [
        ...common,
        { to: "/new-entry", label: "New Entry", icon: FilePlus2 },
        { to: "/parcel-requests", label: "Parcels", icon: ClipboardList },
      ];
    // Agent Panel navigation - Commented out
    /*
    case "agent":
      return [
        { to: "/agent/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/agent/complaints", label: "Complaints", icon: MessageSquareWarning },
      ];
    */
    default:
      return common;
  }
};

const getRoleLabel = (role) => {
  switch (role) {
    case "admin":
      return "Admin Panel";
    case "branch":
      return "Branch Panel";
    case "user":
      return "Staff Panel";
    // Agent Panel role label - Commented out
    /*
    case "agent":
      return "Agent Panel";
    */
    default:
      return "Dashboard";
  }
};

const isPathActive = (pathname, linkPath) => {
  if (linkPath === "/dashboard" /* || linkPath === "/agent/dashboard" */) {
    return pathname === linkPath;
  }

  return pathname === linkPath || pathname.startsWith(`${linkPath}/`);
};

const Brand = ({ panelHome = "/dashboard" }) => (
  <Link to={panelHome} className="flex items-center gap-3 group relative shrink-0">
    <div className="absolute -inset-2 bg-cyan-500/20 rounded-lg blur opacity-70 group-hover:opacity-100 transition duration-500" />
    <div className="relative bg-white p-1.5 rounded-xl border border-white/10 shadow-xl group-hover:scale-105 transition-all duration-300">
      <img src="/assets/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
    </div>
    <div className="relative flex flex-col min-w-0">
      <span className="text-lg font-black tracking-tight text-white leading-none">
        ONLINE <span className="text-cyan-300">GO</span>
      </span>
    </div>
  </Link>
);

const UserPill = ({ user, stacked = false }) => (
  <div
    className={`bg-white/5 backdrop-blur-sm border border-white/10 flex items-center gap-2 ${
      stacked ? "rounded-xl px-3 py-3" : "rounded-full px-3 py-1.5"
    }`}
  >
    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
    <span className="text-gray-300 text-xs font-medium min-w-0">
      <span className="text-white font-semibold truncate block">{user?.name}</span>
      <span className="text-gray-500 text-[10px] uppercase">{user?.role}</span>
    </span>
  </div>
);

const SidebarNav = ({ navLinks, pathname, onNavigate, isCollapsed = false }) => (
  <div className="flex flex-col gap-1">
    {navLinks.map((link) => {
      const Icon = link.icon;
      const active = isPathActive(pathname, link.to);

      return (
        <Link
          key={link.to}
          to={link.to}
          onClick={onNavigate}
          title={isCollapsed ? link.label : undefined}
          className={`flex items-center rounded-lg text-sm font-medium transition-colors ${
            isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
          } ${
            active
              ? "bg-cyan-400/15 text-cyan-100 ring-1 ring-cyan-300/20"
              : "text-gray-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span className="truncate">{link.label}</span>}
        </Link>
      );
    })}

    <Link
      to="/profile"
      onClick={onNavigate}
      title={isCollapsed ? "Profile" : undefined}
      className={`flex items-center rounded-lg text-sm font-medium transition-colors ${
        isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
      } ${
        isPathActive(pathname, "/profile")
          ? "bg-cyan-400/15 text-cyan-100 ring-1 ring-cyan-300/20"
          : "text-cyan-300 hover:bg-cyan-400/10 hover:text-cyan-100"
      }`}
    >
      <UserCircle className="h-4 w-4 shrink-0" />
      {!isCollapsed && <span className="truncate">Profile</span>}
    </Link>
  </div>
);

const PanelSidebar = ({
  user,
  navLinks,
  pathname,
  logout,
  onNavigate,
  isCollapsed = false,
  onToggleCollapse,
}) => (
  <aside className="flex h-full flex-col bg-slate-950 text-white transition-all duration-300">
    <div
      className={`border-b border-white/10 py-4 flex items-center ${
        isCollapsed ? "flex-col gap-3 px-2" : "justify-between px-4"
      }`}
    >
      {!isCollapsed ? (
        <>
          <div className="min-w-0 flex-1">
            <Brand />
            <p className="mt-2 text-[0.65rem] font-medium uppercase tracking-widest text-gray-400">
              {getRoleLabel(user?.role)}
            </p>
          </div>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Close sidebar"
              className="hidden lg:flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition shrink-0"
              aria-label="Close sidebar"
            >
              <PanelLeftClose size={19} />
            </button>
          )}
        </>
      ) : (
        <>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Open sidebar"
              className="hidden lg:flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
              aria-label="Open sidebar"
            >
              <PanelLeftOpen size={20} />
            </button>
          )}
          <Link
            to="/dashboard"
            className="bg-white p-1.5 rounded-xl border border-white/10 shadow hover:scale-105 transition"
            title="Online Go Logistics"
          >
            <img src="/assets/logo.png" alt="Logo" className="h-7 w-7 object-contain" />
          </Link>
        </>
      )}
    </div>

    <div className={isCollapsed ? "px-2 py-3" : "px-4 py-4"}>
      {isCollapsed ? (
        <div
          className="mx-auto w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative cursor-default"
          title={`${user?.name} (${user?.role})`}
        >
          <div className="w-2 h-2 rounded-full bg-green-500 absolute top-1.5 right-1.5" />
          <span className="text-white font-bold text-sm">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </span>
        </div>
      ) : (
        <UserPill user={user} stacked />
      )}
    </div>

    <nav className={`flex-1 overflow-y-auto ${isCollapsed ? "px-2 pb-3" : "px-4 pb-4"}`}>
      <SidebarNav
        navLinks={navLinks}
        pathname={pathname}
        onNavigate={onNavigate}
        isCollapsed={isCollapsed}
      />
    </nav>

    <div className={`border-t border-white/10 ${isCollapsed ? "p-2" : "p-4"}`}>
      <button
        onClick={logout}
        title={isCollapsed ? "Logout" : undefined}
        className={`flex w-full items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20 ${
          isCollapsed ? "p-2.5" : "gap-2 px-3 py-2.5"
        }`}
      >
        <LogOut className="h-4 w-4 shrink-0" />
        {!isCollapsed && <span>Logout</span>}
      </button>
    </div>
  </aside>
);

const TopNavLayout = ({ user, navLinks, logout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-white/10 shadow-lg print:hidden">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          {/* panelHome={user?.role === "agent" ? "/agent/dashboard" : "/dashboard"} */}
          <Brand panelHome="/dashboard" />

          <div className="hidden xl:flex items-center gap-3 flex-1 justify-end">
            <UserPill user={user} />

            <div className="flex items-center gap-0.5 bg-white/5 rounded-full px-1 py-1 border border-white/10">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}

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

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="xl:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="xl:hidden bg-slate-900 border-b border-white/10 p-4 absolute top-full left-0 right-0 shadow-2xl">
            <div className="flex flex-col gap-3">
              <UserPill user={user} stacked />

              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}

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

const Layout = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });
  const location = useLocation();
  const navLinks = getNavLinks(user?.role);
  const useSidebar = user?.role === "admin" || user?.role === "branch";

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar_collapsed", String(next));
      return next;
    });
  };

  if (!useSidebar) {
    return <TopNavLayout user={user} navLinks={navLinks} logout={logout} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <div
        className={`hidden lg:sticky lg:top-0 lg:block lg:h-screen lg:shrink-0 print:hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? "lg:w-20" : "lg:w-72"
        }`}
      >
        <PanelSidebar
          user={user}
          navLinks={navLinks}
          pathname={location.pathname}
          logout={logout}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />
      </div>

      <header className="sticky top-0 z-40 bg-slate-950 border-b border-white/10 px-4 py-3 shadow-lg lg:hidden print:hidden">
        <div className="flex items-center justify-between">
          <Brand />
          <button
            onClick={() => setIsMenuOpen(true)}
            className="rounded-lg p-2 text-white transition-colors hover:bg-white/10"
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden">
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/70"
            aria-label="Close sidebar overlay"
          />
          <div className="relative h-full w-[82vw] max-w-80 shadow-2xl">
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-lg p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close sidebar"
            >
              <X size={22} />
            </button>
            <PanelSidebar
              user={user}
              navLinks={navLinks}
              pathname={location.pathname}
              logout={logout}
              onNavigate={() => setIsMenuOpen(false)}
            />
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 p-4 md:p-6 print:p-0">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
