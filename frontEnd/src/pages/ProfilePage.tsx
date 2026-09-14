import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { STUDENT } from "../data/mockData";
import { api, clearAuthToken, setAuthToken } from "../services/api";

export default function ProfilePage() {
  const { orders, userProfile, refreshOrders } = useApp();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState("student@vit.ac.in");
  const [password, setPassword] = useState("password123");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const name = userProfile?.name || STUDENT.name;
  const userEmail = userProfile?.email || STUDENT.email;
  const regId = userProfile?.student_id || STUDENT.id;
  const branch = userProfile?.branch || STUDENT.branch;
  const year = userProfile?.year || STUDENT.year;
  const hostel = userProfile?.room_number
    ? `${userProfile.hostel_block || "A-Block"}, ${userProfile.room_number}`
    : STUDENT.hostel;
  const balance = userProfile?.mess_balance ?? STUDENT.messBalance;
  const avatar = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || STUDENT.avatar;

  const validOrders = orders.filter(o => o.status !== "cancelled");
  const totalSpent = validOrders.reduce((s, o) => s + o.token.amount, 0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      await api.login(email, password);
      setShowLoginModal(false);
      window.location.reload();
    } catch (err: any) {
      setAuthError(err.message || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    clearAuthToken();
    window.location.reload();
  };

  return (
    <div className="animate-slide-up space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Your student account</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>Backend Connected</span>
        </div>
      </div>

      {/* Avatar card */}
      <div className="glass-card rounded-2xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "white" }}>
          {avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xl font-bold text-white truncate">{name}</div>
          <div className="text-sm mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{userEmail}</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.15)", color: "#8B5CF6" }}>{regId}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(249,115,22,0.12)", color: "#F97316" }}>{year}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Orders", value: String(orders.length), icon: "🧾" },
          { label: "Spent", value: `₹${totalSpent}`, icon: "💸" },
          { label: "Balance", value: `₹${balance}`, icon: "💰" },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-base font-bold text-white" style={{ fontFamily: "JetBrains Mono" }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="glass-card rounded-2xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Student Details</div>
        <div className="space-y-3">
          {[
            { label: "Branch", value: branch },
            { label: "Year", value: year },
            { label: "Hostel", value: hostel },
            { label: "Registration No.", value: regId },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between text-sm py-2"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color: "rgba(255,255,255,0.45)" }}>{row.label}</span>
              <span className="font-medium text-white" style={{ fontFamily: row.label === "Registration No." ? "JetBrains Mono" : undefined }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mess preferences */}
      <div className="glass-card rounded-2xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Mess Preferences</div>
        <div className="space-y-3">
          {[
            { label: "Meal Plan", value: "Night Mess (Subscribed)", on: true },
            { label: "API Sync", value: "Live Firestore", on: true },
            { label: "Digital Tokens", value: "Active", on: true },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between text-sm py-2"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color: "rgba(255,255,255,0.45)" }}>{row.label}</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowLoginModal(true)}
          className="w-full py-3 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)" }}
        >
          Switch Account
        </button>
        <button
          onClick={handleSignOut}
          className="w-full py-3 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
          style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          Reset Session
        </button>
      </div>

      {/* Login / Switch Account Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowLoginModal(false)}>
          <div className="w-full max-w-sm rounded-3xl p-6"
            style={{ background: "#0E1420", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-white text-lg mb-1">Sign In to Hostel Mess</h3>
            <p className="text-xs text-gray-400 mb-4">Connect as student or mess staff</p>

            {authError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs mb-3">
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
                  style={{ background: "#F97316" }}
                >
                  {authLoading ? "Signing in..." : "Sign In"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
