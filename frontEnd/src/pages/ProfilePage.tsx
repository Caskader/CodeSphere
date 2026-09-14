import React from "react";
import { useApp } from "../context/AppContext";
import { STUDENT } from "../data/mockData";

export default function ProfilePage() {
  const { orders } = useApp();
  const totalSpent = orders.reduce((s, o) => s + o.token.amount, 0);

  return (
    <div className="animate-slide-up space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Your student account</p>
      </div>

      {/* Avatar card */}
      <div className="glass-card rounded-2xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "white" }}>
          {STUDENT.avatar}
        </div>
        <div>
          <div className="text-xl font-bold text-white">{STUDENT.name}</div>
          <div className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{STUDENT.email}</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.15)", color: "#8B5CF6" }}>{STUDENT.id}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(249,115,22,0.12)", color: "#F97316" }}>{STUDENT.year}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Orders", value: String(orders.length), icon: "🧾" },
          { label: "Spent", value: `₹${totalSpent}`, icon: "💸" },
          { label: "Balance", value: `₹${STUDENT.messBalance}`, icon: "💰" },
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
            { label: "Branch", value: STUDENT.branch },
            { label: "Year", value: STUDENT.year },
            { label: "Hostel", value: STUDENT.hostel },
            { label: "Registration No.", value: STUDENT.id },
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
            { label: "Notifications", value: "Enabled", on: true },
            { label: "Queue Alerts", value: "Enabled", on: true },
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

      <button className="w-full py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
        Sign Out
      </button>
    </div>
  );
}
