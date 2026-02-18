import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  PlusCircle,
  ArrowRight,
} from "lucide-react";

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'shipments'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      
      const [requestsRes, shipmentsRes] = await Promise.all([
        axios.get("/api/parcel-requests", config),
        axios.get("/api/luggage", config)
      ]);

      setRequests(requestsRes.data);
      setShipments(shipmentsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Approved: "bg-blue-100 text-blue-800 border-blue-200",
      "Picked Up": "bg-purple-100 text-purple-800 border-purple-200",
      "In Transit": "bg-orange-100 text-orange-800 border-orange-200",
      Delivered: "bg-green-100 text-green-800 border-green-200",
      Cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status) => {
    const icons = {
      Pending: <Clock size={16} />,
      Approved: <CheckCircle2 size={16} />,
      "Picked Up": <Package size={16} />,
      "In Transit": <Truck size={16} />,
      Delivered: <CheckCircle2 size={16} />,
      Cancelled: <XCircle size={16} />,
    };
    return icons[status] || <Package size={16} />;
  };

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "Pending").length,
    inTransit: requests.filter(
      (r) => r.status === "In Transit" || r.status === "Picked Up",
    ).length,
    delivered: requests.filter((r) => r.status === "Delivered").length,
    totalShipments: shipments.length
  };

  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all', 'today', 'yesterday', 'custom'
  const [customDate, setCustomDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Helper: Check if two dates are the same day
  const isSameDay = (d1, d2) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Filter Logic
  const filteredRequests = requests.filter((req) => {
    const reqDate = new Date(req.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // 1. Date Filter
    let matchesDate = true;
    if (filterType === "today") {
      matchesDate = isSameDay(reqDate, today);
    } else if (filterType === "yesterday") {
      matchesDate = isSameDay(reqDate, yesterday);
    } else if (filterType === "custom" && customDate) {
      matchesDate = isSameDay(reqDate, new Date(customDate));
    }

    // 2. Search Filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (req.pickupAddress &&
        req.pickupAddress.toLowerCase().includes(searchLower)) ||
      (req.deliveryAddress &&
        req.deliveryAddress.toLowerCase().includes(searchLower)) ||
      (req.packageDescription &&
        req.packageDescription.toLowerCase().includes(searchLower)) ||
      (req.status && req.status.toLowerCase().includes(searchLower));

    return matchesDate && matchesSearch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, customDate]);

  // Handlers
  const handleFilterClick = (type) => {
    setFilterType(type);
    if (type !== "custom") setCustomDate("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 md:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-emerald-100 mt-2">
              Track your parcels and manage your shipment requests.
            </p>
          </div>
          <Link
            to="/customer/new-request"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-50 transition-all duration-300 shadow-lg hover:shadow-xl whitespace-nowrap"
          >
            <PlusCircle size={18} />
            New Parcel Request
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Total Requests",
            value: stats.total,
            icon: Package,
            color: "from-blue-500 to-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "My Shipments",
            value: stats.totalShipments,
            icon: Truck,
            color: "from-indigo-500 to-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: Clock,
            color: "from-yellow-500 to-amber-500",
            bg: "bg-yellow-50",
          },
          {
            label: "In Transit",
            value: stats.inTransit,
            icon: Truck,
            color: "from-orange-500 to-orange-600",
            bg: "bg-orange-50",
          },
          {
            label: "Delivered",
            value: stats.delivered,
            icon: CheckCircle2,
            color: "from-green-500 to-emerald-600",
            bg: "bg-green-50",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`${stat.bg} rounded-xl p-4 md:p-5 border border-white shadow-sm hover:shadow-md transition-shadow`}
            >
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}
              >
                <Icon size={20} className="text-white" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-800">
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Main Content Section */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${activeTab === 'requests' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            Parcel Requests
          </button>
          <button
            onClick={() => setActiveTab('shipments')}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${activeTab === 'shipments' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            My Shipments (Receipts)
          </button>
        </div>

        {activeTab === 'requests' ? (
          /* Requests Table Logic */
          <>
            <div className="p-5 border-b bg-gray-50/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-gray-800">
                  Your Parcel Requests
                </h2>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  {/* Search Bar */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="absolute left-3 top-2.5 text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </div>
                  </div>

                  {/* Date Filter Buttons */}
                  <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                    <button
                      onClick={() => handleFilterClick("all")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterType === "all" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600 hover:bg-gray-200"}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => handleFilterClick("today")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterType === "today" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600 hover:bg-gray-200"}`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => handleFilterClick("yesterday")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filterType === "yesterday" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600 hover:bg-gray-200"}`}
                    >
                      Yesterday
                    </button>
                  </div>

                  {/* Custom Date Picker */}
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => {
                      setCustomDate(e.target.value);
                      setFilterType("custom");
                    }}
                    className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${filterType === "custom" ? "border-emerald-500 bg-emerald-50" : ""}`}
                  />
                </div>
              </div>
            </div>

            {paginatedRequests.length === 0 ? (
              <div className="p-12 text-center">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No requests found</p>
                {(searchTerm || filterType !== "all") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterType("all");
                      setCustomDate("");
                    }}
                    className="mt-2 text-emerald-600 hover:underline text-sm font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Pickup
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Delivery
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Package
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedRequests.map((req, index) => (
                        <tr
                          key={req._id}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-5 py-4 text-sm text-gray-600">
                            {startIndex + index + 1}
                          </td>
                          <td
                            className="px-5 py-4 text-sm text-gray-800 font-medium max-w-[200px] truncate"
                            title={req.pickupAddress}
                          >
                            {req.pickupAddress}
                          </td>
                          <td
                            className="px-5 py-4 text-sm text-gray-800 font-medium max-w-[200px] truncate"
                            title={req.deliveryAddress}
                          >
                            {req.deliveryAddress}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600">
                            {req.packageDescription || "-"}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-500">
                            {new Date(req.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                            <div className="text-xs text-gray-400">
                              {new Date(req.createdAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(req.status)}`}
                            >
                              {getStatusIcon(req.status)}
                              {req.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                    <div className="text-sm text-gray-500">
                      Showing <span className="font-medium">{startIndex + 1}</span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(
                          startIndex + itemsPerPage,
                          filteredRequests.length,
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">{filteredRequests.length}</span>{" "}
                      results
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentPage === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-100 border"}`}
                      >
                        Previous
                      </button>
                      <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(
                            (page) =>
                              page === 1 ||
                              page === totalPages ||
                              Math.abs(page - currentPage) <= 1,
                          )
                          .reduce((acc, page, i, arr) => {
                            if (i > 0 && page - arr[i - 1] > 1) acc.push("...");
                            acc.push(page);
                            return acc;
                          }, [])
                          .map((page, idx) =>
                            page === "..." ? (
                              <span
                                key={`dots-${idx}`}
                                className="px-2 py-1 text-gray-400"
                              >
                                ...
                              </span>
                            ) : (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${currentPage === page ? "bg-emerald-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100 border"}`}
                              >
                                {page}
                              </button>
                            ),
                          )}
                      </div>
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentPage === totalPages ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-100 border"}`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          /* Shipments Table Logic - Simple View */
          <div className="p-5">
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">
                  My Shipments
                </h2>
                <div className="text-sm text-gray-500">
                  Total: {shipments.length}
                </div>
             </div>

             {shipments.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed rounded-xl">
                  <Truck size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No shipments found</p>
                </div>
             ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">LR No</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Destination</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Receiver</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Items</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Pay Mode</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {shipments.map((ship) => (
                        <tr key={ship._id} className="hover:bg-gray-50/50">
                          <td className="px-5 py-4 text-sm font-bold text-indigo-600">{ship.manualLrNo}</td>
                          <td className="px-5 py-4 text-sm text-gray-600">
                            {new Date(ship.date).toLocaleDateString("en-IN")}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-800 font-medium">{ship.station}</td>
                          <td className="px-5 py-4 text-sm text-gray-600">{ship.receiverName}</td>
                          <td className="px-5 py-4 text-sm text-gray-600">{ship.noOfParcels} {ship.unit}</td>
                          <td className="px-5 py-4 text-sm font-bold text-green-600">₹{ship.grandTotal}</td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {ship.paymentMode}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <Link 
                                to={`/customer/print/${ship._id}`} 
                                className="inline-flex items-center gap-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                                target="_blank"
                            >
                                🖨️ Print
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
