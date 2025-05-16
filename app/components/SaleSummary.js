import React, { useEffect, useState } from "react";

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

    const fetchSales = async (custom = false) => {
        setLoading(true);
        try {
            const res = await fetch("/api/sales-summary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    ...(custom ? customDates : {})
                }),
            });

            const data = await res.json();
            if (data.success) {
                setSales(prev => ({
                    ...prev,
                    todaySales: data.todaySales,
                    weekSales: data.weekSales,
                    ...(custom ? { customSales: data.customSales || 0 } : {}),
                }));
            } else {
                console.error("Failed to fetch sales:", data.message);
            }
        } catch (err) {
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales(); // Fetch today's and this week's sales initially
    }, []);

    const handleFetchCustomSales = () => {
        if (customDates.startDate && customDates.endDate) {
            fetchSales(true);
        }
    };

    return (
        <div className="p-6 bg-white shadow rounded-xl space-y-6">
            <h2 className="text-xl font-semibold">Sales Summary</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-100 p-4 rounded-lg shadow">
                    <p className="text-gray-600">Today</p>
                    <p className="text-2xl font-bold text-blue-800">₹{sales.todaySales.toFixed(2)}</p>
                </div>
                <div className="bg-green-100 p-4 rounded-lg shadow">
                    <p className="text-gray-600">This Week</p>
                    <p className="text-2xl font-bold text-green-800">₹{sales.weekSales.toFixed(2)}</p>
                </div>
            </div>

            {!showCustomRange ? (
                <button
                    onClick={() => setShowCustomRange(true)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
                >
                    Custom Sale
                </button>
            ) : (
                <div className="space-y-4">
                    <div className="bg-yellow-100 p-4 rounded-lg shadow">
                        <p className="text-gray-600">Custom Range</p>
                        <p className="text-2xl font-bold text-yellow-800">₹{sales.customSales.toFixed(2)}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
                        <input
                            type="date"
                            value={customDates.startDate}
                            onChange={(e) => setCustomDates({ ...customDates, startDate: e.target.value })}
                            className="border p-2 rounded w-full sm:w-auto"
                        />
                        <span>to</span>
                        <input
                            type="date"
                            value={customDates.endDate}
                            onChange={(e) => setCustomDates({ ...customDates, endDate: e.target.value })}
                            className="border p-2 rounded w-full sm:w-auto"
                        />
                        <button
                            onClick={handleFetchCustomSales}
                            disabled={!customDates.startDate || !customDates.endDate || loading}
                            className={`px-4 py-2 rounded transition ${(!customDates.startDate || !customDates.endDate)
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                }`}
                        >
                            {loading ? "Loading..." : "Fetch"}
                        </button>
                            <button
                                onClick={(params) => {
                                    setShowCustomRange(false)
                                  
                                }
                                }
                                
                                className={`px-4 py-2 rounded transition ${(!customDates.startDate || !customDates.endDate)
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                    }`}
                            >
                                {loading ? "Loading..." : "Close"}
                            </button>
                    </div>
                </div>
            )}
        </div>
    );
}