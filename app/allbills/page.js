"use client";

import React, { useEffect, useState, useMemo } from "react";

/* ── print styles injected once into <head> ──────────────────────────── */
const PRINT_STYLE = `
@media print {
  /* hide everything */
  body > * { display: none !important; }

  /* show only the invoice modal card */
  #invoice-print-root,
  #invoice-print-root * { display: revert !important; }

  /* remove backdrop / shadows */
  #invoice-print-root .fixed { position: static !important; background: none !important; backdrop-filter: none !important; box-shadow: none !important; }

  /* ensure single page, no duplicate */
  #invoice-print-root .relative { page-break-after: avoid; break-after: avoid; }

  /* hide the action buttons when printing */
  #invoice-print-actions { display: none !important; }

  @page { size: A4; margin: 16mm; }
}
`;
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Link from "next/link";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* ── tiny icon helpers (inline SVGs, no extra deps) ─────────────────── */
const Icon = ({ d, size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d={d} />
  </svg>
);
const SearchIcon = (p) => (
  <Icon
    {...p}
    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
  />
);
const FilterIcon = (p) => (
  <Icon {...p} d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
);
const ExportIcon = (p) => (
  <Icon
    {...p}
    d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
  />
);
const PlusIcon = (p) => <Icon {...p} d="M12 5v14M5 12h14" />;
const CloseIcon = (p) => <Icon {...p} d="M18 6 6 18M6 6l12 12" />;
const ChevronLeft = (p) => <Icon {...p} d="M15 18l-6-6 6-6" />;
const ChevronRight = (p) => <Icon {...p} d="M9 18l6-6-6-6" />;
const PrintIcon = (p) => (
  <Icon
    {...p}
    d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"
  />
);
const TrashIcon = (p) => (
  <Icon 
  {...p}
    d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
);
const EyeIcon = (p) => (
  <Icon
    {...p}
    d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
  />
);

/* ── badge component ─────────────────────────────────────────────────── */
const PaymentBadge = ({ method }) => {
  const map = {
    cash: "bg-emerald-100 text-emerald-700 border-emerald-200",
    card: "bg-blue-100 text-blue-700 border-blue-200",
    upi: "bg-violet-100 text-violet-700 border-violet-200",
    online: "bg-cyan-100 text-cyan-700 border-cyan-200",
  };
  const cls =
    map[(method || "cash").toLowerCase()] ||
    "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${cls}`}
    >
      {method || "Cash"}
    </span>
  );
};

/* ── stat card ───────────────────────────────────────────────────────── */
const StatCard = ({ label, value, sub, accent }) => (
  <div
    className={`relative overflow-hidden rounded-2xl p-5 bg-white border border-gray-100 shadow-sm`}
  >
    <div
      className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-6 translate-x-6 ${accent}`}
    />
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
      {label}
    </p>
    <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

export default function AllBillsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ── search & filter state ───────────────────────────────────────── */
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPayment, setFilterPayment] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [deleteBill, setdeleteBill] = useState(false);

  /* inject print CSS once */
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "tracknest-print-style";
    style.textContent = PRINT_STYLE;
    if (!document.getElementById("tracknest-print-style"))
      document.head.appendChild(style);
    return () => document.getElementById("tracknest-print-style")?.remove();
  }, []);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalBills: 0,
    totalPages: 1,
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
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
            limit: pagination.limit,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setBills(data.bills);
          setPagination((p) => ({
            ...p,
            totalBills: data.totalBills,
            totalPages: data.totalPages,
          }));
        }
      } catch (e) {
        console.error("Failed to fetch bills:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
    setdeleteBill(false)
  }, [session,deleteBill, pagination.page]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!session?.user?.email) return;
      try {
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: session.user.email }),
        });
        const data = await res.json();
        setUser(data.users);
      } catch (e) {
        console.error(e);
      }
    };
    if (session) fetchUser();
  }, [session]);

  /* ── derived / filtered bills ────────────────────────────────────── */
  const filteredBills = useMemo(() => {
    let result = [...bills];

    // text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          (b.customerName || "walk-in").toLowerCase().includes(q) ||
          b._id.toLowerCase().includes(q) ||
          (b.paymentMethod || "cash").toLowerCase().includes(q) ||
          String(b.totalAmount).includes(q),
      );
    }

    // payment filter
    if (filterPayment !== "all") {
      result = result.filter(
        (b) => (b.paymentMethod || "cash").toLowerCase() === filterPayment,
      );
    }

    // date range filter
    if (filterDateRange !== "all") {
      const now = new Date();
      const cutoff = new Date();
      if (filterDateRange === "today") cutoff.setHours(0, 0, 0, 0);
      else if (filterDateRange === "week") cutoff.setDate(now.getDate() - 7);
      else if (filterDateRange === "month") cutoff.setDate(now.getDate() - 30);
      result = result.filter((b) => new Date(b.createdAt) >= cutoff);
    }

    // sort
    result.sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest")
        return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "highest") return b.totalAmount - a.totalAmount;
      if (sortBy === "lowest") return a.totalAmount - b.totalAmount;
      return 0;
    });

    return result;
  }, [bills, searchQuery, filterPayment, filterDateRange, sortBy]);

  /* ── stats ───────────────────────────────────────────────────────── */
  const totalRevenue = filteredBills.reduce(
    (s, b) => s + Number(b.totalAmount),
    0,
  );
  const avgBill =
    filteredBills.length > 0 ? totalRevenue / filteredBills.length : 0;

  /* ── invoice amounts ─────────────────────────────────────────────── */
  const subtotal = selectedBill
    ? selectedBill.items.reduce((a, i) => a + i.price * i.quantity, 0)
    : 0;
  const discountAmount = selectedBill
    ? (subtotal * selectedBill.discount) / 100
    : 0;
  const cgstAmount = selectedBill ? (subtotal * selectedBill.cgst) / 100 : 0;
  const sgstAmount = selectedBill ? (subtotal * selectedBill.sgst) / 100 : 0;
  const grandTotal = selectedBill ? selectedBill.totalAmount : 0;

  /* ── export ──────────────────────────────────────────────────────── */
  const handleExport = () => {
    if (!filteredBills.length) return alert("No bills to export.");
    const ws = XLSX.utils.json_to_sheet(
      filteredBills.map((b) => ({
        Date: new Date(b.createdAt).toLocaleDateString("en-IN"),
        Customer: b.customerName || "Cash Customer",
        Discount: Number(b.discount) || 0,
        CGST: Number(b.cgst) || 0,
        SGST: Number(b.sgst) || 0,
        TotalAmount: Number(b.totalAmount) || 0,
        PaymentMethod: b.paymentMethod || "Not Specified",
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bills");
    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
        type: "application/octet-stream",
      }),
      "Bills.xlsx",
    );
  };

  const handlePageChange = (p) => {
    if (p >= 1 && p <= pagination.totalPages)
      setPagination((prev) => ({ ...prev, page: p }));
  };
  const handleDeleteBill = async (p) =>{
    if (deleteBill) return;
    
    try {
            await fetch("/api/delete/bill", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    _id : p
                }),
            });
            setdeleteBill(true)
            
        } catch (error) {
            console.error("Delete error:", error);
        }

  }

  const activeFilters =
    (filterPayment !== "all" ? 1 : 0) +
    (filterDateRange !== "all" ? 1 : 0) +
    (sortBy !== "newest" ? 1 : 0);

  if (status === "loading" || !session)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Navbar />
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading…</p>
        </div>
      </div>
    );

  return (
    <>
      <Navbar />

      {/* ── page shell ────────────────────────────────────────────── */}
      <main className="min-h-screen bg-slate-50 pt-[80px] pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── header ────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">
                Billing Dashboard
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                All Bills
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold shadow-sm hover:bg-slate-50 transition"
              >
                <ExportIcon size={15} />
                Export
              </button>
              <Link href="/createbill">
                <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-200 transition">
                  <PlusIcon size={15} />
                  New Bill
                </button>
              </Link>
            </div>
          </div>

          {/* ── stat cards ────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Showing Bills"
              value={filteredBills.length}
              sub={`of ${pagination.totalBills} total`}
              accent="bg-blue-500"
            />
            <StatCard
              label="Total Revenue"
              value={`₹${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sub="filtered results"
              accent="bg-emerald-500"
            />
            <StatCard
              label="Average Bill"
              value={`₹${avgBill.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sub="per transaction"
              accent="bg-violet-500"
            />
            <StatCard
              label="Current Page"
              value={`${pagination.page} / ${pagination.totalPages}`}
              sub={`${pagination.limit} per page`}
              accent="bg-amber-500"
            />
          </div>

          {/* ── search + filter bar ───────────────────────────────── */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* search input */}
              <div className="relative flex-1">
                <SearchIcon
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search by customer, ID, amount…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <CloseIcon size={14} />
                  </button>
                )}
              </div>

              {/* filter toggle */}
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition ${showFilters || activeFilters > 0 ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                <FilterIcon size={15} />
                Filters
                {activeFilters > 0 && (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                    {activeFilters}
                  </span>
                )}
              </button>
            </div>

            {/* expandable filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={filterPayment}
                    onChange={(e) => setFilterPayment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="all">All Methods</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="online">Online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Date Range
                  </label>
                  <select
                    value={filterDateRange}
                    onChange={(e) => setFilterDateRange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest">Highest Amount</option>
                    <option value="lowest">Lowest Amount</option>
                  </select>
                </div>

                {activeFilters > 0 && (
                  <div className="sm:col-span-3 flex justify-end">
                    <button
                      onClick={() => {
                        setFilterPayment("all");
                        setFilterDateRange("all");
                        setSortBy("newest");
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── table / empty states ──────────────────────────────── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Fetching bills…</p>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                <SearchIcon size={28} className="text-slate-400" />
              </div>
              <p className="text-slate-700 font-semibold text-lg">
                No bills found
              </p>
              <p className="text-slate-400 text-sm max-w-xs">
                {searchQuery || activeFilters > 0
                  ? "Try adjusting your search or filters."
                  : "Create your first bill to get started."}
              </p>
            </div>
          ) : (
            <>
              {/* ── desktop table ──────────────────────────────────── */}
              <div className="hidden md:block bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="bg-slate-50">
                      {["Date", "Customer", "Bill No", "Items", "Total", "Payment", "Actions"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredBills.map((bill) => (
                      <tr
                        key={bill._id}
                        className="hover:bg-blue-50/40 transition-colors group"
                      >
                        <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">
                          {new Date(bill.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                            timeZone: "Asia/Kolkata",
                          })}
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-slate-800">
                          {bill.customerName || (
                            <span className="text-slate-400 italic">Walk-in</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                            #{bill._id.slice(-6).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500">
                          <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                            {bill.items.length}{" "}
                            {bill.items.length === 1 ? "item" : "items"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 text-sm">
                            ₹{Number(bill.totalAmount).toFixed(2)}
                          </div>
                          <div className="flex flex-col mt-0.5">
                            {bill.discount > 0 && (
                              <span className="text-xs text-red-500">
                                -{bill.discount}% disc
                              </span>
                            )}
                            {bill.cgst > 0 && (
                              <span className="text-xs text-slate-400">
                                +{bill.cgst}% CGST
                              </span>
                            )}
                            {bill.sgst > 0 && (
                              <span className="text-xs text-slate-400">
                                +{bill.sgst}% SGST
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <PaymentBadge method={bill.paymentMethod} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setSelectedBill(bill)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                            >
                              <EyeIcon size={13} />
                              View
                            </button>
                            <button
                              onClick={() => window.print()}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
                            >
                              <PrintIcon size={13} />
                              Print
                            </button>

                            <button
                            disabled={deleteBill}
                              onClick={() => handleDeleteBill(bill._id)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition"
                            >
                              <TrashIcon size={13} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── mobile card list ───────────────────────────────── */}
              <div className="md:hidden flex flex-col gap-3">
                {filteredBills.map((bill) => (
                  <div
                    key={bill._id}
                    className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">
                          {bill.customerName || "Walk-in Customer"}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          #{bill._id.slice(-6).toUpperCase()} ·{" "}
                          {new Date(bill.createdAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <PaymentBadge method={bill.paymentMethod} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400">
                          {bill.items.length} item(s)
                        </span>
                        {bill.discount > 0 && (
                          <span className="text-xs text-red-500 ml-2">
                            -{bill.discount}%
                          </span>
                        )}
                      </div>
                      <span className="text-lg font-extrabold text-slate-900">
                        ₹{Number(bill.totalAmount).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50">
                      <button
                        onClick={() => setSelectedBill(bill)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 py-2 rounded-xl transition"
                      >
                        <EyeIcon size={13} />
                        View Invoice
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 py-2 rounded-xl transition"
                      >
                        <PrintIcon size={13} />
                        Print
                      </button>
                       <button
                            disabled={deleteBill}
                              onClick={() => handleDeleteBill(bill._id)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition"
                            >
                              <TrashIcon size={13} />
                              Delete
                            </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── pagination ─────────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
                <p className="text-sm text-slate-400">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{" "}
                  –{" "}
                  <span className="font-semibold text-slate-700">
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.totalBills,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {pagination.totalBills}
                  </span>{" "}
                  bills
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      let p;
                      if (pagination.totalPages <= 5) p = i + 1;
                      else if (pagination.page <= 3) p = i + 1;
                      else if (pagination.page >= pagination.totalPages - 2)
                        p = pagination.totalPages - 4 + i;
                      else p = pagination.page - 2 + i;
                      return (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={`w-9 h-9 rounded-xl text-sm font-semibold transition ${pagination.page === p ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                        >
                          {p}
                        </button>
                      );
                    },
                  )}

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ── invoice modal ─────────────────────────────────────────────── */}
      {selectedBill && (
        <div id="invoice-print-root" className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto">
          {/* backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setSelectedBill(null)}
          />

          {/* invoice card */}
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto">
            {/* top accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

            <div className="p-6 sm:p-8">
              {/* header */}
              <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-100">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">
                    {user?.shopName || "My Shop"}
                  </h1>
                  {user?.address && (
                    <p className="text-slate-500 text-sm mt-1">{user.address}</p>
                  )}
                  {user?.mobileNo && (
                    <p className="text-slate-500 text-sm">📞 {user.mobileNo}</p>
                  )}
                  {user?.gstin && (
                    <p className="text-slate-500 text-xs mt-1 font-mono">
                      GSTIN: {user.gstin}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="inline-block px-4 py-1 rounded-full bg-blue-600 text-white text-sm font-bold tracking-widest uppercase mb-2">
                    Invoice
                  </span>
                  <p className="text-slate-500 text-xs">
                    {new Date(selectedBill.createdAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                      timeZone: "Asia/Kolkata",
                    })}
                  </p>
                  <p className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded mt-1 inline-block">
                    #{selectedBill._id.slice(-6).toUpperCase()}
                  </p>
                </div>
              </div>

              {/* bill-to / payment */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Bill To
                  </p>
                  <p className="text-slate-800 font-semibold text-sm">
                    {selectedBill.customerName || "Walk-in Customer"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Payment
                  </p>
                  <PaymentBadge method={selectedBill.paymentMethod} />
                </div>
              </div>

              {/* items */}
              <div className="rounded-xl overflow-hidden border border-slate-100 mb-8">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-3 text-left">Item</th>
                      <th className="px-4 py-3 text-right">Price</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selectedBill.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition">
                        <td className="px-4 py-3 text-slate-700 font-medium">
                          {item.title}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-right">
                          ₹{item.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-right">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-slate-800 font-semibold text-right">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {selectedBill.discount > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Discount ({selectedBill.discount}%)</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedBill.cgst > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>CGST ({selectedBill.cgst}%)</span>
                      <span>₹{cgstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedBill.sgst > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>SGST ({selectedBill.sgst}%)</span>
                      <span>₹{sgstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t-2 border-slate-200 font-bold text-base text-slate-900">
                    <span>Grand Total</span>
                    <span className="text-blue-600">
                      ₹{Number(grandTotal).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* footer */}
              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <p className="text-slate-400 text-sm">
                  Thank you for your business! 🙏
                </p>
                {user?.ownerName && (
                  <p className="text-slate-500 text-xs mt-1">
                    Proprietor: <span className="font-semibold">{user.ownerName}</span>
                  </p>
                )}
                {/* branding inside invoice — visible on print too */}
                <p className="text-slate-300 text-xs mt-4 tracking-wide">
                  Powered by <span className="font-semibold text-blue-400">TrackNest</span> · Developed by Vaibhav Khapra
                </p>
              </div>

              {/* actions — hidden on print */}
              <div id="invoice-print-actions" className="flex gap-3 justify-center mt-6">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold transition"
                >
                  <PrintIcon size={15} />
                  Print
                </button>
                <button
                  onClick={() => setSelectedBill(null)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition"
                >
                  <CloseIcon size={15} />
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── site footer ──────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-100 py-5 text-center print:hidden">
        <p className="text-slate-400 text-sm">
          Powered by{" "}
          <span className="font-bold text-blue-600 tracking-tight">TrackNest</span>
          <span className="mx-2 text-slate-200">·</span>
          Developed by{" "}
          <span className="font-semibold text-slate-600">Vaibhav Khapra</span>
        </p>
      </footer>
    </>
  );
}