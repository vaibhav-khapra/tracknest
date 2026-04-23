// app/create-bill/page.jsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

/* ─── inline SVG icons ──────────────────────────────────────────────── */
const Icon = ({ d, size = 16, className = "", fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={2} strokeLinecap="round"
    strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);
const SearchIcon  = (p) => <Icon {...p} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />;
const PlusIcon    = (p) => <Icon {...p} d="M12 5v14M5 12h14" />;
const TrashIcon   = (p) => <Icon {...p} d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />;
const SaveIcon    = (p) => <Icon {...p} d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8" />;
const PrintIcon   = (p) => <Icon {...p} d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />;
const ArrowRight  = (p) => <Icon {...p} d="M5 12h14M12 5l7 7-7 7" />;
const ChevronUp   = (p) => <Icon {...p} d="M18 15l-6-6-6 6" />;
const ChevronDown = (p) => <Icon {...p} d="M6 9l6 6 6-6" />;
const UserIcon    = (p) => <Icon {...p} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />;
const TagIcon     = (p) => <Icon {...p} d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01" />;
const ReceiptIcon = (p) => <Icon {...p} d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />;
const ClearIcon   = (p) => <Icon {...p} d="M18 6 6 18M6 6l12 12" />;

/* ─── payment badge (shared style) ─────────────────────────────────── */
const PaymentBadge = ({ method }) => {
  const map = {
    cash:       "bg-emerald-100 text-emerald-700 border-emerald-200",
    card:       "bg-blue-100 text-blue-700 border-blue-200",
    upi:        "bg-violet-100 text-violet-700 border-violet-200",
    netbanking: "bg-cyan-100 text-cyan-700 border-cyan-200",
  };
  const cls = map[(method || "cash").toLowerCase()] || "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${cls}`}>
      {method || "Cash"}
    </span>
  );
};

/* ─── skeleton ──────────────────────────────────────────────────────── */
const Skeleton = ({ className }) => (
  <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
);

/* ─── section card wrapper ──────────────────────────────────────────── */
const Card = ({ children, className = "" }) => (
  <div className={`bg-white border border-slate-100 rounded-2xl shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ title, icon, action }) => (
  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="w-1 h-5 rounded-full bg-blue-600 inline-block" />
      <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
        {icon}{title}
      </div>
    </div>
    {action}
  </div>
);

export default function CreateBill() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchRef = useRef(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [billItems, setBillItems] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState(0);
  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [recentBills, setRecentBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(true);
  const [showSummary, setShowSummary] = useState(true);
  const [hasDraft, setHasDraft] = useState(false);

  /* ── auth guard ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  /* ── load draft ─────────────────────────────────────────────────── */
  useEffect(() => {
    const savedDraft = localStorage.getItem("billDraft");
    if (savedDraft) {
      try {
        const { items, customer, phone, discount: d, cgst: c, sgst: s, notes: n, paymentMethod: pm } = JSON.parse(savedDraft);
        setBillItems(items || []);
        setCustomerName(customer || "");
        setCustomerPhone(phone || "");
        setDiscount(d || 0);
        setCgst(c || 0);
        setSgst(s || 0);
        setNotes(n || "");
        setPaymentMethod(pm || "cash");
        setHasDraft(true);
      } catch (_) {}
    }
  }, []);

  /* ── recent bills ───────────────────────────────────────────────── */
  useEffect(() => {
    const fetchRecentBills = async () => {
      setLoadingBills(true);
      try {
        const res = await fetch("/api/bills/recent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: session?.user?.email, limit: 5 }),
        });
        const data = await res.json();
        if (data.success) setRecentBills(data.bills);
      } catch (_) {}
      finally { setLoadingBills(false); }
    };
    if (session?.user?.email) fetchRecentBills();
  }, [session, billItems]);

  /* ── search ─────────────────────────────────────────────────────── */
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch("/api/search-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, ownerEmail: session?.user?.email }),
      });
      const data = await res.json();
      setResults(data.items || []);
      if (!data.items?.length) toast.error("No items found");
    } catch (_) {
      toast.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  /* ── bill operations ────────────────────────────────────────────── */
  const addItemToBill = (item) => {
    setBillItems((prev) => {
      const exists = prev.find((i) => i._id === item._id);
      if (exists) {
        setTimeout(() => toast("Item already in bill", { icon: "ℹ️" }), 0);
        return prev;
      }
      setTimeout(() => toast.success(`${item.title} added`), 0);
      return [...prev, { ...item, quantity: 1 }];
    });
    setQuery("");
    setResults([]);
  };

  const updateQuantity = (id, quantity) => {
    const qty = Math.max(1, Number(quantity));
    setBillItems((prev) => prev.map((item) => item._id === id ? { ...item, quantity: qty } : item));
  };

  const updatePrice = (id, price) => {
    const p = Math.max(0, Number(price));
    setBillItems((prev) => prev.map((item) => item._id === id ? { ...item, price: p } : item));
  };

  const removeItem = (id) => {
    setBillItems((prev) => {
      const next = prev.filter((i) => i._id !== id);
      if (next.length !== prev.length) toast.success("Item removed");
      return next;
    });
  };

  /* ── calculations ───────────────────────────────────────────────── */
  const subtotal = billItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discount) / 100;
  const cgstAmount = (subtotal * cgst) / 100;
  const sgstAmount = (subtotal * sgst) / 100;
  const totalAmount = subtotal - discountAmount + cgstAmount + sgstAmount;

  /* ── draft ──────────────────────────────────────────────────────── */
  const saveDraft = () => {
    localStorage.setItem("billDraft", JSON.stringify({
      items: billItems, customer: customerName, phone: customerPhone,
      discount, cgst, sgst, notes, paymentMethod,
      createdAt: new Date().toISOString(),
    }));
    setHasDraft(true);
    toast.success("Draft saved");
  };

  const clearAll = () => {
    localStorage.removeItem("billDraft");
    setBillItems([]);
    setCustomerName("");
    setCustomerPhone("");
    setDiscount(0);
    setCgst(0);
    setSgst(0);
    setNotes("");
    setPaymentMethod("cash");
    setHasDraft(false);
    toast.success("Cleared");
  };

  /* ── generate bill ──────────────────────────────────────────────── */
  const generateBill = async () => {
    if (!billItems.length) { toast.error("Add at least one item"); return; }
    try {
      const res = await fetch("/api/create-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: billItems, customerName, customerPhone,
          discount, cgst, sgst, totalAmount, paymentMethod, notes,
          ownerEmail: session?.user?.email,
        }),
      });
      if (res.ok) {
        toast.success("Bill generated successfully! 🎉");
        clearAll();
      } else {
        toast.error("Failed to generate bill");
      }
    } catch (_) {
      toast.error("Error generating bill");
    }
  };

  if (status === "loading" || !session)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading…</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[88px] pb-20">

        {/* ── page header ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">Billing</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">Create New Bill</h1>
            <p className="text-slate-500 text-sm mt-1">Search items, set quantities and generate invoice.</p>
          </div>
          <div className="flex items-center gap-3">
            {hasDraft && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                Draft loaded
              </span>
            )}
            <button onClick={saveDraft}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold shadow-sm hover:bg-slate-50 transition">
              <SaveIcon size={15} /> Save Draft
            </button>
            <button onClick={clearAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-semibold hover:bg-rose-100 transition">
              <ClearIcon size={15} /> Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT COLUMN ──────────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-5">

            {/* Customer Info */}
            <Card>
              <CardHeader title="Customer Details" icon={<UserIcon size={14} className="text-slate-500" />} />
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    placeholder="Walk-in customer"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 00000 00000"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["cash", "card", "upi", "netbanking"].map((m) => (
                      <button
                        key={m}
                        onClick={() => setPaymentMethod(m)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border capitalize transition ${
                          paymentMethod === m
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Notes
                  </label>
                  <textarea
                    placeholder="Optional note for this bill…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition resize-none"
                  />
                </div>
              </div>
            </Card>

            {/* Search Items */}
            <Card>
              <CardHeader title="Add Items" icon={<SearchIcon size={14} className="text-slate-500" />} />
              <div className="p-5">
                <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      ref={searchRef}
                      type="text"
                      placeholder="Search by item name…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                    />
                  </div>
                  <button type="submit" disabled={isSearching}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition shadow-sm shadow-blue-200">
                    {isSearching ? "…" : "Go"}
                  </button>
                </form>

                {results.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                      {results.map((item) => (
                        <li key={item._id}
                          className="flex justify-between items-center p-3 hover:bg-blue-50/40 transition group">
                          <div className="min-w-0 mr-2">
                            <p className="font-semibold text-slate-800 text-sm truncate">{item.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              ₹{item.price} · Exp: {new Date(item.expirydate).toLocaleDateString("en-IN")} · Qty: {item.quantity}
                            </p>
                          </div>
                          <button onClick={() => addItemToBill(item)}
                            className="w-8 h-8 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white flex items-center justify-center transition shrink-0">
                            <PlusIcon size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {results.length === 0 && query && !isSearching && (
                  <p className="text-center text-slate-400 text-sm py-4">No results — try a different name</p>
                )}
              </div>
            </Card>
          </div>

          {/* ── RIGHT COLUMN ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Bill Items Table */}
            <Card>
              <CardHeader
                title={`Bill Items ${billItems.length > 0 ? `(${billItems.length})` : ""}`}
                icon={<TagIcon size={14} className="text-slate-500" />}
                action={
                  billItems.length > 0 && (
                    <span className="text-xs text-slate-400 font-medium">
                      Subtotal: <span className="text-slate-700 font-bold">₹{subtotal.toFixed(2)}</span>
                    </span>
                  )
                }
              />

              {billItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        {["Item", "Unit Price", "Qty", "Total", ""].map((h, i) => (
                          <th key={i} className={`px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${i > 0 ? "text-right" : "text-left"}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {billItems.map((item) => (
                        <tr key={item._id} className="hover:bg-blue-50/30 transition group">
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-slate-800">{item.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Exp: {new Date(item.expirydate).toLocaleDateString("en-IN")}
                            </p>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {/* editable unit price */}
                            <div className="flex items-center justify-end">
                              <span className="text-slate-400 text-xs mr-1">₹</span>
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={item.price}
                                onChange={(e) => updatePrice(item._id, e.target.value)}
                                className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-right text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
                              />
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition">
                                −
                              </button>
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item._id, e.target.value)}
                                className="w-12 border border-slate-200 rounded-lg px-1 py-1 text-center text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
                              />
                              <button onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition">
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button onClick={() => removeItem(item._id)}
                              className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 flex items-center justify-center opacity-60 group-hover:opacity-100 transition ml-auto">
                              <TrashIcon size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <ReceiptIcon size={24} className="text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-semibold text-sm">No items added yet</p>
                  <p className="text-slate-400 text-xs">Search and add items from the left panel</p>
                </div>
              )}
            </Card>

            {/* Bill Summary */}
            {billItems.length > 0 && (
              <Card>
                <button
                  onClick={() => setShowSummary((v) => !v)}
                  className="w-full px-5 py-4 border-b border-slate-100 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full bg-blue-600 inline-block" />
                    <span className="font-bold text-slate-800 text-sm">Bill Summary</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-600 font-extrabold text-lg">
                      ₹{totalAmount.toFixed(2)}
                    </span>
                    {showSummary ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </button>

                {showSummary && (
                  <div className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      {/* Discount */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                          Discount %
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min={0} max={100} value={discount}
                            onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-center font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
                          />
                          <span className="text-slate-400 text-sm">%</span>
                        </div>
                        <p className="text-xs text-rose-500 font-semibold mt-1.5 text-right">
                          -₹{discountAmount.toFixed(2)}
                        </p>
                      </div>

                      {/* CGST */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                          CGST %
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min={0} max={100} value={cgst}
                            onChange={(e) => setCgst(Math.min(100, Math.max(0, Number(e.target.value))))}
                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-center font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
                          />
                          <span className="text-slate-400 text-sm">%</span>
                        </div>
                        <p className="text-xs text-emerald-600 font-semibold mt-1.5 text-right">
                          +₹{cgstAmount.toFixed(2)}
                        </p>
                      </div>

                      {/* SGST */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                          SGST %
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min={0} max={100} value={sgst}
                            onChange={(e) => setSgst(Math.min(100, Math.max(0, Number(e.target.value))))}
                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-center font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
                          />
                          <span className="text-slate-400 text-sm">%</span>
                        </div>
                        <p className="text-xs text-emerald-600 font-semibold mt-1.5 text-right">
                          +₹{sgstAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* totals breakdown */}
                    <div className="space-y-2 text-sm border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                      <div className="flex justify-between text-slate-500">
                        <span>Subtotal</span>
                        <span className="font-medium text-slate-700">₹{subtotal.toFixed(2)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-rose-500">
                          <span>Discount ({discount}%)</span>
                          <span className="font-medium">-₹{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {cgst > 0 && (
                        <div className="flex justify-between text-slate-500">
                          <span>CGST ({cgst}%)</span>
                          <span className="font-medium text-slate-700">+₹{cgstAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {sgst > 0 && (
                        <div className="flex justify-between text-slate-500">
                          <span>SGST ({sgst}%)</span>
                          <span className="font-medium text-slate-700">+₹{sgstAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-base text-slate-900">
                        <span>Grand Total</span>
                        <span className="text-blue-600 text-xl">₹{totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="pt-1">
                        <span className="text-xs text-slate-400">Payment: </span>
                        <PaymentBadge method={paymentMethod} />
                      </div>
                    </div>

                    {/* actions */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-5">
                      <button onClick={saveDraft}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition shadow-sm">
                        <SaveIcon size={15} /> Save Draft
                      </button>
                      <button onClick={generateBill}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-200 transition">
                        <PrintIcon size={15} /> Generate Bill
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Recent Bills */}
            <Card>
              <CardHeader
                title="Recent Bills"
                icon={<ReceiptIcon size={14} className="text-slate-500" />}
                action={
                  <button onClick={() => router.push("/allbills")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition">
                    View All <ArrowRight size={13} />
                  </button>
                }
              />

              {loadingBills ? (
                <div className="p-5 space-y-3">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : recentBills.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-6">
                  <ReceiptIcon size={28} className="text-slate-300" />
                  <p className="text-slate-400 text-sm">No recent bills</p>
                </div>
              ) : (
                <>
                  {/* desktop */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full text-sm divide-y divide-slate-100">
                      <thead className="bg-slate-50">
                        <tr>
                          {["Date", "Customer", "Items", "Total", "Payment"].map((h) => (
                            <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-50">
                        {recentBills.map((bill) => (
                          <tr key={bill._id} className="hover:bg-blue-50/40 transition">
                            <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                              {new Date(bill.createdAt).toLocaleString("en-IN", {
                                day: "2-digit", month: "short", year: "numeric",
                                hour: "2-digit", minute: "2-digit", hour12: true,
                                timeZone: "Asia/Kolkata",
                              })}
                            </td>
                            <td className="px-5 py-3.5 font-medium text-slate-800">
                              {bill.customerName || <span className="text-slate-400 italic font-normal">Walk-in</span>}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                                {bill.items.length} items
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-slate-900">₹{Number(bill.totalAmount).toFixed(2)}</div>
                              {bill.discount > 0 && <span className="text-xs text-rose-500">-{bill.discount}%</span>}
                            </td>
                            <td className="px-5 py-3.5">
                              <PaymentBadge method={bill.paymentMethod} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* mobile */}
                  <div className="sm:hidden divide-y divide-slate-100">
                    {recentBills.map((bill) => (
                      <div key={bill._id} className="px-5 py-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">
                            {bill.customerName || "Walk-in"}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(bill.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                            {" · "}{bill.items.length} items
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-slate-900 text-sm">₹{Number(bill.totalAmount).toFixed(2)}</p>
                          <div className="mt-1"><PaymentBadge method={bill.paymentMethod} /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* ── footer ──────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-100 py-5 text-center">
        <p className="text-slate-400 text-sm">
          Powered by{" "}
          <span className="font-bold text-blue-600 tracking-tight">TrackNest</span>
          <span className="mx-2 text-slate-200">·</span>
          Developed by{" "}
          <span className="font-semibold text-slate-600">Vaibhav Khapra</span>
        </p>
      </footer>
    </div>
  );
}