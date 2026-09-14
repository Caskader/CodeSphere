import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { STUDENT, ANNOUNCEMENTS } from "../data/mockData";

const CROWD_CONFIG = {
  low: { label: "Low", color: "#22C55E", bg: "rgba(34,197,94,0.12)", bar: 20 },
  moderate: { label: "Moderate", color: "#EAB308", bg: "rgba(234,179,8,0.12)", bar: 50 },
  high: { label: "High", color: "#F97316", bg: "rgba(249,115,22,0.12)", bar: 75 },
  packed: { label: "Packed!", color: "#EF4444", bg: "rgba(239,68,68,0.12)", bar: 95 },
};

const REC_CONFIG = {
  GO_NOW: { label: "GO NOW", emoji: "🟢", color: "#22C55E", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)", glow: "green-glow" },
  WAIT: { label: "WAIT", emoji: "🟡", color: "#EAB308", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.3)", glow: "" },
  AVOID: { label: "AVOID", emoji: "🔴", color: "#EF4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", glow: "" },
};

function StatCard({ title, value, sub, accent }: { title: string; value: string; sub: string; accent?: string }) {
  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>{title}</span>
      <span className="text-3xl font-bold" style={{ color: accent || "#E8EAF0", fontFamily: "JetBrains Mono, monospace" }}>{value}</span>
      <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{sub}</span>
    </div>
  );
}

export default function Dashboard() {
  const {
    queueCount, waitTime, crowdLevel,
    recommendation, recommendedLeaveIn,
    setActivePage, menuItems, activeToken, userProfile
  } = useApp();

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const crowd = CROWD_CONFIG[crowdLevel];
  const rec = REC_CONFIG[recommendation];
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  const leaveTime = new Date(now.getTime() + recommendedLeaveIn * 60000);
  const leaveTimeStr = leaveTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  const reasonText = recommendation === "GO_NOW"
    ? "Queue is short — ideal time to head over."
    : recommendation === "WAIT"
    ? `Leave in ~${recommendedLeaveIn} min for a shorter queue.`
    : "Very crowded right now. Recommended to wait it out.";

  const studentName = userProfile?.name || STUDENT.name;
  const studentId = userProfile?.student_id || STUDENT.id;
  const studentBranch = userProfile?.branch || STUDENT.branch;

  // Live Highlights from backend menu
  const highlights = menuItems.slice(0, 4).map(item => ({
    emoji: item.emoji,
    name: item.name,
    price: item.price,
    note: item.status === "limited" ? "Limited" : item.status === "unavailable" ? "Sold Out" : `₹${item.price}`,
  }));

  return (
    <div className="animate-slide-up space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{dateStr}</div>
          <h1 className="text-2xl font-bold text-white">
            Good {now.getHours() < 12 ? "Morning" : now.getHours() < 17 ? "Afternoon" : "Evening"}, {studentName.split(" ")[0]} 👋
          </h1>
          <div className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{studentId} · {studentBranch}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ fontFamily: "JetBrains Mono, monospace", color: "#E8EAF0" }}>{timeStr}</div>
          <div className="flex items-center gap-1.5 justify-end mt-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold text-green-400">MESS OPEN</span>
          </div>
        </div>
      </div>

      {/* Active Order Banner if token exists */}
      {activeToken && activeToken.status !== "cancelled" && (
        <div
          onClick={() => setActivePage("token")}
          className="rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-transform hover:scale-[1.01]"
          style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.2), rgba(234,88,12,0.1))", border: "1px solid rgba(249,115,22,0.3)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(249,115,22,0.2)" }}>
              🎫
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Active Meal Token: {activeToken.id}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold"
                  style={{ background: "#F97316", color: "white" }}>
                  Counter #{activeToken.counter}
                </span>
              </div>
              <div className="text-xs text-orange-200/70 mt-0.5">
                {activeToken.items.length} item{activeToken.items.length > 1 ? "s" : ""} · ₹{activeToken.amount} · Tap to show QR code
              </div>
            </div>
          </div>
          <span className="text-sm font-bold text-orange-400">View →</span>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Live Queue" value={String(queueCount)} sub="people in mess" accent="#F97316" />
        <StatCard title="Wait Time" value={`~${waitTime}m`} sub="estimated" accent="#EAB308" />
        <StatCard title="Crowd Level" value={crowd.label} sub="current density" accent={crowd.color} />
        <StatCard title="Mess Closes" value="12:30 AM" sub="tonight (extended)" accent="#22C55E" />
      </div>

      {/* Smart Timing — Hero Card */}
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${rec.border}`, background: rec.bg }}>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>
              Leave at the Right Time
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl font-extrabold" style={{ color: rec.color }}>{rec.label}</span>
              </div>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{reasonText}</p>
              {recommendation !== "GO_NOW" && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)" }}>
                  ⏰ Recommended leave time: <strong style={{ color: rec.color }}>{leaveTimeStr}</strong>
                </div>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-5xl mb-1">{rec.emoji}</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "JetBrains Mono, monospace" }}>
                {queueCount} in queue
              </div>
            </div>
          </div>

          {/* Queue bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              <span>Queue capacity</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{crowd.bar}%</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${crowd.bar}%`, background: rec.color }} />
            </div>
          </div>
        </div>

        <div className="px-5 py-3 flex gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => setActivePage("queue")}
            className="text-xs font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer"
            style={{ background: rec.color, color: "white" }}>
            View Full Queue
          </button>
          <button
            onClick={() => setActivePage("menu")}
            className="text-xs font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}>
            Order Now
          </button>
        </div>
      </div>

      {/* Today's Menu Highlights + Announcements */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Menu Highlights from Live Backend */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Tonight's Highlights</h2>
            <button onClick={() => setActivePage("menu")} className="text-xs font-medium cursor-pointer" style={{ color: "#F97316" }}>
              Full menu →
            </button>
          </div>
          <div className="space-y-2.5">
            {highlights.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-2xl">{item.emoji}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{item.name}</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: item.note === "Limited" ? "rgba(234,179,8,0.15)" : "rgba(34,197,94,0.12)",
                    color: item.note === "Limited" ? "#EAB308" : "#22C55E",
                  }}>
                  {item.note}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Announcement */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Latest Notices</h2>
            <button onClick={() => setActivePage("announcements")} className="text-xs font-medium cursor-pointer" style={{ color: "#F97316" }}>
              All →
            </button>
          </div>
          <div className="space-y-3">
            {ANNOUNCEMENTS.slice(0, 3).map(ann => {
              const typeColor = ann.type === "warning" ? "#EAB308" : ann.type === "alert" ? "#EF4444" : ann.type === "success" ? "#22C55E" : "#6366F1";
              return (
                <div key={ann.id} className="flex gap-2.5">
                  <div className="w-1 rounded-full flex-shrink-0 mt-1" style={{ height: "calc(100% - 4px)", background: typeColor, minHeight: 32 }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-semibold text-white leading-snug">{ann.title}</div>
                      {ann.isNew && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: "#EF4444", color: "white" }}>NEW</span>}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{ann.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mess Balance */}
      <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
        <div>
          <div className="text-xs font-medium mb-1 uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Mess Wallet</div>
          <div className="text-2xl font-bold text-white">₹{(userProfile?.mess_balance ?? STUDENT.messBalance).toLocaleString("en-IN")}</div>
          <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Available balance</div>
        </div>
        <button
          onClick={() => setActivePage("menu")}
          className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
          style={{ background: "linear-gradient(135deg, #F97316, #EA580C)", color: "white" }}>
          Order Food
        </button>
      </div>
    </div>
  );
}
