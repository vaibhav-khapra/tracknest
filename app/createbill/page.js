// app/create-bill/page.jsx
"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useSession } from "next-auth/react";
import { FiSearch, FiPlus, FiTrash2, FiPrinter, FiSave } from "react-icons/fi";
import { toast } from "react-hot-toast";
import Router from "next/navigation";
import { useRouter } from "next/navigation";

const CreateBill = () => {
    const { data: session, status } = useSession();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [billItems, setBillItems] = useState([]);
    const [customerName, setCustomerName] = useState("");
    const [discount, setDiscount] = useState(0);
    const [cgst, setCgst] = useState(0);
    const [sgst, setSgst] = useState(0);

    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [isSearching, setIsSearching] = useState(false);
    const [showAllBills, setShowAllBills] = useState(false);
    const router = useRouter()

    useEffect(() => {
        // Load saved draft if exists
        const savedDraft = localStorage.getItem('billDraft');
        if (savedDraft) {
            const { items, customer, discount: savedDiscount } = JSON.parse(savedDraft);
            setBillItems(items || []);
            setCustomerName(customer || "");
            setDiscount(savedDiscount || 0);
        }
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        try {
            const res = await fetch("/api/search-items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query,
                    ownerEmail: session?.user?.email,
                }),
            });

            const data = await res.json();
            setResults(data.items);
            if (data.items.length === 0) {
                toast.error("No items found");
            }
        } catch (error) {
            toast.error("Failed to search items");
        } finally {
            setIsSearching(false);
        }
    };

    const addItemToBill = (item) => {
        setBillItems(prev => {
            const exists = prev.find(i => i._id === item._id);
            if (exists) {
                setTimeout(() => toast("Item already in bill", { icon: "ℹ️" }), 0);
                return prev;
            }
            setTimeout(() => toast.success(`${item.title} added to bill`), 0);
            return [...prev, { ...item, quantity: 1 }];
        });
        setQuery("");
        setResults([]);
      };

    const updateQuantity = (id, quantity) => {
        const qty = Math.max(1, Number(quantity));
        setBillItems(prev =>
            prev.map(item =>
                item._id === id ? { ...item, quantity: qty } : item
            )
        );
    };

    const removeItem = (id) => {
        setBillItems(prev => {
            const newItems = prev.filter(item => item._id !== id);
            if (newItems.length !== prev.length) {
                toast.success("Item removed");
            }
            return newItems;
        });
    };

    const subtotal = billItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const discountAmount = (subtotal * discount) / 100;
    const cgstAmount = (subtotal * cgst) / 100;
    const sgstAmount = (subtotal * sgst) / 100;

    const totalAmount = subtotal - discountAmount + cgstAmount + sgstAmount;

const [recentBills, setRecentBills] = useState([]);
    const saveDraft = () => {
        const draft = {
            items: billItems,
            customer: customerName,
            discount,
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('billDraft', JSON.stringify(draft));
        toast.success("Draft saved");
    };
     useEffect(() => {
            if (status === "unauthenticated") {
                router.push("/login");
            }
        }, [status, router]);

    const clearDraft = () => {
        localStorage.removeItem('billDraft');
        setBillItems([]);
        setCustomerName("");
        setDiscount(0);
        toast.success("Draft cleared");
    };
     
    const generateBill = async () => {
        if (billItems.length === 0) {
            toast.error("Add items to generate bill");
            return;
        }

        try {
            const res = await fetch("/api/create-bill", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: billItems,
                    customerName,
                    discount,
                    cgst,
                    sgst,
                    totalAmount,
                    paymentMethod,
                    ownerEmail: session?.user?.email,
                }),
                
            });

            if (res.ok) {
                toast.success("Bill generated successfully");
                
                setBillItems([]);
                setCustomerName("");
                setDiscount(0);
                localStorage.removeItem('billDraft');
            } else {
                toast.error("Failed to generate bill");
            }
        } catch (error) {
            toast.error("Error generating bill");
        }
    };
    useEffect(() => {
        const fetchRecentBills = async () => {
            const res = await fetch("/api/bills/recent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: session?.user?.email,
                    limit: showAllBills ? null : 5
                }),
            });

            const data = await res.json();
            if (data.success) {
                setRecentBills(data.bills);
            }
        };

        if (session?.user?.email) {
            fetchRecentBills();
        }
    }, [session, showAllBills ,billItems]);


    return (
        <>
            <Navbar />
            <div className="p-6 mt-[90px] max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">Create New Bill</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={saveDraft}
                            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition"
                        >
                            <FiSave /> Save Draft
                        </button>
                        <button
                            onClick={clearDraft}
                            className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg transition"
                        >
                            <FiTrash2 /> Clear
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold mb-3 text-gray-700">Customer Information</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Customer Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter customer name"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Payment Method</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                        <option value="upi">UPI</option>
                                        <option value="netbanking">Net Banking</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold mb-3 text-gray-700">Add Items</h3>
                            <form onSubmit={handleSearch} className="mb-4">
                                <div className="flex">
                                    <input
                                        type="text"
                                        placeholder="Search items by name..."
                                        value={query}
                                        onChange={e => setQuery(e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSearching}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg flex items-center gap-2 transition disabled:opacity-70"
                                    >
                                        {isSearching ? (
                                            "Searching..."
                                        ) : (
                                            <>
                                                <FiSearch /> Search
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>

                            {results.length > 0 && (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                                        {results.map(item => (
                                            <li
                                                key={item._id}
                                                className="flex justify-between items-center p-3 hover:bg-gray-50 transition"
                                            >
                                                <div>
                                                    <p className="font-medium">{item.title}</p>
                                                    <p className="text-sm text-gray-600">
                                                        ₹{item.price} • Exp: {new Date(item.expirydate).toLocaleDateString("en-IN")} • Quantity: {item.quantity}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => addItemToBill(item)}
                                                    className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50 transition"
                                                    title="Add to bill"
                                                >
                                                    <FiPlus size={20} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Bill Items and Summary */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Bill Items */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold mb-3 text-gray-700">Bill Items</h3>

                            {billItems.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Item</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Price</th>
                                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Qty</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Subtotal</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {billItems.map(item => (
                                                <tr key={item._id} className="hover:bg-gray-50 transition">
                                                    <td className="px-4 py-3">
                                                        <p className="font-medium">{item.title}</p>
                                                        <p className="text-xs text-gray-500">
                                                            Exp: {new Date(item.expirydate).toLocaleDateString("en-IN")}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">₹{item.price.toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={item.quantity}
                                                            onChange={e => updateQuantity(item._id, e.target.value)}
                                                            className="w-16 border border-gray-300 rounded px-2 py-1 text-center focus:ring-1 focus:ring-blue-500 outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">
                                                        ₹{(item.price * item.quantity).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            onClick={() => removeItem(item._id)}
                                                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition"
                                                            title="Remove item"
                                                        >
                                                            <FiTrash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No items added to the bill yet</p>
                                    <p className="text-sm mt-2">Search and add items from the left panel</p>
                                </div>
                            )}
                        </div>

                        {/* Bill Summary */}
                        {billItems.length > 0 && (
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-semibold mb-3 text-gray-700">Bill Summary</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600">Discount:</span>
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={discount}
                                                onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                                                className="w-16 border border-gray-300 rounded px-2 py-1 text-center focus:ring-1 focus:ring-blue-500 outline-none"
                                            />
                                            <span>%</span>
                                        </div>
                                        <span className="font-medium text-red-600">-₹{discountAmount.toFixed(2)}</span>
                                        
                                    </div>
                                    <div className="flex justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600">CGST:</span>
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={cgst}
                                                onChange={(e) => setCgst(Math.min(100, Math.max(0, Number(e.target.value))))}
                                                className="w-16 border border-gray-300 rounded px-2 py-1 text-center focus:ring-1 focus:ring-blue-500 outline-none"
                                            />
                                            <span>%</span>
                                        </div>
                                        <span className="font-medium text-green-700">+₹{cgstAmount.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-600">SGST:</span>
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={sgst}
                                                onChange={(e) => setSgst(Math.min(100, Math.max(0, Number(e.target.value))))}
                                                className="w-16 border border-gray-300 rounded px-2 py-1 text-center focus:ring-1 focus:ring-blue-500 outline-none"
                                            />
                                            <span>%</span>
                                        </div>
                                        <span className="font-medium text-green-700">+₹{sgstAmount.toFixed(2)}</span>
                                    </div>

                                    <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                                        <span className="text-gray-800 font-semibold">Total Amount:</span>
                                        <span className="text-xl font-bold text-blue-600">₹{totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        onClick={saveDraft}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg transition flex items-center gap-2"
                                    >
                                        <FiSave /> Save Draft
                                    </button>
                                    <button
                                        onClick={generateBill}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition flex items-center gap-2"
                                    >
                                        <FiPrinter /> Generate Bill
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold mb-3 text-gray-700">Recent Bills</h2>
                                <button
                                    onClick={() => {
                                        setShowAllBills(!showAllBills)
                                        router.push("/allbills")
                                    }}

                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Show All
                                </button>
                            </div>

                            {recentBills.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {recentBills.map((bill) => (
                                                <tr key={bill._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(bill.createdAt).toLocaleString("en-IN", {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            year: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                            hour12: true,
                                                            timeZone: "Asia/Kolkata"
                                                        })}

                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {bill.customerName || "Walk-in"}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {bill.items.length} items
                                                    </td>
                                                    
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        ₹{(bill.totalAmount - (bill.discount || 0)).toFixed(2)}
                                                        {bill.discount ? (
                                                            <span className="text-xs text-gray-400 block">(
                                                                -{bill.discount.toFixed(2)}% discount
                                                            </span>
                                                        ) : null}
                                                        {bill.cgst ? (
                                                            <span className="text-xs text-gray-400 block">(
                                                                +{bill.cgst.toFixed(2)}% CGST
                                                            </span>
                                                        ) : null}
                                                        {bill.sgst ? (
                                                            <span className="text-xs text-gray-400 block">(
                                                                +{bill.sgst.toFixed(2)}% SGST
                                                            </span>
                                                        ) : null}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {bill.paymentMethod || 'Cash'}
                                                    </td>

                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500">No bills found</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateBill;