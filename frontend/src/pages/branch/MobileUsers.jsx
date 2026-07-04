import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  Users,
  Smartphone,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Download,
  Printer,
  Search,
  X,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Filter,
  Phone,
  Send,
  Trash2,
  Edit3,
} from "lucide-react";

const MobileUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const config = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${user?.token}` },
    }),
    [user?.token],
  );

  // Data states
  const [users, setUsers] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active tab: 'users' | 'shipments' | 'enquiries' | 'complaints'
  const [activeTab, setActiveTab] = useState("users");

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [transportFilter, setTransportFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

    // Modal state for Enquiry & Complaint Response
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("enquiry"); // 'enquiry' | 'complaint'
  const [selectedItem, setSelectedItem] = useState(null);
  const [adminResponseText, setAdminResponseText] = useState("");
  const [itemStatus, setItemStatus] = useState("Open");


    // Edit & Delete Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editType, setEditType] = useState("");
  
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, type: null });
  
  // Handle Delete (Triggers Custom Modal)
  const handleDelete = (id, type) => {
    setDeleteConfirm({ isOpen: true, id, type });
  };
  
  const confirmDeleteAction = async () => {
    const { id, type } = deleteConfirm;
    try {
      let endpoint = '';
      if (type === 'user') endpoint = `/api/mobile-users/${id}`;
      else if (type === 'shipment') endpoint = `/api/mobile-users/shipments/${id}`;
      else if (type === 'enquiry') endpoint = `/api/mobile-user-enquiries/${id}`;
      else if (type === 'complaint') endpoint = `/api/mobile-user-complaints/${id}`;
      
      await axios.delete(endpoint, config);
      
      if (type === 'user') {
        setUsers(prev => prev.filter(u => u._id !== id));
      } else if (type === 'shipment') {
        setUsers(prev => prev.map(u => u.latestShipment && (u.latestShipment.trackingId === id || u.latestShipment.lrNumber === id) ? {...u, latestShipment: null} : u));
      } else if (type === 'enquiry') {
        setEnquiries(prev => prev.filter(e => e._id !== id));
      } else if (type === 'complaint') {
        setComplaints(prev => prev.filter(c => c._id !== id));
      }
      toast.success(`${type} deleted successfully`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to delete ${type}`);
    } finally {
      setDeleteConfirm({ isOpen: false, id: null, type: null });
    }
  };

  // Handle Edit Open
  const openEditModal = (item, type) => {
    setEditItem({ ...item });
    setEditType(type);
    setIsEditModalOpen(true);
  };

  // Handle Edit Save
  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      let endpoint = '';
      if (editType === 'user') endpoint = `/api/mobile-users/${editItem._id}`;
      else if (editType === 'shipment') endpoint = `/api/mobile-users/shipments/${editItem.trackingId || editItem._id}`;
      else if (editType === 'enquiry') endpoint = `/api/mobile-user-enquiries/${editItem._id}`;
      else if (editType === 'complaint') endpoint = `/api/mobile-user-complaints/${editItem._id}`;
      
      const { data } = await axios.put(endpoint, editItem, config);
      
      if (editType === 'user') {
        setUsers(prev => prev.map(u => u._id === editItem._id ? { ...u, ...data } : u));
      } else if (editType === 'shipment') {
        setUsers(prev => prev.map(u => u.latestShipment && (u.latestShipment.trackingId === (editItem.trackingId || editItem._id) || u.latestShipment.lrNumber === (editItem.trackingId || editItem._id)) ? {...u, latestShipment: {...u.latestShipment, ...data}} : u));
      } else if (editType === 'enquiry') {
        setEnquiries(prev => prev.map(enq => enq._id === editItem._id ? { ...enq, ...data } : enq));
      } else if (editType === 'complaint') {
        setComplaints(prev => prev.map(c => c._id === editItem._id ? { ...c, ...data } : c));
      }
      
      toast.success(`${editType} updated successfully`);
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to update ${editType}`);
    }
  };

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, enquiriesRes, complaintsRes] = await Promise.all([
        axios.get("/api/mobile-users", config),
        axios.get("/api/mobile-user-enquiries", config),
        axios.get("/api/mobile-user-complaints", config),
      ]);
      setUsers(usersRes.data || []);
      setEnquiries(enquiriesRes.data?.enquiries || []);
      setComplaints(complaintsRes.data?.complaints || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchData();
    }
  }, [user?.token, config]);

  // Reset pagination when active tab or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeTab,
    searchTerm,
    statusFilter,
    transportFilter,
    dateFilter,
    priorityFilter,
  ]);

  // Derived statistics
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeShipments = users.filter(u => u.latestShipment).length;
    const openEnquiries = enquiries.filter(
      (e) => e.status === "Open" || e.status === "In Progress",
    ).length;
    const openComplaints = complaints.filter(
      (c) => c.status === "Open" || c.status === "In Progress",
    ).length;
    return { totalUsers, activeShipments, openEnquiries, openComplaints };
  }, [users, enquiries, complaints]);

  // Filter calculations
  const filteredData = useMemo(() => {
    if (activeTab === "users") {
      return users.filter((u) => {
        const matchesSearch =
          (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (u.mobile || "").includes(searchTerm);
        const matchesStatus =
          statusFilter === "" ||
          (statusFilter === "Active" && u.isActive) ||
          (statusFilter === "Blocked" && !u.isActive);
        return matchesSearch && matchesStatus;
      });
    } else if (activeTab === "shipments") {
      let allShipments = [];
      users.forEach((u) => {
        if (u.shipments && Array.isArray(u.shipments)) {
          allShipments.push(...u.shipments);
        } else if (u.latestShipment) {
          allShipments.push(u.latestShipment);
        }
      });
      const shipments = allShipments
        .filter(Boolean)
        // Only include shipments that have a valid deliveryAddress
        .filter(
          (s) =>
            s.deliveryAddress &&
            s.deliveryAddress.trim() !== "" &&
            s.deliveryAddress !== "N/A",
        );
      return shipments.filter((s) => {
        const matchesSearch =
          (s.customerName || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (s.lrNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.trackingId || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (s.pickupCity || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (s.deliveryCity || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === "" || s.currentShipmentStatus === statusFilter;
        const matchesTransport =
          transportFilter === "" || s.transportType === transportFilter;
        const matchesDate =
          dateFilter === "" ||
          (s.expectedDeliveryDate &&
            s.expectedDeliveryDate.substring(0, 10) === dateFilter);
        return (
          matchesSearch && matchesStatus && matchesTransport && matchesDate
        );
      });
    } else if (activeTab === "enquiries") {
      return enquiries.filter((e) => {
        const userName = e.user?.name || e.name || "";
        const matchesSearch =
          userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (e.mobile || "").includes(searchTerm) ||
          (e.subject || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (e.message || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "" || e.status === statusFilter;
        return matchesSearch && matchesStatus;
      });
    } else if (activeTab === "complaints") {
      return complaints.filter((c) => {
        const reporterName = c.user?.name || c.contactName || "";
        const matchesSearch =
          reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.contactMobile || "").includes(searchTerm) ||
          (c.receiptNo || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (c.subject || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.description || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "" || c.status === statusFilter;
        const matchesPriority =
          priorityFilter === "" || c.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
      });
    }
    return [];
  }, [
    activeTab,
    users,
    enquiries,
    complaints,
    searchTerm,
    statusFilter,
    transportFilter,
    dateFilter,
    priorityFilter,
  ]);

  // Paginated items
  const paginatedData = useMemo(() => {
    const offset = (currentPage - 1) * recordsPerPage;
    return filteredData.slice(offset, offset + recordsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / recordsPerPage) || 1;

  // Toggle User Active status
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const { data } = await axios.put(
        `/api/mobile-users/${userId}`,
        { isActive: !currentStatus },
        config,
      );
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isActive: data.isActive } : u,
        ),
      );
      toast.success(
        `User ${data.isActive ? "activated" : "blocked"} successfully`,
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update user status",
      );
    }
  };

  // Open Reply Modal for Enquiry or Complaint
  const openReplyModal = (item, type) => {
    setSelectedItem(item);
    setModalType(type);
    setAdminResponseText(item.adminResponse || "");
    setItemStatus(item.status || "Open");
    setIsModalOpen(true);
  };

  // Save Response
  const saveResponse = async () => {
    try {
      const endpoint =
        modalType === "enquiry"
          ? `/api/mobile-user-enquiries/${selectedItem._id}`
          : `/api/mobile-user-complaints/${selectedItem._id}`;

      const { data } = await axios.put(
        endpoint,
        {
          status: itemStatus,
          adminResponse: adminResponseText,
        },
        config,
      );

      if (modalType === "enquiry") {
        setEnquiries((prev) =>
          prev.map((e) =>
            e._id === selectedItem._id
              ? { ...e, status: data.status, adminResponse: data.adminResponse }
              : e,
          ),
        );
      } else {
        setComplaints((prev) =>
          prev.map((c) =>
            c._id === selectedItem._id
              ? { ...c, status: data.status, adminResponse: data.adminResponse }
              : c,
          ),
        );
      }

      toast.success("Response saved and sent successfully");
      setIsModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save response");
    }
  };

  // Open Detailed Shipment Page
  const openManageShipment = (shipment) => {
    navigate(`/branch/shipments/${shipment.trackingId || shipment._id}/manage`);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setTransportFilter("");
    setDateFilter("");
    setPriorityFilter("");
  };

  // Export CSV
  const exportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = `${activeTab}_report.csv`;

    if (activeTab === "users") {
      headers = [
        "Name",
        "Email",
        "Mobile",
        "Alt Mobile",
        "Address",
        "Joined Date",
        "Status",
      ];
      rows = filteredData.map((u) => [
        u.name,
        u.email || u.username || "N/A",
        u.mobile,
        u.altMobile || "N/A",
        u.address || "N/A",
        new Date(u.createdAt).toLocaleDateString(),
        u.isActive ? "Active" : "Blocked",
      ]);
    } else if (activeTab === "shipments") {
      headers = [
        "Tracking ID",
        "LR Number",
        "Customer Name",
        "Mobile",
        "Pickup City",
        "Delivery City",
        "Type",
        "Status",
      ];
      rows = filteredData.map((s) => [
        s.trackingId,
        s.lrNumber,
        s.customerName,
        s.mobileNumber,
        s.pickupCity,
        s.deliveryCity,
        s.parcelType,
        s.currentShipmentStatus,
      ]);
    } else if (activeTab === "enquiries") {
      headers = [
        "Customer Name",
        "Mobile",
        "Type",
        "Subject",
        "Message",
        "Response",
        "Date",
        "Status",
      ];
      rows = filteredData.map((e) => [
        e.user?.name || e.name,
        e.mobile,
        e.enquiryType || "General",
        e.subject || "N/A",
        e.message,
        e.adminResponse || "N/A",
        new Date(e.createdAt).toLocaleDateString(),
        e.status,
      ]);
    } else if (activeTab === "complaints") {
      headers = [
        "Receipt No",
        "Reporter Name",
        "Mobile",
        "Subject",
        "Description",
        "Priority",
        "Response",
        "Date",
        "Status",
      ];
      rows = filteredData.map((c) => [
        c.receiptNo,
        c.user?.name || c.contactName,
        c.contactMobile,
        c.subject,
        c.description,
        c.priority,
        c.adminResponse || "N/A",
        new Date(c.createdAt).toLocaleDateString(),
        c.status,
      ]);
    }

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...rows.map((e) =>
          e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 bg-slate-50/50 p-4 sm:p-6 rounded-3xl min-h-screen">
      <Toaster position="top-right" />

      {/* Header - Hidden in Print */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Mobile Users Hub
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Directory & operations dashboard for mobile users, shipments,
            enquiries, and complaints
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchData}
            className="bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-semibold p-2.5 rounded-xl border border-slate-200/80 shadow-sm transition duration-200 flex items-center gap-2"
            title="Refresh Data"
          >
            <RefreshCw
              size={18}
              className={
                loading ? "animate-spin text-purple-600" : "text-slate-500"
              }
            />
          </button>
          <button
            onClick={exportCSV}
            className="bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-semibold px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-sm transition duration-200 flex items-center gap-2 text-sm"
          >
            <Download size={16} className="text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={printReport}
            className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition duration-200 flex items-center gap-2 text-sm"
          >
            <Printer size={16} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards - Premium gradient cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {/* Total Mobile Users */}
        <div className="relative overflow-hidden rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-default bg-gradient-to-br from-violet-600 to-purple-700 text-white">
          <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-white/10 blur-lg" />
          <div className="absolute bottom-0 right-0 w-20 h-10 rounded-tl-full bg-black/10" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/15 backdrop-blur-sm p-2 rounded-lg border border-white/20">
                <Users size={16} className="text-white" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest bg-white/15 text-white/90 px-2 py-0.5 rounded-full border border-white/20">
                REGISTERED
              </span>
            </div>
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
              Total Mobile Users
            </p>
            <h3 className="text-2xl font-black mt-0.5 leading-none text-white">
              {stats.totalUsers}
            </h3>
            <div className="mt-3 h-0.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/60 rounded-full"
                style={{ width: "100%" }}
              />
            </div>
            <p className="text-white/50 text-[9px] font-semibold mt-1">
              All registered customers
            </p>
          </div>
        </div>

        {/* Active Shipments */}
        <div className="relative overflow-hidden rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-default bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-white/10 blur-lg" />
          <div className="absolute bottom-0 right-0 w-20 h-10 rounded-tl-full bg-black/10" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/15 backdrop-blur-sm p-2 rounded-lg border border-white/20">
                <TrendingUp size={16} className="text-white" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest bg-white/15 text-white/90 px-2 py-0.5 rounded-full border border-white/20">
                ACTIVE
              </span>
            </div>
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
              Active Shipments
            </p>
            <h3 className="text-2xl font-black mt-0.5 leading-none text-white">
              {stats.activeShipments}
            </h3>
            <div className="mt-3 h-0.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/60 rounded-full"
                style={{
                  width:
                    stats.totalUsers > 0
                      ? `${Math.min((stats.activeShipments / stats.totalUsers) * 100, 100)}%`
                      : "0%",
                }}
              />
            </div>
            <p className="text-white/50 text-[9px] font-semibold mt-1">
              Orders in pipeline
            </p>
          </div>
        </div>

        {/* Open Enquiries */}
        <div className="relative overflow-hidden rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-default bg-gradient-to-br from-sky-500 to-blue-600 text-white">
          <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-white/10 blur-lg" />
          <div className="absolute bottom-0 right-0 w-20 h-10 rounded-tl-full bg-black/10" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/15 backdrop-blur-sm p-2 rounded-lg border border-white/20">
                <MessageSquare size={16} className="text-white" />
              </div>
              <span
                className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${stats.openEnquiries > 0 ? "bg-amber-400/30 text-amber-100 border-amber-300/30 animate-pulse" : "bg-white/15 text-white/90 border-white/20"}`}
              >
                {stats.openEnquiries > 0 ? "PENDING" : "ALL CLEAR"}
              </span>
            </div>
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
              Open Enquiries
            </p>
            <h3 className="text-2xl font-black mt-0.5 leading-none text-white">
              {stats.openEnquiries}
            </h3>
            <div className="mt-3 h-0.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-300/80 rounded-full transition-all duration-700"
                style={{
                  width:
                    enquiries.length > 0
                      ? `${Math.min((stats.openEnquiries / enquiries.length) * 100, 100)}%`
                      : "0%",
                }}
              />
            </div>
            <p className="text-white/50 text-[9px] font-semibold mt-1">
              {enquiries.length} total enquiries
            </p>
          </div>
        </div>

        {/* Open Complaints */}
        <div className="relative overflow-hidden rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-default bg-gradient-to-br from-rose-500 to-red-600 text-white">
          <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-white/10 blur-lg" />
          <div className="absolute bottom-0 right-0 w-20 h-10 rounded-tl-full bg-black/10" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/15 backdrop-blur-sm p-2 rounded-lg border border-white/20">
                <AlertCircle size={16} className="text-white" />
              </div>
              <span
                className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${stats.openComplaints > 0 ? "bg-amber-400/30 text-amber-100 border-amber-300/30 animate-pulse" : "bg-white/15 text-white/90 border-white/20"}`}
              >
                {stats.openComplaints > 0 ? "NEEDS ACTION" : "ALL CLEAR"}
              </span>
            </div>
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
              Open Complaints
            </p>
            <h3 className="text-2xl font-black mt-0.5 leading-none text-white">
              {stats.openComplaints}
            </h3>
            <div className="mt-3 h-0.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-300/80 rounded-full transition-all duration-700"
                style={{
                  width:
                    complaints.length > 0
                      ? `${Math.min((stats.openComplaints / complaints.length) * 100, 100)}%`
                      : "0%",
                }}
              />
            </div>
            <p className="text-white/50 text-[9px] font-semibold mt-1">
              {complaints.length} total complaints
            </p>
          </div>
        </div>
      </div>
      {/* Decorative circle blob */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 blur-xl" />
      <div className="absolute bottom-0 right-0 w-32 h-16 rounded-tl-full bg-black/10" />

      {/* Print Header */}
      <div className="hidden print:block border-b pb-4 mb-4">
        <h1 className="text-2xl font-bold text-center">
          Mobile Users Hub Report
        </h1>
        <p className="text-sm text-center text-gray-500">
          Generated on: {new Date().toLocaleString()} | Active Tab:{" "}
          {activeTab.toUpperCase()}
        </p>
      </div>

      {/* Tabs - Styled in Modern Light theme */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 shadow-sm border border-slate-100 flex flex-wrap gap-1 print:hidden">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 min-w-[120px] py-3 rounded-xl font-bold text-sm transition duration-200 flex items-center justify-center gap-2 ${activeTab === "users" ? "bg-purple-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50/85 hover:text-slate-800"}`}
        >
          <Users size={16} />
          <span>Users Directory</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-black ${activeTab === "users" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            {users.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("shipments")}
          className={`flex-1 min-w-[120px] py-3 rounded-xl font-bold text-sm transition duration-200 flex items-center justify-center gap-2 ${activeTab === "shipments" ? "bg-purple-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50/85 hover:text-slate-800"}`}
        >
          <Smartphone size={16} />
          <span>Shipment Reports</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-black ${activeTab === "shipments" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            {stats.activeShipments}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("enquiries")}
          className={`flex-1 min-w-[120px] py-3 rounded-xl font-bold text-sm transition duration-200 flex items-center justify-center gap-2 ${activeTab === "enquiries" ? "bg-purple-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50/85 hover:text-slate-800"}`}
        >
          <MessageSquare size={16} />
          <span>User Enquiries</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-black ${activeTab === "enquiries" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            {enquiries.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("complaints")}
          className={`flex-1 min-w-[120px] py-3 rounded-xl font-bold text-sm transition duration-200 flex items-center justify-center gap-2 ${activeTab === "complaints" ? "bg-purple-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50/85 hover:text-slate-800"}`}
        >
          <AlertCircle size={16} />
          <span>User Complaints</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-black ${activeTab === "complaints" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            {complaints.length}
          </span>
        </button>
      </div>

      {/* Filter Bar — inline search + pill tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 print:hidden">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={15} />
          </span>
          <input
            type="text"
            placeholder={
              activeTab === "users"
                ? "Search name, email, mobile…"
                : activeTab === "shipments"
                  ? "Search customer, tracking ID…"
                  : activeTab === "enquiries"
                    ? "Search name, mobile, subject…"
                    : "Search name, mobile, subject…"
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition duration-150 bg-slate-50/60"
          />
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-7 bg-slate-200" />

        {/* Filter label */}
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap flex items-center gap-1.5">
          <Filter size={12} /> Filter:
        </span>

        {/* Pill tabs — Users */}
        {activeTab === "users" && (
          <div className="flex flex-wrap gap-1.5">
            {["", "Active", "Blocked"].map((val) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition duration-200 border whitespace-nowrap ${
                  statusFilter === val
                    ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-purple-400 hover:text-purple-600"
                }`}
              >
                {val === "" ? "All" : val}
              </button>
            ))}
          </div>
        )}

        {/* Pill tabs — Shipments */}
        {activeTab === "shipments" && (
          <div className="flex flex-wrap gap-1.5 items-center">
            {[
              "",
              "Pending",
              "Accepted",
              "Pickup Pending",
              "Picked Up",
              "At Branch",
              "In Transit",
              "Destination Arrived",
              "Out for Delivery",
              "Delivered",
              "Cancelled",
              "Issue",
            ].map((val) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition duration-200 border whitespace-nowrap ${
                  statusFilter === val
                    ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-purple-400 hover:text-purple-600"
                }`}
              >
                {val === "" ? "All" : val}
              </button>
            ))}
            {/* Date picker inline for shipments */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              title="Filter by expected delivery date"
              className="ml-1 rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition duration-150 bg-slate-50/60"
            />
          </div>
        )}

        {/* Pill tabs — Enquiries */}
        {activeTab === "enquiries" && (
          <div className="flex flex-wrap gap-1.5">
            {["", "Open", "In Progress", "Resolved", "Closed"].map((val) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition duration-200 border whitespace-nowrap ${
                  statusFilter === val
                    ? val === ""
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : val === "Open"
                        ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                        : val === "In Progress"
                          ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                          : val === "Resolved"
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                            : "bg-slate-500 text-white border-slate-500 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-purple-400 hover:text-purple-600"
                }`}
              >
                {val === "" ? "All" : val}
              </button>
            ))}
          </div>
        )}

        {/* Pill tabs — Complaints */}
        {activeTab === "complaints" && (
          <div className="flex flex-wrap gap-1.5 items-center">
            {["", "Open", "In Progress", "Resolved", "Closed"].map((val) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition duration-200 border whitespace-nowrap ${
                  statusFilter === val
                    ? val === ""
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : val === "Open"
                        ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                        : val === "In Progress"
                          ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                          : val === "Resolved"
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                            : "bg-slate-500 text-white border-slate-500 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-purple-400 hover:text-purple-600"
                }`}
              >
                {val === "" ? "All" : val}
              </button>
            ))}
            {/* Priority pills */}
            <div className="w-px h-5 bg-slate-200 mx-1" />
            {["", "Low", "Medium", "High"].map((val) => (
              <button
                key={`priority-${val}`}
                onClick={() => setPriorityFilter(val)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition duration-200 border whitespace-nowrap ${
                  priorityFilter === val
                    ? val === ""
                      ? "bg-slate-600 text-white border-slate-600 shadow-sm"
                      : val === "Low"
                        ? "bg-teal-500 text-white border-teal-500 shadow-sm"
                        : val === "Medium"
                          ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                          : "bg-red-500 text-white border-red-500 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-700"
                }`}
              >
                {val === "" ? "Priority: All" : val}
              </button>
            ))}
          </div>
        )}

        {/* Clear all — only show when a filter is active */}
        {(statusFilter ||
          searchTerm ||
          transportFilter ||
          dateFilter ||
          priorityFilter) && (
          <button
            onClick={clearFilters}
            className="ml-auto shrink-0 flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-rose-500 transition duration-200"
            title="Clear all filters"
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Tables Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
          <h3 className="font-extrabold text-slate-700 text-xs tracking-wider uppercase">
            {activeTab === "users" && "USER DIRECTORY LIST"}
            {activeTab === "shipments" && "SHIPMENT REPORT LIST"}
            {activeTab === "enquiries" && "USER ENQUIRIES LIST"}
            {activeTab === "complaints" && "USER COMPLAINTS LIST"}
          </h3>
          <span className="bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
            {filteredData.length} TOTAL RECORDS
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <RefreshCw className="animate-spin text-purple-600" size={32} />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-24 text-slate-400 space-y-3">
            <AlertCircle
              size={48}
              className="mx-auto text-slate-300 animate-bounce"
            />
            <h4 className="font-bold text-slate-700 text-base">
              No records found
            </h4>
            <p className="text-xs max-w-xs mx-auto">
              Try updating search queries or clearing filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Users Directory Table */}
            {activeTab === "users" && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <th className="py-4 px-6">Customer Name</th>
                    <th className="py-4 px-6">Email / Username</th>
                    <th className="py-4 px-6">Mobile Number</th>
                    <th className="py-4 px-6">Alt Mobile</th>
                    <th className="py-4 px-6">Registered Address</th>
                    <th className="py-4 px-6">Joined Date</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-center print:hidden">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {paginatedData.map((u) => (
                    <tr
                      key={u._id}
                      className="hover:bg-slate-50/25 transition duration-150"
                    >
                      <td className="py-4 px-6 font-bold text-slate-800">
                        {u.name}
                      </td>
                      <td className="py-4 px-6 font-medium">
                        {u.email || u.username || "-"}
                      </td>
                      <td className="py-4 px-6 font-mono font-semibold">
                        {u.mobile}
                      </td>
                      <td className="py-4 px-6 font-mono">
                        {u.altMobile || "-"}
                      </td>
                      <td
                        className="py-4 px-6 max-w-xs truncate font-medium"
                        title={u.address}
                      >
                        {u.address || "-"}
                      </td>
                      <td className="py-4 px-6 font-medium">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${u.isActive ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
                        >
                          {u.isActive ? "Active" : "Blocked"}
                        </span>
                      </td>
                                            <td className="py-4 px-6 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => toggleUserStatus(u._id, u.isActive)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition duration-200 ${u.isActive ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200" : "bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"}`}
                          >
                            {u.isActive ? "Block" : "Activate"}
                          </button>
                          <button
                            onClick={() => openEditModal(u, "user")}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-500 p-1.5 rounded-lg transition duration-200 border border-blue-100"
                            title="Edit User"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(u._id, "user")}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-500 p-1.5 rounded-lg transition duration-200 border border-rose-100"
                            title="Delete User"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Shipment Reports Table - Matches screenshot design */}
            {activeTab === "shipments" && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <th className="py-4 px-6">TRACKING ID</th>
                    <th className="py-4 px-6">CUSTOMER</th>
                    <th className="py-4 px-6">PICKUP / DELIVERY ADDRESS</th>
                    <th className="py-4 px-6">TRANSPORT</th>
                    <th className="py-4 px-6">GOODS SPECS</th>
                    <th className="py-4 px-6">STATUS</th>
                    <th className="py-4 px-6 text-center print:hidden">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] text-slate-600">
                  {paginatedData.map((s, idx) => (
                    <tr
                      key={s.trackingId || idx}
                      className="hover:bg-slate-50/25 transition duration-150"
                    >
                      {/* TRACKING ID */}
                      <td className="py-3 px-6 font-mono font-black text-slate-800 tracking-tight">
                        {s.lrNumber || s.trackingId || "No tracking ID"}
                      </td>

                      {/* CUSTOMER */}
                      <td className="py-3 px-6">
                        <div className="font-bold text-slate-800 text-xs">
                          {s.customerName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                          <Phone size={10} className="text-slate-400" />
                          <span>{s.mobileNumber}</span>
                        </div>
                      </td>

                      {/* PICKUP / DELIVERY ADDRESS */}
                      <td className="py-3 px-6 space-y-1 text-[10px]">
                        <div className="flex items-start gap-1">
                          <span className="bg-blue-600 text-white text-[8px] px-1 rounded font-black tracking-wide shrink-0">
                            FROM
                          </span>
                          <span className="text-slate-700 font-bold">
                            {s.pickupCity || "N/A"}:
                          </span>
                          <span
                            className="text-slate-500 max-w-[180px] truncate block italic"
                            title={s.pickupAddress}
                          >
                            {s.pickupAddress}
                          </span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="bg-green-600 text-white text-[8px] px-1 rounded font-black tracking-wide shrink-0">
                            TO
                          </span>
                          <span className="text-slate-700 font-bold">
                            {s.deliveryCity || "N/A"}:
                          </span>
                          <span
                            className="text-slate-500 max-w-[180px] truncate block italic"
                            title={s.deliveryAddress}
                          >
                            {s.deliveryAddress}
                          </span>
                        </div>
                      </td>

                      {/* TRANSPORT */}
                      <td className="py-3 px-6">
                        <span className="inline-block border border-orange-200 bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                          {s.transportType || "STANDARD"}
                        </span>
                      </td>

                      {/* GOODS SPECS */}
                      <td className="py-3 px-6 text-[10px] text-slate-500 font-semibold space-y-0.5">
                        {s.parcelType ? (
                          <>
                            <div className="font-black text-slate-800">
                              {s.parcelType}
                            </div>
                            <div>
                              {s.quantity || 1} PKG • {s.weight || 0} kg
                            </div>
                          </>
                        ) : (
                          <div className="text-slate-400 italic">Parcel</div>
                        )}
                      </td>

                      {/* STATUS */}
                      <td className="py-3 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            s.currentShipmentStatus === "Delivered"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : s.currentShipmentStatus === "Cancelled"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : s.currentShipmentStatus === "In Transit"
                                  ? "bg-orange-50 text-orange-700 border border-orange-200 animate-pulse"
                                  : s.currentShipmentStatus === "Pickup Pending"
                                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              s.currentShipmentStatus === "Delivered"
                                ? "bg-green-500"
                                : s.currentShipmentStatus === "Cancelled"
                                  ? "bg-red-500"
                                  : s.currentShipmentStatus === "In Transit"
                                    ? "bg-orange-500"
                                    : s.currentShipmentStatus ===
                                        "Pickup Pending"
                                      ? "bg-indigo-500"
                                      : "bg-amber-500"
                            }`}
                          ></span>
                          {s.currentShipmentStatus}
                        </span>
                      </td>

                                            {/* ACTIONS */}
                      <td className="py-3 px-6 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openManageShipment(s)}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] tracking-wide transition duration-200 shadow-sm"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => openEditModal(s, "shipment")}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-500 p-1.5 rounded-lg transition duration-200 border border-blue-100"
                            title="Edit Shipment"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(s.trackingId || s._id, "shipment")}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-500 p-1.5 rounded-lg transition duration-200 border border-rose-100"
                            title="Delete Shipment"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* User Enquiries Table - Matches screenshot design */}
            {activeTab === "enquiries" && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <th className="py-4 px-6">CUSTOMER</th>
                    <th className="py-4 px-6">TYPE / SUBJECT</th>
                    <th className="py-4 px-6">ENQUIRY MESSAGE</th>
                    <th className="py-4 px-6">ADMIN RESPONSE</th>
                    <th className="py-4 px-6">SUBMITTED DATE</th>
                    <th className="py-4 px-6">STATUS</th>
                    <th className="py-4 px-6 text-center print:hidden">
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {paginatedData.map((e) => (
                    <tr
                      key={e._id}
                      className="hover:bg-slate-50/25 transition duration-150"
                    >
                      {/* CUSTOMER */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800">
                          {e.user?.name || e.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5 flex items-center gap-1">
                          <Phone size={10} className="text-slate-400" />
                          <span>{e.mobile}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {e.email || (e.user && e.user.email) || "-"}
                        </div>
                      </td>

                      {/* TYPE / SUBJECT */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800">
                          {e.enquiryType || "General support"}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {e.subject || "For different types of parcels"}
                        </div>
                      </td>

                      {/* ENQUIRY MESSAGE */}
                      <td className="py-4 px-6 text-slate-600 max-w-xs break-words font-medium">
                        {e.message}
                      </td>

                      {/* ADMIN RESPONSE */}
                      <td className="py-4 px-6 text-slate-700 font-semibold italic">
                        {e.adminResponse || "-"}
                      </td>

                      {/* SUBMITTED DATE */}
                      <td className="py-4 px-6 text-slate-500 font-medium">
                        {new Date(e.createdAt).toLocaleDateString()}
                      </td>

                      {/* STATUS */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            e.status === "Resolved" || e.status === "Closed"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : e.status === "In Progress"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>

                                            {/* ACTION */}
                      <td className="py-4 px-6 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openReplyModal(e, "enquiry")}
                            className="border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-600 p-1.5 rounded-lg transition duration-200"
                            title="Respond"
                          >
                            <MessageSquare size={12} />
                          </button>
                          <button
                            onClick={() => openEditModal(e, "enquiry")}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-500 p-1.5 rounded-lg transition duration-200 border border-blue-100"
                            title="Edit Enquiry"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(e._id, "enquiry")}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-500 p-1.5 rounded-lg transition duration-200 border border-rose-100"
                            title="Delete Enquiry"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* User Complaints Table */}
            {activeTab === "complaints" && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <th className="py-4 px-6">CUSTOMER</th>
                    <th className="py-4 px-6">TYPE / SUBJECT</th>
                    <th className="py-4 px-6">COMPLAINT DESCRIPTION</th>
                    <th className="py-4 px-6">ADMIN RESPONSE</th>
                    <th className="py-4 px-6">SUBMITTED DATE</th>
                    <th className="py-4 px-6">STATUS</th>
                    <th className="py-4 px-6 text-center print:hidden">
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {paginatedData.map((c) => (
                    <tr
                      key={c._id}
                      className="hover:bg-slate-50/25 transition duration-150"
                    >
                      {/* CUSTOMER */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800">
                          {c.user?.name || c.contactName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5 flex items-center gap-1">
                          <Phone size={10} className="text-slate-400" />
                          <span>{c.user?.mobile || c.contactMobile}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {c.user?.email || "-"}
                        </div>
                      </td>

                      {/* TYPE / SUBJECT */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800">
                          {c.subject}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Receipt: {c.receiptNo}
                        </div>
                      </td>

                      {/* COMPLAINT DESCRIPTION */}
                      <td className="py-4 px-6 text-slate-600 max-w-xs break-words">
                        <div className="mb-1 font-semibold">
                          {c.description}
                        </div>
                        <span
                          className={`inline-block text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${c.priority === "High" ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}
                        >
                          {c.priority} Priority
                        </span>
                      </td>

                      {/* ADMIN RESPONSE */}
                      <td className="py-4 px-6 text-slate-700 font-semibold italic">
                        {c.adminResponse || "-"}
                      </td>

                      {/* SUBMITTED DATE */}
                      <td className="py-4 px-6 text-slate-500 font-medium">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>

                      {/* STATUS */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            c.status === "Resolved" || c.status === "Closed"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : c.status === "In Progress"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                                            {/* ACTION */}
                      <td className="py-4 px-6 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openReplyModal(c, "complaint")}
                            className="border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-600 p-1.5 rounded-lg transition duration-200"
                            title="Respond"
                          >
                            <MessageSquare size={12} />
                          </button>
                          <button
                            onClick={() => openEditModal(c, "complaint")}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-500 p-1.5 rounded-lg transition duration-200 border border-blue-100"
                            title="Edit Complaint"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(c._id, "complaint")}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-500 p-1.5 rounded-lg transition duration-200 border border-rose-100"
                            title="Delete Complaint"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Pagination Controls - Hidden in Print */}
      {!loading && filteredData.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4 print:hidden">
          <span className="text-slate-500 text-xs font-semibold">
            Showing {(currentPage - 1) * recordsPerPage + 1} -{" "}
            {Math.min(currentPage * recordsPerPage, filteredData.length)} of{" "}
            {filteredData.length} records
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 p-2 rounded-lg border transition"
            >
              <ChevronLeft size={16} className="text-slate-500" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${currentPage === num ? "bg-purple-600 text-white shadow-sm" : "bg-white hover:bg-slate-50 text-slate-700 border"}`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 p-2 rounded-lg border transition"
            >
              <ChevronRight size={16} className="text-slate-500" />
            </button>
          </div>
        </div>
      )}

            {/* Edit Modal - Premium Stylish UI */}
      {isEditModalOpen && editItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md print:hidden animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100/50 transform scale-100 transition-all duration-300">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
              <div>
                <h3 className="font-black text-slate-800 text-xl tracking-wide capitalize">
                  Edit {editType} Data
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 font-semibold">
                  Modify and save the updated details below.
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 hover:rotate-90 transition-all duration-300">
                <X size={18} />
              </button>
            </div>
            
            {/* Body Form */}
            <div className="p-8 overflow-y-auto max-h-[65vh] bg-slate-50/30">
              <form id="edit-form" onSubmit={saveEdit} className="space-y-6">
                {editType === 'user' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Name</label><input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" value={editItem.name || ''} onChange={e => setEditItem({...editItem, name: e.target.value})} /></div>
                    <div className="space-y-1.5"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email</label><input type="email" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" value={editItem.email || ''} onChange={e => setEditItem({...editItem, email: e.target.value})} /></div>
                    <div className="space-y-1.5"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mobile</label><input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" value={editItem.mobile || ''} onChange={e => setEditItem({...editItem, mobile: e.target.value})} /></div>
                    <div className="space-y-1.5"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alt Mobile</label><input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" value={editItem.altMobile || ''} onChange={e => setEditItem({...editItem, altMobile: e.target.value})} /></div>
                    <div className="col-span-1 md:col-span-2 space-y-1.5"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Address</label><input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" value={editItem.address || ''} onChange={e => setEditItem({...editItem, address: e.target.value})} /></div>
                  </div>
                )}
                {editType === 'shipment' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Customer Name</label><input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" value={editItem.customerName || ''} onChange={e => setEditItem({...editItem, customerName: e.target.value})} /></div>
                    <div className="space-y-1.5"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mobile Number</label><input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" value={editItem.mobileNumber || ''} onChange={e => setEditItem({...editItem, mobileNumber: e.target.value})} /></div>
                    <div className="space-y-1.5"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pickup City</label><input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" value={editItem.pickupCity || ''} onChange={e => setEditItem({...editItem, pickupCity: e.target.value})} /></div>
                    <div className="space-y-1.5"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Delivery City</label><input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" value={editItem.deliveryCity || ''} onChange={e => setEditItem({...editItem, deliveryCity: e.target.value})} /></div>
                    <div className="col-span-1 md:col-span-2 space-y-1.5"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Delivery Address</label><input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" value={editItem.deliveryAddress || ''} onChange={e => setEditItem({...editItem, deliveryAddress: e.target.value})} /></div>
                    <div className="space-y-1.5"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Parcel Type</label><input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" value={editItem.parcelType || ''} onChange={e => setEditItem({...editItem, parcelType: e.target.value})} /></div>
                    <div className="space-y-1.5"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Current Status</label>
                      <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" value={editItem.currentShipmentStatus || editItem.currentStatus || 'Pending'} onChange={e => setEditItem({...editItem, currentStatus: e.target.value, currentShipmentStatus: e.target.value})}>
                        <option value="Pending">Pending</option>
                        <option value="Pickup Pending">Pickup Pending</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                )}
                {editType === 'enquiry' && (
                  <div className="grid grid-cols-1 gap-5">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-1.5"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Name</label><input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" value={editItem.name || editItem.user?.name || ''} onChange={e => setEditItem({...editItem, name: e.target.value})} /></div>
                      <div className="space-y-1.5"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mobile</label><input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" value={editItem.mobile || ''} onChange={e => setEditItem({...editItem, mobile: e.target.value})} /></div>
                    </div>
                    <div className="space-y-1.5"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Subject</label><input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" value={editItem.subject || ''} onChange={e => setEditItem({...editItem, subject: e.target.value})} /></div>
                    <div className="space-y-1.5"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Message</label><textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" rows="4" value={editItem.message || ''} onChange={e => setEditItem({...editItem, message: e.target.value})} /></div>
                  </div>
                )}
                {editType === 'complaint' && (
                  <div className="grid grid-cols-1 gap-5">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-1.5"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contact Name</label><input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" value={editItem.contactName || editItem.user?.name || ''} onChange={e => setEditItem({...editItem, contactName: e.target.value})} /></div>
                      <div className="space-y-1.5"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contact Mobile</label><input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" value={editItem.contactMobile || editItem.user?.mobile || ''} onChange={e => setEditItem({...editItem, contactMobile: e.target.value})} /></div>
                    </div>
                    <div className="space-y-1.5"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Subject</label><input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" value={editItem.subject || ''} onChange={e => setEditItem({...editItem, subject: e.target.value})} /></div>
                    <div className="space-y-1.5"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Description</label><textarea className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" rows="4" value={editItem.description || ''} onChange={e => setEditItem({...editItem, description: e.target.value})} /></div>
                    <div className="space-y-1.5"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Priority</label>
                      <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" value={editItem.priority || 'Normal'} onChange={e => setEditItem({...editItem, priority: e.target.value})}>
                        <option value="Low">Low Priority</option>
                        <option value="Normal">Normal Priority</option>
                        <option value="High">High Priority</option>
                      </select>
                    </div>
                  </div>
                )}
              </form>
            </div>
            
            {/* Footer */}
            <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end gap-3">
              <button onClick={() => setIsEditModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition duration-200 text-sm">
                Cancel
              </button>
              <button type="submit" form="edit-form" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold tracking-wide transition duration-200 shadow-lg shadow-purple-500/30 active:scale-95 text-sm flex items-center gap-2">
                <Edit3 size={14} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Modern Style */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200 print:hidden">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8 text-center transform transition-all scale-100 animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="w-20 h-20 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-6 border-8 border-red-50/50">
              <Trash2 size={32} className="text-red-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Are you sure?</h3>
            <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">
              You are about to permanently delete this <span className="font-bold text-slate-700 capitalize">{deleteConfirm.type}</span>. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, id: null, type: null })}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all duration-200">
                Cancel
              </button>
              <button
                onClick={confirmDeleteAction}
                className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 text-white font-black tracking-wide rounded-xl transition-all duration-200 active:scale-95">
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Respond Modal (Stunning Premium Light Theme!) */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 text-slate-800 transform scale-100 transition-all duration-300">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <div>
                <h3 className="font-black text-slate-800 text-base tracking-wider uppercase">
                  {modalType === "enquiry"
                    ? "RESPOND TO ENQUIRY"
                    : "RESPOND TO COMPLAINT"}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold">
                  From:{" "}
                  {selectedItem.user?.name ||
                    selectedItem.name ||
                    selectedItem.contactName}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:rotate-90 transition duration-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 bg-white">
              <div className="bg-purple-50/60 p-4 rounded-2xl space-y-1.5 border border-purple-100/70">
                <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">
                  {modalType === "enquiry"
                    ? "USER SUBMITTED DETAILS"
                    : "USER COMPLAINT DESCRIPTION"}
                </p>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  {selectedItem.message || selectedItem.description}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  UPDATE STATUS *
                </label>
                <select
                  value={itemStatus}
                  onChange={(e) => setItemStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white text-slate-700 px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition duration-150"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  OFFICIAL ADMIN RESPONSE / NOTES
                </label>
                <textarea
                  rows={4}
                  value={adminResponseText}
                  onChange={(e) => setAdminResponseText(e.target.value)}
                  placeholder="Enter official response notes here..."
                  className="w-full rounded-xl border border-slate-200 bg-white text-slate-700 px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition duration-150"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50/60 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-white hover:bg-slate-100 text-slate-600 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition duration-200 border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={saveResponse}
                className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition duration-200 shadow-md flex items-center gap-1.5 active:scale-95"
              >
                <Send size={12} />
                <span>Save & Send Response</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileUsers;
