"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { useForm } from "react-hook-form";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredItems, setFilteredItems] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [user, setUser] = useState(null);

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

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
    }, [status]);

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

        if (status === "authenticated") fetchUser();
    }, [status, session]);

    useEffect(() => {
        if (user && !user?.shopName?.trim()) router.push("/profile");
    }, [user]);

    const fetchItems = async () => {
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
    };

    useEffect(() => {
        if (session?.user?.email) fetchItems();
    }, [session]);

    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredItems(items);
        } else {
            const filtered = items.filter(item =>
                (item._id || item.title).toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            setFilteredItems(filtered);
        }
    }, [searchTerm, items]);

    const openDeleteModal = (itemTitle, totalQuantity) => {
        setDeleteModal({
            isOpen: true,
            itemTitle,
            totalQuantity,
            quantity: totalQuantity === 0 ? 0 : totalQuantity
        });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, itemTitle: "", totalQuantity: 0, quantity: 0 });
    };

    const handleQuantityChange = (e) => {
        const value = Math.max(0, Math.min(Number(e.target.value), deleteModal.totalQuantity));
        setDeleteModal(prev => ({ ...prev, quantity: isNaN(value) ? 0 : value }));
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
            closeDeleteModal();
        } catch (error) {
            console.error("Delete error:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const openEditModal = (item) => {
        setEditModal({
            isOpen: true,
            itemData: {
                title: item.title,
                description: item.description,
                totalQuantity: item.totalQuantity,
                price: item.price,
                expirydate: item.expirydate?.substring(0, 10),
                originalTitle: item.title
            }
        });
    };

    const closeEditModal = () => setEditModal({ isOpen: false, itemData: null });

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
                closeEditModal();
            } else {
                alert("Update failed");
            }
        } catch (err) {
            console.error("Edit error:", err);
        }
    };

    const DeleteModal = () => {
        if (!deleteModal.isOpen) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-md">
                    <h3 className="text-xl font-semibold mb-4">Delete {deleteModal.itemTitle}</h3>
                    <p className="mb-4">
                        {deleteModal.totalQuantity === 0
                            ? "This item has 0 quantity. Delete item record?"
                            : `How many units would you like to delete? (Available: ${deleteModal.totalQuantity})`}
                    </p>
                    {deleteModal.totalQuantity > 0 && (
                        <>
                            <input
                                type="number"
                                value={deleteModal.quantity}
                                onChange={handleQuantityChange}
                                min="0"
                                max={deleteModal.totalQuantity}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            />
                            <div className="flex justify-between mt-2">
                                <button onClick={() => setDeleteModal(prev => ({ ...prev, quantity: 1 }))} className="text-sm text-blue-600">Minimum (1)</button>
                                <button onClick={() => setDeleteModal(prev => ({ ...prev, quantity: prev.totalQuantity }))} className="text-sm text-blue-600">All</button>
                            </div>
                        </>
                    )}
                    <div className="flex justify-end space-x-4 mt-6">
                        <button onClick={closeDeleteModal} className="text-gray-600 hover:text-gray-800" disabled={isDeleting}>Cancel</button>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : deleteModal.quantity === 0 ? "Delete All" : `Delete ${deleteModal.quantity} units`}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const EditModal = ({ isOpen, onClose, itemData, onSubmit }) => {
        const { register, handleSubmit, reset } = useForm({ defaultValues: itemData });

        useEffect(() => {
            reset(itemData);
        }, [itemData]);

        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-md">
                    <h3 className="text-xl font-semibold mb-4">Edit Item</h3>
                    <div className="space-y-4">
                        <input {...register("title")} placeholder="Title" className="w-full p-2 border rounded" />
                        <input {...register("description")} placeholder="Description" className="w-full p-2 border rounded" />
                        <input {...register("totalQuantity", { valueAsNumber: true })} type="number" placeholder="Quantity" className="w-full p-2 border rounded" />
                        <input {...register("price", { valueAsNumber: true })} type="number" placeholder="Price" className="w-full p-2 border rounded" />
                        <input {...register("expirydate")} type="date" className="w-full p-2 border rounded" />
                    </div>
                    <div className="flex justify-end mt-6 space-x-4">
                        <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-800">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-500">Save Changes</button>
                    </div>
                </form>
            </div>
        );
    };

    const handlePrintXLSX = () => {
        if (items.length === 0) {
            alert("No items to export.");
            return;
        }

        
        const worksheetData = items.map(item => ({
            Title: item._id || item.title,
            Description: item.description || "",
            Quantity: item.totalQuantity || 0,
            Price: item.price || 0,
            "Expiry Date": item.expirydate ? new Date(item.expirydate).toLocaleDateString("en-IN") : "",
        }));

        
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

       
        const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

        
        const blob = new Blob([wbout], { type: "application/octet-stream" });
        saveAs(blob, "inventory_items.xlsx");
    };
    
    if (status === "loading" || !session) return <p className="text-center mt-20">Loading...</p>;

    return (
        <>
            <Navbar />
            <main className="mt-[90px] px-6 py-8">
                <div className="mb-4 flex justify-between items-center max-w-md">
                    <h2 className="text-3xl font-semibold mb-4 text-gray-800">Your Items</h2>
                    <button
                        onClick={handlePrintXLSX}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow ml-4"
                    >
                        Export Items
                    </button>
                </div>
               

                
                <div className="mb-6 max-w-md">
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                
                
                {filteredItems.length === 0 ? (
                    <p className="text-gray-500">
                        {items.length === 0 ? "No items found." : "No items match your search."}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map((item, index) => (
                            <div
                                key={`${item._id || item.title}-${index}`}
                                className="bg-white rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-transform duration-300"
                            >
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold truncate">{item._id || item.title}</h3>
                                    <p className="text-gray-600">Quantity: {item.totalQuantity}</p>
                                    <p className="text-gray-700 mb-2">{item.description}</p>
                                    <p className="text-sm text-gray-500">Price: ₹{item.price}</p>
                                    {new Date(item.expirydate).getTime() > new Date("2000-01-01").getTime() && (
                                        <p className="text-sm text-gray-500">
                                            Expiry: {new Date(item.expirydate).toLocaleDateString("en-GB")}
                                        </p>
                                    )}
                                </div>
                                <div className="flex justify-between px-4 py-3 bg-gray-100">
                                    <button onClick={() => openEditModal(item)} className="bg-yellow-500 px-4 py-2 text-white rounded">Edit</button>
                                    <button onClick={() => openDeleteModal(item._id || item.title, item.totalQuantity)} className="bg-red-600 px-4 py-2 text-white rounded">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                


                <DeleteModal />
                <EditModal
                    isOpen={editModal.isOpen}
                    onClose={closeEditModal}
                    itemData={editModal.itemData}
                    onSubmit={handleEditSubmit}
                />
            </main>
        </>
    );
}
