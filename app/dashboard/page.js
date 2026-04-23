"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Link from "next/link";
import SalesSummary from "../components/SaleSummary";

/* ─── inline SVG icons ──────────────────────────────────────────────── */
const Icon = ({ d, size = 18, className = "", fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"
    strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);
const BoxIcon      = (p) => <Icon {...p} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />;
const LayersIcon   = (p) => <Icon {...p} d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />;
const AlertIcon    = (p) => <Icon {...p} d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />;
const ClockIcon    = (p) => <Icon {...p} d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zM12 6v6l4 2" />;
const PlusIcon     = (p) => <Icon {...p} d="M12 5v14M5 12h14" />;
const ReceiptIcon  = (p) => <Icon {...p} d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />;
const ArrowRightIcon = (p) => <Icon {...p} d="M5 12h14M12 5l7 7-7 7" />;
const SparkleIcon  = (p) => <Icon {...p} d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" fill="currentColor" />;

/* ─── payment badge ─────────────────────────────────────────────────── */
const PayBadge = ({ method }) => {
  const m = (method || "cash").toLowerCase();
  const styles = {
    cash:   "bg-emerald-900/30 text-emerald-400 border-emerald-700/40",
    card:   "bg-blue-900/30 text-blue-400 border-blue-700/40",
    upi:    "bg-violet-900/30 text-violet-400 border-violet-700/40",
    online: "bg-cyan-900/30 text-cyan-400 border-cyan-700/40",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${styles[m] || "bg-slate-800 text-slate-400 border-slate-600"}`}>
      {method || "Cash"}
    </span>
  );
};

/* ─── stat card ─────────────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, accent, delay = "0ms" }) => (
  <div
    className="relative overflow-hidden rounded-2xl border p-5 flex flex-col gap-3 group hover:-translate-y-0.5 transition-all duration-300"
    style={{
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      borderColor: "#1e293b",
      animationDelay: delay,
    }}
  >
    {/* glow blob */}
    <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity ${accent}`} />

    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent} bg-opacity-15`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-0.5">{label}</p>
      <p className="text-3xl font-black text-white tabular-nums">{value}</p>
    </div>
  </div>
);

/* ─── section heading ───────────────────────────────────────────────── */
const SectionHeading = ({ children, action }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
      <span className="w-1 h-4 rounded-full bg-indigo-500 inline-block" />
      {children}
    </h2>
    {action}
  </div>
);

/* ─── skeleton ──────────────────────────────────────────────────────── */
const Skeleton = ({ className }) => (
  <div className={`animate-pulse rounded-xl bg-slate-800 ${className}`} />
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading TrackNest…</p>
        </div>
      </div>
    );

  const hasAlerts = outOfStockItems.length > 0 || expiredItems.length > 0;

  return (
    <div className="min-h-screen bg-slate-950" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      {/* Google font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,600;0,9..40,800;0,9..40,900;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');`}</style>

      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-[88px] pb-20">

        {/* ── hero greeting ──────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl mb-8 mt-6 px-8 py-10"
          style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 60%, #0c1a3a 100%)" }}>
          {/* decorative rings */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border border-indigo-500/10" />
          <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full border border-indigo-500/10" />
          <div className="absolute top-4 right-20 w-2 h-2 rounded-full bg-indigo-400 opacity-60" />
          <div className="absolute top-10 right-10 w-1 h-1 rounded-full bg-violet-400 opacity-80" />

          {loadingUser ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-40" />
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <SparkleIcon size={14} className="text-indigo-400" />
                <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                  Dashboard
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Welcome back,<br />
                <span className="text-indigo-400">{user?.shopName || "Your Shop"}</span>
              </h1>
              <p className="text-slate-400 text-sm">
                Here's your inventory snapshot for today.
              </p>
            </div>
          )}

          {/* quick actions */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/additems">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-900/40 transition">
                <PlusIcon size={15} />
                Add Item
              </button>
            </Link>
            <Link href="/createbill">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-semibold transition backdrop-blur-sm">
                <ReceiptIcon size={15} />
                Create Bill
              </button>
            </Link>
          </div>
        </div>

        {/* ── stat cards ─────────────────────────────────────────────── */}
        {loadingSummary ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<BoxIcon size={20} className="text-blue-400" />}
              label="Total Items" value={summary.totalItems}
              accent="bg-blue-500" delay="0ms"
            />
            <StatCard
              icon={<LayersIcon size={20} className="text-violet-400" />}
              label="Unique Items" value={summary.uniqueItems}
              accent="bg-violet-500" delay="60ms"
            />
            <StatCard
              icon={<AlertIcon size={20} className="text-amber-400" />}
              label="Out of Stock" value={summary.outOfStock}
              accent="bg-amber-500" delay="120ms"
            />
            <StatCard
              icon={<ClockIcon size={20} className="text-rose-400" />}
              label="Expired" value={summary.expired ?? 0}
              accent="bg-rose-500" delay="180ms"
            />
          </div>
        )}

        {/* ── sales summary component ────────────────────────────────── */}
        <div className="mb-8">
          <SalesSummary email={session.user.email} />
        </div>

        {/* ── alert panels ───────────────────────────────────────────── */}
        {!loadingSummary && hasAlerts && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {outOfStockItems.length > 0 && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
                    <AlertIcon size={16} className="text-amber-400" />
                  </div>
                  <h3 className="font-bold text-amber-300 text-sm">Out of Stock</h3>
                  <span className="ml-auto text-xs font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                    {outOfStockItems.length}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {outOfStockItems.map((item) => (
                    <li key={item._id} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-amber-200 font-medium">{item.title}</span>
                      {item.description && (
                        <span className="text-amber-500/70 truncate">— {item.description}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {expiredItems.length > 0 && (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center">
                    <ClockIcon size={16} className="text-rose-400" />
                  </div>
                  <h3 className="font-bold text-rose-300 text-sm">Expired Items</h3>
                  <span className="ml-auto text-xs font-bold bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full">
                    {expiredItems.length}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {expiredItems.map((item) => (
                    <li key={item._id} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <div>
                        <span className="text-rose-200 font-medium">{item.title}</span>
                        <span className="text-rose-500/70 text-xs ml-2">
                          Expired {new Date(item.expirydate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── recent bills ───────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-slate-800">
            <SectionHeading
              action={
                <button
                  onClick={() => router.push("/allbills")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                >
                  View All <ArrowRightIcon size={13} />
                </button>
              }
            >
              Recent Bills
            </SectionHeading>
          </div>

          {loadingBills ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : recentBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center">
                <ReceiptIcon size={24} className="text-slate-600" />
              </div>
              <p className="text-slate-400 text-sm font-medium">No bills yet</p>
              <Link href="/createbill">
                <button className="mt-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 transition">
                  Create your first bill →
                </button>
              </Link>
            </div>
          ) : (
            <>
              {/* desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {["Date", "Customer", "Items", "Total", "Payment"].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recentBills.map((bill) => (
                      <tr key={bill._id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="px-6 py-4 text-slate-400 whitespace-nowrap font-mono text-xs">
                          {new Date(bill.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-200">
                          {bill.customerName || <span className="text-slate-500 italic font-normal">Walk-in</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-800 text-slate-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                            {bill.items.length} {bill.items.length === 1 ? "item" : "items"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-white">
                            ₹{Number(bill.totalAmount).toFixed(2)}
                          </div>
                          {bill.discount > 0 && (
                            <span className="text-xs text-rose-400">{bill.discount}% off</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <PayBadge method={bill.paymentMethod} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* mobile cards */}
              <div className="sm:hidden divide-y divide-slate-800">
                {recentBills.map((bill) => (
                  <div key={bill._id} className="px-5 py-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-200 text-sm truncate">
                        {bill.customerName || "Walk-in"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">
                        {new Date(bill.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                        {" · "}{bill.items.length} items
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-white text-sm">₹{Number(bill.totalAmount).toFixed(2)}</p>
                      <PayBadge method={bill.paymentMethod} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 border-t border-slate-800 flex justify-center">
                <button
                  onClick={() => router.push("/allbills")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition"
                >
                  View all bills <ArrowRightIcon size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ── footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-5 text-center">
        <p className="text-slate-600 text-sm">
          Powered by{" "}
          <span className="font-bold text-indigo-400 tracking-tight">TrackNest</span>
          <span className="mx-2 text-slate-700">·</span>
          Developed by{" "}
          <span className="font-semibold text-slate-400">Vaibhav Khapra</span>
        </p>
      </footer>
    </div>
  );
}