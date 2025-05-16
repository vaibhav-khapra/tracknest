"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Link from "next/link";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function AllBillsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [bills, setBills] = useState([]);
    const [selectedBill, setSelectedBill] = useState(null);
    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        totalBills: 0,
        totalPages: 1
    });
    const handleViewBill = (bill) => {
        setSelectedBill(bill);
    };


    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        const fetchBills = async () => {
            if (!session?.user?.email) return;

            setLoading(true);
            try {
                const res = await fetch("/api/allbills", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: session.user.email,
                        page: pagination.page,
                        limit: pagination.limit
                    }),
                });

                const data = await res.json();
                if (data.success) {
                    setBills(data.bills);
                    setPagination({
                        ...pagination,
                        totalBills: data.totalBills,
                        totalPages: data.totalPages
                    });
                }
            } catch (error) {
                console.error("Failed to fetch bills:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBills();
    }, [session, pagination.page]);


    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination({ ...pagination, page: newPage });
        }
    };
   useEffect(() => {
           const fetchUserData = async () => {
               if (!session?.user?.email) return;
   
               try {
                   const response = await fetch("/api/profile", {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ email: session.user.email }),
                   });
   
                   if (!response.ok) throw new Error('Failed to fetch user data');
   
                   const data = await response.json();
                   setUser(data.users);
                  
               } catch (error) {
                   console.error("Error fetching data:", error);
                   setUpdateStatus({ success: false, message: 'Failed to load profile data' });
               }
           };
   
           if (session) fetchUserData();
       }, [session]);
       const handlePrintXLSX = () => {
               if (bills.length === 0) {
                   alert("No Bills to export.");
                   return;
               }
       
               
               const worksheetData = bills.map(item => ({
                   Customer: item.customerName ,
                   Discount: item.discount || "",
                   CGST: item.cgst || 0,
                   SGST: item.sgst || 0,
                   TotalAmount: item.totalAmount || 0,
                   Paymentmethod: item.paymentMethod || 0,
                   "Expiry Date": item.expirydate ? new Date(item.expirydate).toLocaleDateString("en-IN") : "",
               }));
       
               
               const worksheet = XLSX.utils.json_to_sheet(worksheetData);
               const workbook = XLSX.utils.book_new();
               XLSX.utils.book_append_sheet(workbook, worksheet, "Bills");
       
              
               const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
       
               
               const blob = new Blob([wbout], { type: "application/octet-stream" });
               saveAs(blob, "Bills.xlsx");
           };


    if (status === "loading" || !session) return <p className="text-center mt-20">Loading...</p>;

    return (
        <>
            <Navbar />
            <main className="p-6 max-w-6xl mx-auto mt-[90px]">
                <div className="flex justify-between items-center mb-6">
                    <div className="mb-4 flex justify-between items-center max-w-md">
                        <h2 className="text-3xl font-semibold mb-4 text-gray-800">Your Bills</h2>
                        <button
                            onClick={handlePrintXLSX}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow ml-4"
                        >
                            Export Bills
                        </button>
                    </div>
                    <Link href="/createbill">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                            ➕ Create New Bill
                        </button>
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-10">
                        <p>Loading bills...</p>
                    </div>
                ) : bills.length === 0 ? (
                    <div className="text-center py-10">
                        <p>No bills found</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white border rounded-lg shadow overflow-hidden">
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
                                        {bills.map((bill) => (
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


                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            className="text-blue-600 hover:text-blue-800"
                                                            onClick={() => handleViewBill(bill)}
                                                        >
                                                            View
                                                        </button>

                                                        <button
                                                          
                                                            className="text-green-600 hover:text-green-800"
                                                        >
                                                            Print
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>


                                        ))}

                                    </tbody>
                                </table>
                            </div>
                        </div>
                                {selectedBill && (
                                    <div className="fixed inset-0 z-50 flex items-start justify-center p-4  overflow-y-auto">
                                        {/* Blurred backdrop */}
                                        <div className="fixed inset-0 bg-white bg-opacity-30 backdrop-blur-md"></div>

                                        {/* Invoice container */}
                                        <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl border border-gray-200 ">
                                            {/* Invoice header */}
                                            <div className="flex justify-between items-start mb-8 pb-4 border-b border-gray-300">
                                                <div>
                                                    <h1 className="text-3xl font-bold text-gray-800">{user.shopName || "My Shop"}</h1>
                                                    {user.address && <p className="text-gray-600 text-sm mt-1">{user.address}</p>}
                                                    {user.mobileNo && <p className="text-gray-600 text-sm">Phone: {user.mobileNo}</p>}
                                                    {user.gstin && <p className="text-gray-600 text-sm">GSTIN: {user.gstin}</p>}
                                                </div>

                                                <div className="text-right">
                                                    <h2 className="text-2xl font-bold text-blue-600">INVOICE</h2>
                                                    <p className="text-gray-600 mt-2">
                                                        <span className="font-medium">Date:</span> {new Date(selectedBill.createdAt).toLocaleString("en-IN", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                            hour12: true,
                                                            timeZone: "Asia/Kolkata"
                                                        })}
                                                    </p>
                                                    <p className="text-gray-600">
                                                        <span className="font-medium">Bill No:</span> {selectedBill._id.slice(-6).toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Customer details */}
                                            <div className="flex justify-between mb-6">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Bill To:</h3>
                                                    <p className="text-gray-700">{selectedBill.customerName || "Walk-in Customer"}</p>
                                                </div>
                                                <div className="text-right">
                                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Method:</h3>
                                                    <p className="text-gray-700 capitalize">{selectedBill.paymentMethod}</p>
                                                </div>
                                            </div>

                                            {/* Items table */}
                                            <div className="mb-8">
                                                <table className="w-full border-collapse">
                                                    <thead>
                                                        <tr className="bg-gray-100 text-left">
                                                            <th className="py-2 px-4 font-semibold text-gray-700 border-b">Item</th>
                                                            <th className="py-2 px-4 font-semibold text-gray-700 border-b text-right">Price</th>
                                                            <th className="py-2 px-4 font-semibold text-gray-700 border-b text-right">Qty</th>
                                                            <th className="py-2 px-4 font-semibold text-gray-700 border-b text-right">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedBill.items.map((item, idx) => (
                                                            <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                                                <td className="py-3 px-4 text-gray-700">{item.title}</td>
                                                                <td className="py-3 px-4 text-gray-700 text-right">₹{item.price.toFixed(2)}</td>
                                                                <td className="py-3 px-4 text-gray-700 text-right">{item.quantity}</td>
                                                                <td className="py-3 px-4 text-gray-700 text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Summary */}
                                            <div className="flex justify-end">
                                                <div className="w-64">
                                                    <div className="flex justify-between py-2 border-b border-gray-200">
                                                        <span className="text-gray-700">Subtotal:</span>
                                                        <span className="text-gray-900 font-medium">₹{selectedBill.totalAmount.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between py-2 border-b border-gray-200">
                                                        <span className="text-gray-700">Discount ({selectedBill.discount}%):</span>
                                                        <span className="text-red-500">-₹{(selectedBill.totalAmount * selectedBill.discount / 100).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between py-2 border-b border-gray-200">
                                                        <span className="text-gray-700">CGST ({selectedBill.cgst}%):</span>
                                                        <span className="text-gray-900">₹{(selectedBill.totalAmount * selectedBill.cgst / 100).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between py-2 border-b border-gray-200">
                                                        <span className="text-gray-700">SGST ({selectedBill.sgst}%):</span>
                                                        <span className="text-gray-900">₹{(selectedBill.totalAmount * selectedBill.sgst / 100).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between py-2">
                                                        <span className="text-lg font-semibold text-gray-900">Grand Total:</span>
                                                        <span className="text-lg font-bold text-blue-600">
                                                            ₹{(
                                                                selectedBill.totalAmount -
                                                                (selectedBill.totalAmount * selectedBill.discount / 100) +
                                                                (selectedBill.totalAmount * selectedBill.cgst / 100) +
                                                                (selectedBill.totalAmount * selectedBill.sgst / 100)
                                                            ).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-500">
                                                <p>Thank you for your business!</p>
                                                {user.ownerName && <p className="mt-2">Proprietor: {user.ownerName}</p>}
                                            </div>

                                            <div className="flex gap-5 justify-center mt-6">
                                                <button
                                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200"
                                                    onClick={() => window.print()}
                                                >
                                                    Print
                                                </button>
                                                <button
                                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200"
                                                    onClick={() => setSelectedBill(null)}
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-500">
                                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                                {Math.min(pagination.page * pagination.limit, pagination.totalBills)} of{' '}
                                {pagination.totalBills} bills
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className={`px-3 py-1 rounded ${pagination.page === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}
                                >
                                    Previous
                                </button>
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (pagination.totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (pagination.page <= 3) {
                                        pageNum = i + 1;
                                    } else if (pagination.page >= pagination.totalPages - 2) {
                                        pageNum = pagination.totalPages - 4 + i;
                                    } else {
                                        pageNum = pagination.page - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`px-3 py-1 rounded ${pagination.page === pageNum ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.totalPages}
                                    className={`px-3 py-1 rounded ${pagination.page === pagination.totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </>
    );
}