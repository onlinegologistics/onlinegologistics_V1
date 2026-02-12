import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { 
    Building2, 
    MapPin, 
    Phone, 
    FileText, 
    Edit2, 
    Trash2, 
    Plus, 
    X, 
    Save, 
    DollarSign,
    ChevronLeft,
    ChevronRight,
    RefreshCw
} from 'lucide-react';

const CreditOffices = () => {
    const { user } = useAuth();
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('offices');

    // --- Office State ---
    const [officeForm, setOfficeForm] = useState({
        name: '',
        address: '',
        mobile: '',
        gst: '',
    });
    const [isEditingOffice, setIsEditingOffice] = useState(false);
    const [currentOfficeId, setCurrentOfficeId] = useState(null);

    // --- Pagination for Offices ---
    const [currentOfficePage, setCurrentOfficePage] = useState(1);
    const [officesPerPage] = useState(5);

    // --- Global Pricing State ---
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState({ name: '', price: 0 });
    const [editingCatId, setEditingCatId] = useState(null);
    const [editCatForm, setEditCatForm] = useState({ name: '', price: 0 });
    const [pricingLoading, setPricingLoading] = useState(false);

    // --- Pagination for Categories ---
    const [currentCategoryPage, setCurrentCategoryPage] = useState(1);
    const [categoriesPerPage] = useState(8);

    const config = {
        headers: {
            Authorization: `Bearer ${user?.token}`,
        },
    };

    // --- Fetch Data ---
    const fetchOffices = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/credit-offices', config);
            setOffices(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch offices');
        } finally {
            setLoading(false);
        }
    };

    const fetchPricing = async () => {
        setPricingLoading(true);
        try {
            const { data } = await axios.get('/api/pricing', config);
            if (data && data.categories) {
                setCategories(data.categories);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch pricing');
        } finally {
            setPricingLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            if (activeTab === 'offices') fetchOffices();
            if (activeTab === 'pricing') fetchPricing();
        }
    }, [user, activeTab]);

    // --- Office Handlers ---
    const handleOfficeChange = (e) => {
        const { name, value } = e.target;
        setOfficeForm(prev => ({ ...prev, [name]: value }));
    };

    const handleOfficeSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditingOffice) {
                await axios.put(`/api/credit-offices/${currentOfficeId}`, officeForm, config);
                toast.success('Office Details Updated');
            } else {
                await axios.post('/api/credit-offices', officeForm, config);
                toast.success('New Office Created');
            }

            setOfficeForm({ name: '', address: '', mobile: '', gst: '' });
            setIsEditingOffice(false);
            setCurrentOfficeId(null);
            fetchOffices();
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Failed to save office.';
            toast.error(msg);
        }
    };

    const handleEditOffice = (office) => {
        setOfficeForm({
            name: office.name,
            address: office.address || '',
            mobile: office.mobile || '',
            gst: office.gst || '',
        });
        setIsEditingOffice(true);
        setCurrentOfficeId(office._id);
        window.scrollTo(0, 0);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to remove this office?')) {
            try {
                await axios.delete(`/api/credit-offices/${id}`, config);
                toast.success('Office Removed');
                fetchOffices();
            } catch (error) {
                toast.error('Failed to remove office');
            }
        }
    };

    const handleCancelOffice = () => {
        setIsEditingOffice(false);
        setCurrentOfficeId(null);
        setOfficeForm({ name: '', address: '', mobile: '', gst: '' });
    };

    // --- Category Handlers ---
    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.name.trim()) return toast.error('Category name is required');
        try {
            const { data } = await axios.post('/api/pricing/category', newCategory, config);
            setCategories(data.categories);
            setNewCategory({ name: '', price: 0 });
            toast.success('Category Added');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add category');
        }
    };

    const handleEditCategory = (cat) => {
        setEditingCatId(cat._id);
        setEditCatForm({ name: cat.name, price: cat.price });
    };

    const handleSaveCategory = async (catId) => {
        try {
            const { data } = await axios.put(`/api/pricing/category/${catId}`, editCatForm, config);
            setCategories(data.categories);
            setEditingCatId(null);
            toast.success('Category Updated');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update');
        }
    };

    const handleDeleteCategory = async (catId) => {
        if (!window.confirm('Delete this category?')) return;
        try {
            const { data } = await axios.delete(`/api/pricing/category/${catId}`, config);
            setCategories(data.categories);
            toast.success('Category Deleted');
        } catch (error) {
            toast.error('Failed to delete category');
        }
    };

    // --- Pagination Logic ---
    // Offices Pagination
    const indexOfLastOffice = currentOfficePage * officesPerPage;
    const indexOfFirstOffice = indexOfLastOffice - officesPerPage;
    const currentOffices = offices.slice(indexOfFirstOffice, indexOfLastOffice);
    const totalOfficePages = Math.ceil(offices.length / officesPerPage);

    const handleOfficePageChange = (pageNumber) => {
        setCurrentOfficePage(pageNumber);
    };

    // Categories Pagination
    const indexOfLastCategory = currentCategoryPage * categoriesPerPage;
    const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage;
    const currentCategories = categories.slice(indexOfFirstCategory, indexOfLastCategory);
    const totalCategoryPages = Math.ceil(categories.length / categoriesPerPage);

    const handleCategoryPageChange = (pageNumber) => {
        setCurrentCategoryPage(pageNumber);
    };

    const renderPaginationButtons = (currentPage, totalPages, handlePageChange) => {
        if (totalPages <= 1) return null;

        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        i === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                >
                    {i}
                </button>
            );
        }

        return (
            <div className="flex items-center justify-center gap-2 mt-6">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                </button>

                <div className="flex items-center gap-2">
                    {pages}
                </div>

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                >
                    Next
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        );
    };

    if (!user) return <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
    </div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Master Settings</h1>
                <p className="text-gray-600">Manage credit offices and global pricing categories</p>
            </div>

            {/* Tabs */}
            <div className="flex mb-6 border-b-2 border-gray-200 bg-white rounded-t-lg shadow-sm">
                <button
                    className={`px-8 py-4 font-bold text-lg flex items-center gap-2 transition-all ${
                        activeTab === 'offices' 
                            ? 'border-b-4 border-blue-600 text-blue-700 bg-blue-50' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveTab('offices')}
                >
                    <Building2 className="w-5 h-5" />
                    Manage Offices
                </button>
                <button
                    className={`px-8 py-4 font-bold text-lg flex items-center gap-2 transition-all ${
                        activeTab === 'pricing' 
                            ? 'border-b-4 border-green-600 text-green-700 bg-green-50' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveTab('pricing')}
                >
                    <DollarSign className="w-5 h-5" />
                    Global Pricing
                </button>
            </div>

            {/* TAB 1: MANAGE OFFICES */}
            {activeTab === 'offices' && (
                <div className="animate-fade-in">
                    {/* Office Form */}
                    <div className="bg-white p-8 rounded-lg shadow-md border-t-4 border-blue-600 mb-8">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                            {isEditingOffice ? <Edit2 className="w-6 h-6 text-blue-600" /> : <Plus className="w-6 h-6 text-blue-600" />}
                            {isEditingOffice ? 'Edit Office Details' : 'Add New Credit Office'}
                        </h2>
                        <form onSubmit={handleOfficeSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold mb-2 text-gray-700">
                                        <Building2 className="w-4 h-4 text-blue-600" />
                                        Office Name *
                                    </label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        value={officeForm.name} 
                                        onChange={handleOfficeChange}
                                        className="border-2 border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                                        required 
                                        placeholder="e.g. Pune Market Yard" 
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold mb-2 text-gray-700">
                                        <MapPin className="w-4 h-4 text-blue-600" />
                                        Address
                                    </label>
                                    <input 
                                        type="text" 
                                        name="address" 
                                        value={officeForm.address} 
                                        onChange={handleOfficeChange}
                                        className="border-2 border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                                        placeholder="Full address" 
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold mb-2 text-gray-700">
                                        <Phone className="w-4 h-4 text-blue-600" />
                                        Mobile No
                                    </label>
                                    <input 
                                        type="text" 
                                        name="mobile" 
                                        value={officeForm.mobile} 
                                        onChange={handleOfficeChange}
                                        className="border-2 border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                                        placeholder="Contact number" 
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold mb-2 text-gray-700">
                                        <FileText className="w-4 h-4 text-blue-600" />
                                        GST No
                                    </label>
                                    <input 
                                        type="text" 
                                        name="gst" 
                                        value={officeForm.gst} 
                                        onChange={handleOfficeChange}
                                        className="border-2 border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                                        placeholder="GSTIN" 
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button 
                                    type="submit" 
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 font-bold transition-all transform hover:scale-105 flex items-center gap-2"
                                >
                                    {isEditingOffice ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                    {isEditingOffice ? 'Update Details' : 'Create Office'}
                                </button>
                                {isEditingOffice && (
                                    <button 
                                        type="button" 
                                        onClick={handleCancelOffice} 
                                        className="bg-gray-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-gray-600 font-bold transition-all flex items-center gap-2"
                                    >
                                        <X className="w-5 h-5" />
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Offices List */}
                    <div className="bg-white p-8 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Existing Offices</h2>
                            <div className="text-sm text-gray-600">
                                Showing <span className="font-semibold text-gray-800">{currentOffices.length}</span> of{' '}
                                <span className="font-semibold text-gray-800">{offices.length}</span> offices
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Address</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="4" className="text-center p-12">
                                                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                                                <p className="text-gray-600">Loading offices...</p>
                                            </td>
                                        </tr>
                                    ) : currentOffices.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="text-center p-12">
                                                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                <p className="text-gray-600 font-medium">No offices found</p>
                                                <p className="text-gray-500 text-sm mt-1">Add your first office using the form above</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        currentOffices.map((office) => (
                                            <tr key={office._id} className="hover:bg-blue-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-5 h-5 text-blue-600" />
                                                        <span className="font-semibold text-gray-900">{office.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <MapPin className="w-4 h-4 text-gray-400" />
                                                        {office.address || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        {office.mobile && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-900">
                                                                <Phone className="w-4 h-4 text-blue-600" />
                                                                {office.mobile}
                                                            </div>
                                                        )}
                                                        {office.gst && (
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                <FileText className="w-3 h-3" />
                                                                GST: {office.gst}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        <button 
                                                            onClick={() => handleEditOffice(office)} 
                                                            className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-600 shadow-sm transition-all flex items-center gap-1 font-medium"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                            Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(office._id)} 
                                                            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 shadow-sm transition-all flex items-center gap-1 font-medium"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {renderPaginationButtons(currentOfficePage, totalOfficePages, handleOfficePageChange)}
                    </div>
                </div>
            )}

            {/* TAB 2: GLOBAL PRICING */}
            {activeTab === 'pricing' && (
                <div className="animate-fade-in max-w-4xl mx-auto">
                    {/* Add Category Form */}
                    <div className="bg-white p-8 rounded-lg shadow-md border-t-4 border-green-600 mb-8">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                            <Plus className="w-6 h-6 text-green-600" />
                            Add New Category
                        </h2>
                        <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row items-end gap-4">
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-bold mb-2 text-gray-700">Category Name *</label>
                                <input 
                                    type="text" 
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                                    className="border-2 border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                    placeholder="e.g. Bag, Drum, Thela" 
                                    required 
                                />
                            </div>
                            <div className="w-full sm:w-48">
                                <label className="block text-sm font-bold mb-2 text-gray-700">Price (₹)</label>
                                <input 
                                    type="number" 
                                    value={newCategory.price}
                                    onChange={(e) => setNewCategory(prev => ({ ...prev, price: e.target.value }))}
                                    className="border-2 border-gray-300 p-3 w-full rounded-lg text-right font-bold focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg shadow-md hover:shadow-lg hover:from-green-700 hover:to-green-800 font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Add
                            </button>
                        </form>
                    </div>

                    {/* Categories List */}
                    <div className="bg-white p-8 rounded-lg shadow-md">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Price Categories</h2>
                            <p className="text-gray-600 text-sm">These rates apply globally to all Credit shipments</p>
                        </div>

                        <div className="mb-4 flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                Showing <span className="font-semibold text-gray-800">{currentCategories.length}</span> of{' '}
                                <span className="font-semibold text-gray-800">{categories.length}</span> categories
                            </div>
                        </div>

                        {pricingLoading ? (
                            <div className="text-center p-12">
                                <RefreshCw className="w-8 h-8 animate-spin text-green-600 mx-auto mb-2" />
                                <p className="text-gray-600">Loading pricing...</p>
                            </div>
                        ) : currentCategories.length === 0 ? (
                            <div className="text-center p-12">
                                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-600 font-medium">No categories yet</p>
                                <p className="text-gray-500 text-sm mt-1">Add one using the form above</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gradient-to-r from-green-50 to-green-100">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">#</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Category Name</th>
                                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Price (₹)</th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {currentCategories.map((cat, idx) => (
                                                <tr key={cat._id} className="hover:bg-green-50 transition-colors">
                                                    <td className="px-6 py-4 text-gray-500 font-medium">
                                                        {indexOfFirstCategory + idx + 1}
                                                    </td>

                                                    {editingCatId === cat._id ? (
                                                        <>
                                                            <td className="px-6 py-4">
                                                                <input 
                                                                    type="text" 
                                                                    value={editCatForm.name}
                                                                    onChange={(e) => setEditCatForm(prev => ({ ...prev, name: e.target.value }))}
                                                                    className="border-2 border-green-300 p-2 w-full rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" 
                                                                />
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <input 
                                                                    type="number" 
                                                                    value={editCatForm.price}
                                                                    onChange={(e) => setEditCatForm(prev => ({ ...prev, price: e.target.value }))}
                                                                    className="border-2 border-green-300 p-2 w-full rounded-lg text-right font-bold focus:ring-2 focus:ring-green-500 focus:outline-none" 
                                                                />
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex justify-center gap-2">
                                                                    <button 
                                                                        onClick={() => handleSaveCategory(cat._id)}
                                                                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 shadow-sm transition-all flex items-center gap-1 font-medium"
                                                                    >
                                                                        <Save className="w-4 h-4" />
                                                                        Save
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => setEditingCatId(null)}
                                                                        className="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-500 shadow-sm transition-all flex items-center gap-1"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-6 py-4 font-semibold text-gray-900">{cat.name}</td>
                                                            <td className="px-6 py-4 text-right font-bold text-green-700 text-lg">₹{cat.price}</td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex justify-center gap-2">
                                                                    <button 
                                                                        onClick={() => handleEditCategory(cat)}
                                                                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-600 shadow-sm transition-all flex items-center gap-1 font-medium"
                                                                    >
                                                                        <Edit2 className="w-4 h-4" />
                                                                        Edit
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDeleteCategory(cat._id)}
                                                                        className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 shadow-sm transition-all flex items-center gap-1 font-medium"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {renderPaginationButtons(currentCategoryPage, totalCategoryPages, handleCategoryPageChange)}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreditOffices;
