import React, { useEffect, useState, useCallback } from "react";

export default function SalesSummary({ email }) {
    const [sales, setSales] = useState({
        todaySales: 0,
        weekSales: 0,
        customSales: 0,
    });

    const [customDates, setCustomDates] = useState({
        startDate: "",
        endDate: ""
    });

    const [loading, setLoading] = useState(false);
    const [showCustomRange, setShowCustomRange] = useState(false);

    // Wrapped in useCallback to ensure stability
    const fetchSales = useCallback(async (isCustom = false) => {
        if (!email) return; // Prevent fetching without an identifier

        setLoading(true);
        try {
            const payload = {
                email,
                ...(isCustom ? customDates : {})
            };

            const res = await fetch("/api/sales-summary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            
            if (data.success) {
                setSales(prev => ({
                    ...prev,
                    todaySales: data.todaySales ?? prev.todaySales,
                    weekSales: data.weekSales ?? prev.weekSales,
                    ...(isCustom ? { customSales: data.customSales || 0 } : {}),
                }));
            }
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }, [email, customDates]);

    // Initial Fetch: Runs when email is available
    useEffect(() => {
        fetchSales(false);
    }, [email]); // Re-run if email changes

    const handleFetchCustomSales = () => {
        if (customDates.startDate && customDates.endDate) {
            fetchSales(true);
        }
    };

    return (
        <div className="p-6 bg-white shadow rounded-xl space-y-6">
            <h2 className="text-xl font-semibold">Sales Summary</h2>

            {/* Sales Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-100 p-4 rounded-lg shadow">
                    <p className="text-sm text-blue-600">Today</p>
                    <p className="text-2xl font-bold text-blue-800">₹{sales.todaySales.toFixed(2)}</p>
                </div>
                <div className="bg-green-100 p-4 rounded-lg shadow">
                    <p className="text-sm text-green-600">This Week</p>
                    <p className="text-2xl font-bold text-green-800">₹{sales.weekSales.toFixed(2)}</p>
                </div>
            </div>

            {/* Custom Range Logic */}
            {!showCustomRange ? (
                <button
                    onClick={() => setShowCustomRange(true)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
                >
                    Custom Sale Range
                </button>
            ) : (
                <div className="space-y-4 border-t pt-4">
                    <div className="bg-yellow-100 p-4 rounded-lg shadow">
                        <p className="text-sm text-yellow-600">Custom Range Total</p>
                        <p className="text-2xl font-bold text-yellow-800">₹{sales.customSales.toFixed(2)}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <input
                            type="date"
                            value={customDates.startDate}
                            onChange={(e) => setCustomDates({ ...customDates, startDate: e.target.value })}
                            className="border p-2 rounded w-full sm:w-auto"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                            type="date"
                            value={customDates.endDate}
                            onChange={(e) => setCustomDates({ ...customDates, endDate: e.target.value })}
                            className="border p-2 rounded w-full sm:w-auto"
                        />
                        
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={handleFetchCustomSales}
                                disabled={!customDates.startDate || !customDates.endDate || loading}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded disabled:bg-gray-400 transition"
                            >
                                {loading ? "..." : "Fetch"}
                            </button>
                            <button
                                onClick={() => setShowCustomRange(false)}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}