"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Link from "next/link";
import SalesSummary from "../components/SaleSummary";

/* ─── inline SVG icons ──────────────────────────────────────────────── */
const Icon = ({ d, size = 16, className = "", fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={2} strokeLinecap="round"
    strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);
const BoxIcon        = (p) => <Icon {...p} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />;
const LayersIcon     = (p) => <Icon {...p} d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />;
const AlertTriIcon   = (p) => <Icon {...p} d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />;
const ClockIcon      = (p) => <Icon {...p} d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zM12 6v6l4 2" />;
const PlusIcon       = (p) => <Icon {...p} d="M12 5v14M5 12h14" />;
const ReceiptIcon    = (p) => <Icon {...p} d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />;
const ArrowRightIcon = (p) => <Icon {...p} d="M5 12h14M12 5l7 7-7 7" />;

/* ─── payment badge — identical to AllBillsPage ─────────────────────── */
const PaymentBadge = ({ method }) => {
  const map = {
    cash:   "bg-emerald-100 text-emerald-700 border-emerald-200",
    card:   "bg-blue-100 text-blue-700 border-blue-200",
    upi:    "bg-violet-100 text-violet-700 border-violet-200",
    online: "bg-cyan-100 text-cyan-700 border-cyan-200",
  };
  const cls = map[(method || "cash").toLowerCase()] || "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${cls}`}>
      {method || "Cash"}
    </span>
  );
};

/* ─── stat card — mirrors AllBillsPage StatCard ─────────────────────── */
const StatCard = ({ icon, label, value, sub, accentBg, accentBlob }) => (
  <div className="relative overflow-hidden rounded-2xl p-5 bg-white border border-gray-100 shadow-sm">
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-6 translate-x-6 ${accentBlob}`} />
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${accentBg}`}>
      {icon}
    </div>
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
    <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

/* ─── skeleton ──────────────────────────────────────────────────────── */
const Skeleton = ({ className }) => (
  <div className={`animate-pulse rounded-2xl bg-gray-100 ${className}`} />
);

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState({ totalItems: 0, uniqueItems: 0, outOfStock: 0, expired: 0 });
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [expiredItems, setExpiredItems] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const [showAllBills, setShowAllBills] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingBills, setLoadingBills] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    const fetchUser = async () => {
      setLoadingUser(true);
      const email = session?.user?.email;
      if (!email) return;
      try {
        const res = await fetch("/api/profile", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        setUser(data.users);
      } catch (e) { console.error(e); }
      finally { setLoadingUser(false); }
    };
    if (status === "authenticated") fetchUser();
  }, [status, session]);

  useEffect(() => {
    if (user && !user?.shopName?.trim()) router.push("/profile");
  }, [user, router]);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoadingSummary(true);
      try {
        const res = await fetch("/api/allitems", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: session?.user?.email }),
        });
        const data = await res.json();
        if (data.success) {
          setSummary({ totalItems: data.totalItems, uniqueItems: data.uniqueItems, outOfStock: data.outOfStock, expired: data.expired });
          setOutOfStockItems(data.outOfStockItems);
          setExpiredItems(data.expiredItems);
        }
      } catch (e) { console.error(e); }
      finally { setLoadingSummary(false); }
    };
    if (session?.user?.email) fetchSummary();
  }, [session]);

  useEffect(() => {
    const fetchRecentBills = async () => {
      setLoadingBills(true);
      try {
        const res = await fetch("/api/bills/recent", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: session?.user?.email, limit: showAllBills ? null : 5 }),
        });
        const data = await res.json();
        if (data.success) setRecentBills(data.bills);
      } catch (e) { console.error(e); }
      finally { setLoadingBills(false); }
    };
    if (session?.user?.email) fetchRecentBills();
  }, [session, showAllBills]);

  if (status === "loading" || !session)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Navbar />
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading…</p>
        </div>
      </div>
    );

  const hasAlerts = outOfStockItems.length > 0 || expiredItems.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[88px] pb-20">

        {/* ── page header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-8">
          <div>
            {loadingUser ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-56" />
                <Skeleton className="h-4 w-44" />
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-1">
                  Inventory Dashboard
                </p>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                  {user?.shopName || "Your Shop"}
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  Here's your inventory overview for today.
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/additems">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold shadow-sm hover:bg-slate-50 transition">
                <PlusIcon size={15} />
                Add Item
              </button>
            </Link>
            <Link href="/createbill">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-200 transition">
                <ReceiptIcon size={15} />
                Create Bill
              </button>
            </Link>
          </div>
        </div>

        {/* ── stat cards ───────────────────────────────────────────────── */}
        {loadingSummary ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<BoxIcon size={18} className="text-blue-600" />}
              label="Total Items" value={summary.totalItems} sub="in inventory"
              accentBg="bg-blue-50" accentBlob="bg-blue-500"
            />
            <StatCard
              icon={<LayersIcon size={18} className="text-violet-600" />}
              label="Unique Items" value={summary.uniqueItems} sub="distinct items"
              accentBg="bg-violet-50" accentBlob="bg-violet-500"
            />
            <StatCard
              icon={<AlertTriIcon size={18} className="text-amber-600" />}
              label="Out of Stock" value={summary.outOfStock} sub="need restocking"
              accentBg="bg-amber-50" accentBlob="bg-amber-500"
            />
            <StatCard
              icon={<ClockIcon size={18} className="text-rose-600" />}
              label="Expired" value={summary.expired ?? 0} sub="items expired"
              accentBg="bg-rose-50" accentBlob="bg-rose-500"
            />
          </div>
        )}

        {/* ── sales summary ────────────────────────────────────────────── */}
        <div className="mb-8">
          <SalesSummary email={session.user.email} />
        </div>

        {/* ── alert panels ─────────────────────────────────────────────── */}
        {!loadingSummary && hasAlerts && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {outOfStockItems.length > 0 && (
              <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <AlertTriIcon size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Out of Stock</h3>
                    <p className="text-xs text-slate-400">Items needing restock</p>
                  </div>
                  <span className="ml-auto text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {outOfStockItems.length}
                  </span>
                </div>
                <ul className="space-y-2">
                  {outOfStockItems.map((item) => (
                    <li key={item._id} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-medium text-slate-700">{item.title}</span>
                        {item.description && (
                          <span className="text-slate-400 ml-1 text-xs">— {item.description}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {expiredItems.length > 0 && (
              <div className="bg-white border border-rose-200 rounded-2xl shadow-sm p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                    <ClockIcon size={16} className="text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Expired Items</h3>
                    <p className="text-xs text-slate-400">Past expiry date</p>
                  </div>
                  <span className="ml-auto text-xs font-bold bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200">
                    {expiredItems.length}
                  </span>
                </div>
                <ul className="space-y-2">
                  {expiredItems.map((item) => (
                    <li key={item._id} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-medium text-slate-700">{item.title}</span>
                        <span className="text-slate-400 text-xs ml-1.5">
                          Expired{" "}
                          {new Date(item.expirydate).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── recent bills ─────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-blue-600 inline-block" />
              <h2 className="text-base font-bold text-slate-800">Recent Bills</h2>
            </div>
            <button
              onClick={() => router.push("/allbills")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
            >
              View All <ArrowRightIcon size={13} />
            </button>
          </div>

          {loadingBills ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : recentBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <ReceiptIcon size={24} className="text-slate-400" />
              </div>
              <p className="text-slate-600 font-semibold text-sm">No bills yet</p>
              <p className="text-slate-400 text-xs">Create your first bill to see it here.</p>
              <Link href="/createbill">
                <button className="mt-1 text-xs text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2 transition">
                  Create bill →
                </button>
              </Link>
            </div>
          ) : (
            <>
              {/* desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      {["Date", "Customer", "Items", "Total", "Payment"].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-50">
                    {recentBills.map((bill) => (
                      <tr key={bill._id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                          {new Date(bill.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">
                          {bill.customerName || <span className="text-slate-400 italic font-normal">Walk-in</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                            {bill.items.length} {bill.items.length === 1 ? "item" : "items"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 text-sm">
                            ₹{Number(bill.totalAmount).toFixed(2)}
                          </div>
                          {bill.discount > 0 && (
                            <span className="text-xs text-rose-500">-{bill.discount}% disc</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <PaymentBadge method={bill.paymentMethod} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* mobile card list */}
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
                      <div className="mt-1">
                        <PaymentBadge method={bill.paymentMethod} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex justify-center">
                <button
                  onClick={() => router.push("/allbills")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
                >
                  View all bills <ArrowRightIcon size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ── footer ──────────────────────────────────────────────────────── */}
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