"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Link from "next/link";
import SalesSummary from "../components/SaleSummary";

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [items, setItems] = useState([]);
    const [user, setUser] = useState(null);
    const [summary, setSummary] = useState({
        totalItems: 0,
        uniqueItems: 0,
        outOfStock: 0,
    });
    const [outOfStockItems, setOutOfStockItems] = useState([]);
    const [expiredItems, setExpiredItems] = useState([]);
    const [recentBills, setRecentBills] = useState([]);
    const [showAllBills, setShowAllBills] = useState(false);
    const [loadingUser, setLoadingUser] = useState(true);
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [loadingBills, setLoadingBills] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        const fetchUser = async () => {
            setLoadingUser(true);
            const email = session?.user?.email;
            if (!email) return;

            try {
                const res = await fetch("/api/profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                });

                const data = await res.json();
                setUser(data.users);
            } catch (error) {
                console.error("Error fetching user:", error);
            } finally {
                setLoadingUser(false);
            }
        };

        if (status === "authenticated") {
            fetchUser();
        }
    }, [status, session]);

    useEffect(() => {
        if (user && !user?.shopName?.trim()) {
            router.push("/profile");
        }
    }, [user, router]);

    useEffect(() => {
        const fetchSummary = async () => {
            setLoadingSummary(true);
            try {
                const res = await fetch("/api/allitems", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: session?.user?.email }),
                });

                const data = await res.json();
                if (data.success) {
                    setSummary({
                        totalItems: data.totalItems,
                        uniqueItems: data.uniqueItems,
                        outOfStock: data.outOfStock,
                        expired: data.expired,
                    });
                    setOutOfStockItems(data.outOfStockItems);
                    setExpiredItems(data.expiredItems);
                }
            } catch (error) {
                console.error("Error fetching summary:", error);
            } finally {
                setLoadingSummary(false);
            }
        };

        if (session?.user?.email) {
            fetchSummary();
        }
    }, [session]);

    useEffect(() => {
        const fetchRecentBills = async () => {
            setLoadingBills(true);
            try {
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
            } catch (error) {
                console.error("Error fetching recent bills:", error);
            } finally {
                setLoadingBills(false);
            }
        };

        if (session?.user?.email) {
            fetchRecentBills();
        }
    }, [session, showAllBills]);

    if (status === "loading" || !session) return <p className="text-center mt-20">Loading...</p>;

    return (
        <>
            <Navbar />
            <main className="p-6 max-w-4xl mx-auto mt-[90px]">
                {loadingUser ? (
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                    </div>
                ) : (
                    <>
                        <h1 className="text-3xl font-bold mb-4">Welcome, {user?.shopName || "User"}!</h1>
                        <p className="text-gray-600 mb-6">Here's an overview of your inventory.</p>
                    </>
                )}

                {loadingSummary ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 animate-pulse">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-gray-200 border rounded-lg p-4 shadow h-24"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white border rounded-lg p-4 shadow">
                            <h2 className="text-xl font-semibold">Total Items</h2>
                            <p className="text-2xl">{summary.totalItems}</p>
                        </div>
                        <div className="bg-white border rounded-lg p-4 shadow">
                            <h2 className="text-xl font-semibold">Unique Items</h2>
                            <p className="text-2xl">{summary.uniqueItems}</p>
                        </div>
                        <div className="bg-white border rounded-lg p-4 shadow">
                            <h2 className="text-xl text-red-500 font-semibold">Out of Stock</h2>
                            <p className="text-2xl">{summary.outOfStock}</p>
                        </div>
                        <div className="bg-white border rounded-lg p-4 shadow">
                            <h2 className="text-xl text-red-500 font-semibold">Expired</h2>
                            <p className="text-2xl">{summary.expired}</p>
                        </div>
                    </div>
                )}

                <div className="flex gap-4 mb-6">
                    <Link href="/additems">
                        <button className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition">
                            ➕ Add New Item
                        </button>
                    </Link>
                    <Link href="/createbill">
                        <button className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition">
                            ➕ Create Bill
                        </button>
                    </Link>
                </div>

                <SalesSummary email={session.user.email} />

                {loadingSummary ? (
                    <div className="animate-pulse mt-6">
                        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    </div>
                ) : (
                    <>
                        {outOfStockItems.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                                <h3 className="text-lg font-semibold text-red-600 mb-2">Out of Stock Items</h3>
                                <ul className="list-disc list-inside text-red-800">
                                    {outOfStockItems.map(item => (
                                        <li key={item._id}>
                                            <span className="font-medium">{item.title}</span> — {item.description || "No description"}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {expiredItems.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                                <h3 className="text-lg font-semibold text-red-600 mb-2">Expired Items</h3>
                                <ul className="list-disc list-inside text-red-800">
                                    {expiredItems.map(item => (
                                        <li key={item._id}>
                                            <span className="font-medium">{item.title}</span> — Expired on: {" "}
                                            {new Date(item.expirydate).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                            })}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}

                <div className="bg-white border rounded-lg mt-10 p-4 shadow mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Recent Bills</h2>
                        <button
                            onClick={() => {
                                setShowAllBills(!showAllBills);
                                router.push("/allbills");
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            {showAllBills ? "Show Less" : "Show All"}
                        </button>
                    </div>

                    {loadingBills ? (
                        <div className="animate-pulse">
                            <div className="h-8 bg-gray-200 rounded w-full mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded w-full mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded w-full mb-2"></div>
                        </div>
                    ) : recentBills.length > 0 ? (
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
                                                {new Date(bill.createdAt).toLocaleDateString("en-GB", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
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
            </main>
        </>
    );
}