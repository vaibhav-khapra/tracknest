"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { useForm } from "react-hook-form";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    
    // Core State
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterMode, setFilterMode] = useState("all"); // "all", "expired", "outOfStock"
    
    // Status State
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [user, setUser] = useState(null);

    // Modals State
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        itemTitle: "",
        totalQuantity: 0,
        quantity: 0
    });

    const [editModal, setEditModal] = useState({
        isOpen: false,
        itemData: null
    });

    // 1. Authentication & Profile Guards
    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
    }, [status, router]);

    useEffect(() => {
        const fetchUser = async () => {
            const res = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: session?.user?.email }),
            });
            const data = await res.json();
            setUser(data.users);
        };
        if (status === "authenticated" && session?.user?.email) fetchUser();
    }, [status, session]);

    useEffect(() => {
        if (user && !user?.shopName?.trim()) router.push("/profile");
    }, [user, router]);

    // 2. Fetch Data
    const fetchItems = useCallback(async () => {
        if (!session?.user?.email) return;
        setLoading(true);
        try {
            const res = await fetch("/api/list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: session?.user?.email }),
            });
            const data = await res.json();
            if (data.success) {
                setItems(data.items);
                setFilteredItems(data.items);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // 3. Combined Filter Logic (Search + Category)
    useEffect(() => {
        let result = [...items];

        // Search Filter
        if (searchTerm.trim() !== "") {
            const term = searchTerm.toLowerCase();
            result = result.filter(item =>
                (item._id || item.title).toLowerCase().includes(term) ||
                (item.description && item.description.toLowerCase().includes(term))
            );
        }

        // Category Filters
        const now = new Date();
        if (filterMode === "expired") {
            result = result.filter(item => {
                const expiry = new Date(item.expirydate);
                return expiry.getTime() > new Date("2000-01-01").getTime() && expiry < now;
            });
        } else if (filterMode === "outOfStock") {
            result = result.filter(item => (item.totalQuantity || 0) <= 0);
        }

        setFilteredItems(result);
    }, [searchTerm, items, filterMode]);

    // 4. Action Handlers
    const handlePrintXLSX = () => {
        if (filteredItems.length === 0) {
            alert("No items in current view to export.");
            return;
        }
        const worksheetData = filteredItems.map(item => ({
            Title: item._id || item.title,
            Description: item.description || "",
            Quantity: item.totalQuantity || 0,
            Price: `₹${item.price || 0}`,
            "Expiry Date": item.expirydate ? new Date(item.expirydate).toLocaleDateString("en-IN") : "N/A",
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
        const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        saveAs(new Blob([wbout], { type: "application/octet-stream" }), "inventory_report.xlsx");
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await fetch("/api/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: session?.user?.email,
                    title: deleteModal.itemTitle,
                    quantity: deleteModal.quantity
                }),
            });
            await fetchItems();
            setDeleteModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            console.error("Delete error:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditSubmit = async (data) => {
        try {
            const res = await fetch("/api/edit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: session?.user?.email,
                    originalTitle: data.originalTitle,
                    updatedItem: data
                })
            });
            const result = await res.json();
            if (result.success) {
                await fetchItems();
                setEditModal({ isOpen: false, itemData: null });
            }
        } catch (err) {
            console.error("Edit error:", err);
        }
    };

    // Sub-Components for Modals
    const DeleteModal = () => {
        if (!deleteModal.isOpen) return null;
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white p-6 rounded-xl shadow-2xl w-11/12 max-w-md">
                    <h3 className="text-xl font-bold mb-2">Delete {deleteModal.itemTitle}</h3>
                    <p className="text-gray-600 mb-4">
                        {deleteModal.totalQuantity === 0 ? "Remove this record?" : `Units to delete (Max: ${deleteModal.totalQuantity})`}
                    </p>
                    {deleteModal.totalQuantity > 0 && (
                        <input
                            type="number"
                            value={deleteModal.quantity}
                            onChange={(e) => setDeleteModal(p => ({ ...p, quantity: Math.min(deleteModal.totalQuantity, e.target.value) }))}
                            className="w-full p-2 border rounded mb-4"
                        />
                    )}
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setDeleteModal(p => ({ ...p, isOpen: false }))} className="px-4 py-2 text-gray-500">Cancel</button>
                        <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300">
                            {isDeleting ? "Deleting..." : "Confirm"}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const EditModalUI = () => {
        const { register, handleSubmit, reset } = useForm({ defaultValues: editModal.itemData });
        useEffect(() => reset(editModal.itemData), [editModal.itemData, reset]);

        if (!editModal.isOpen) return null;

        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <form onSubmit={handleSubmit(handleEditSubmit)} className="bg-white p-6 rounded-xl shadow-2xl w-11/12 max-w-md">
                    <h3 className="text-xl font-bold mb-4">Edit Item Details</h3>
                    <div className="space-y-3">
                        <input {...register("title")} placeholder="Title" className="w-full p-2 border rounded" />
                        <textarea {...register("description")} placeholder="Description" className="w-full p-2 border rounded" />
                        <div className="grid grid-cols-2 gap-2">
                            <input {...register("totalQuantity", { valueAsNumber: true })} type="number" placeholder="Qty" className="p-2 border rounded" />
                            <input {...register("price", { valueAsNumber: true })} type="number" placeholder="Price" className="p-2 border rounded" />
                        </div>
                        <input {...register("expirydate")} type="date" className="w-full p-2 border rounded" />
                    </div>
                    <div className="flex justify-end mt-6 gap-3">
                        <button type="button" onClick={() => setEditModal({ isOpen: false, itemData: null })} className="px-4 py-2 text-gray-500">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
                    </div>
                </form>
            </div>
        );
    };

    if (status === "loading" || loading) return <div className="flex justify-center items-center h-screen">Loading Inventory...</div>;

    return (
        <>
            <Navbar />
            <main className="mt-[100px] max-w-7xl mx-auto px-4 pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-900">Inventory Dashboard</h2>
                        <p className="text-gray-500">Manage your products and stock levels</p>
                    </div>
                    <button onClick={handlePrintXLSX} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-all">
                        <span>📥</span> Export to Excel
                    </button>
                </div>

                {/* Filters Section */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 space-y-4">
                    <div className="max-w-xl">
                        <input
                            type="text"
                            placeholder="Search by name or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: "all", label: "All Items", color: "bg-gray-800" },
                            { id: "expired", label: "Expired", color: "bg-red-600" },
                            { id: "outOfStock", label: "Out of Stock", color: "bg-orange-600" }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => setFilterMode(btn.id)}
                                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                                    filterMode === btn.id 
                                    ? `${btn.color} text-white shadow-md` 
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid Section */}
                {filteredItems.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed">
                        <p className="text-gray-500 text-lg">No items match your criteria.</p>
                        <button onClick={() => {setFilterMode("all"); setSearchTerm("");}} className="text-indigo-600 font-semibold mt-2 underline">Clear all filters</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredItems.map((item, index) => {
                            const isExpired = new Date(item.expirydate) < new Date() && new Date(item.expirydate).getTime() > new Date("2000-01-01").getTime();
                            const isOut = item.totalQuantity <= 0;

                            return (
                                <div key={`${item._id || item.title}-${index}`} className={`group bg-white border rounded-2xl overflow-hidden transition-all hover:shadow-xl ${isOut ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'}`}>
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-bold text-gray-900 truncate flex-1" title={item._id || item.title}>{item._id || item.title}</h3>
                                            <span className={`text-xs px-2 py-1 rounded-md font-bold uppercase ${isOut ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                {isOut ? 'Empty' : 'In Stock'}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-sm h-10 overflow-hidden line-clamp-2 mb-4">{item.description || "No description provided."}</p>
                                        
                                        <div className="space-y-2 border-t pt-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Stock:</span>
                                                <span className={`font-mono font-bold ${isOut ? 'text-red-600' : 'text-gray-700'}`}>{item.totalQuantity} units</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Price:</span>
                                                <span className="font-bold text-gray-900 font-mono">₹{item.price}</span>
                                            </div>
                                            {item.expirydate && new Date(item.expirydate).getTime() > new Date("2000-01-01").getTime() && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-400">Expiry:</span>
                                                    <span className={`font-bold ${isExpired ? 'text-red-500 underline' : 'text-gray-700'}`}>
                                                        {new Date(item.expirydate).toLocaleDateString("en-GB")}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex border-t divide-x">
                                        <button onClick={() => setEditModal({ isOpen: true, itemData: { ...item, originalTitle: item.title, expirydate: item.expirydate?.substring(0, 10) } })} className="flex-1 py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors">Edit</button>
                                        <button onClick={() => setDeleteModal({ isOpen: true, itemTitle: item._id || item.title, totalQuantity: item.totalQuantity, quantity: item.totalQuantity })} className="flex-1 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">Delete</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <DeleteModal />
                <EditModalUI />
            </main>
        </>
    );
}