import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";

const COUNTERS = [
  { id: 1, name: "Counter 1 — South Indian", base: 8 },
  { id: 2, name: "Counter 2 — Main Course", base: 14 },
  { id: 3, name: "Counter 3 — Chinese & Extras", base: 6 },
];

const REC_CONFIG = {
  GO_NOW: {
    label: "GO NOW",
    emoji: "🟢",
    color: "#22C55E",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.25)",
    desc: "Queue is short and moving fast. Best time to head over.",
    action: "Head to the mess immediately for minimal wait.",
  },
  WAIT: {
    label: "WAIT",
    emoji: "🟡",
    color: "#EAB308",
    bg: "rgba(234,179,8,0.08)",
    border: "rgba(234,179,8,0.25)",
    desc: "Moderate queue. Leave in a bit for a much shorter wait.",
    action: "Recommend waiting before heading to the mess.",
  },
  AVOID: {
    label: "AVOID",
    emoji: "🔴",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.25)",
    desc: "Very crowded right now. Significant delays expected.",
    action: "Wait for the crowd to thin before going.",
  },
};

function CounterBar({ counter, queueCount }: { counter: typeof COUNTERS[0]; queueCount: number }) {
  const load = Math.min(100, Math.round((queueCount / 3 + counter.base) / 25 * 100));
  const color = load < 40 ? "#22C55E" : load < 70 ? "#EAB308" : "#EF4444";
  const status = load < 40 ? "Available" : load < 70 ? "Moderate" : "Busy";
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-white">{counter.name}</div>
          <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            ~{Math.round(queueCount / 3 + counter.base)} people
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: `${color}20`, color }}>
          {status}
        </span>
      </div>
      <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${load}%`, background: color }} />
      </div>
      <div className="flex justify-between mt-1.5 text-xs" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "JetBrains Mono" }}>
        <span>0</span>
        <span>{load}% capacity</span>
        <span>MAX</span>
      </div>
    </div>
  );
}

export default function QueuePage() {
  const { queueCount, waitTime, crowdLevel, recommendation, recommendedLeaveIn } = useApp();
  const [tick, setTick] = useState(0);
  const [history, setHistory] = useState<number[]>([28, 32, 35, 30, 27, 25, 28]);

  useEffect(() => {
    const t = setInterval(() => {
      setTick(v => v + 1);
      setHistory(prev => [...prev.slice(-11), queueCount]);
    }, 8000);
    return () => clearInterval(t);
  }, [queueCount]);

  const rec = REC_CONFIG[recommendation];
  const now = new Date();
  const leaveTime = new Date(now.getTime() + recommendedLeaveIn * 60000);
  const leaveStr = leaveTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  const maxH = Math.max(...history, 1);
  const chartH = 64;

  return (
    <div className="animate-slide-up space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Live Queue</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Real-time crowd & smart recommendations</p>
      </div>

      {/* Main Recommendation Card */}
      <div className="rounded-2xl p-6" style={{ background: rec.bg, border: `1px solid ${rec.border}` }}>
        <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>
          Smart Timing Recommendation
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-5xl font-extrabold mb-2" style={{ color: rec.color }}>{rec.label}</div>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{rec.desc}</p>
            <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>{rec.action}</p>
          </div>
          <div className="text-6xl flex-shrink-0">{rec.emoji}</div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl p-3 text-center" style={{ background: "rgba(0,0,0,0.2)" }}>
            <div className="text-xl font-bold" style={{ fontFamily: "JetBrains Mono", color: "#F97316" }}>{queueCount}</div>
            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>In Queue</div>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: "rgba(0,0,0,0.2)" }}>
            <div className="text-xl font-bold" style={{ fontFamily: "JetBrains Mono", color: "#EAB308" }}>~{waitTime}m</div>
            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Wait Time</div>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: "rgba(0,0,0,0.2)" }}>
            <div className="text-xl font-bold" style={{ fontFamily: "JetBrains Mono", color: rec.color }}>
              {recommendation === "GO_NOW" ? "Now" : leaveStr}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Leave At</div>
          </div>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-white">Queue Trend</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Last ~90 seconds</div>
          </div>
          <div className="text-xs px-2 py-1 rounded-lg font-mono" style={{ background: "rgba(255,255,255,0.05)", color: "#F97316" }}>
            LIVE
          </div>
        </div>
        <div className="flex items-end gap-1" style={{ height: chartH }}>
          {history.map((v, i) => {
            const h = Math.round((v / maxH) * chartH);
            const isLatest = i === history.length - 1;
            return (
              <div key={i} className="flex-1 rounded-t-sm transition-all duration-700"
                style={{
                  height: h,
                  background: isLatest ? "#F97316" : `rgba(249,115,22,${0.15 + (i / history.length) * 0.35})`,
                }} />
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "JetBrains Mono" }}>
          <span>–90s</span>
          <span>Now</span>
        </div>
      </div>

      {/* Counter Status */}
      <div>
        <div className="text-sm font-semibold text-white mb-3">Counter Status</div>
        <div className="space-y-2">
          {COUNTERS.map(c => <CounterBar key={c.id} counter={c} queueCount={queueCount} />)}
        </div>
      </div>

      {/* Peak Hours */}
      <div className="glass-card rounded-2xl p-5">
        <div className="text-sm font-semibold text-white mb-4">Tonight's Queue Forecast</div>
        <div className="space-y-2">
          {[
            { time: "8:00 PM – 9:00 PM", load: 85, label: "Peak Hour" },
            { time: "9:00 PM – 10:00 PM", load: 65, label: "High" },
            { time: "10:00 PM – 11:00 PM", load: 40, label: "Moderate" },
            { time: "11:00 PM – 12:00 AM", load: 20, label: "Low" },
            { time: "12:00 AM – 12:30 AM", load: 10, label: "Very Low" },
          ].map(slot => {
            const color = slot.load > 70 ? "#EF4444" : slot.load > 45 ? "#EAB308" : "#22C55E";
            return (
              <div key={slot.time} className="flex items-center gap-3">
                <div className="text-xs w-40 flex-shrink-0" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "JetBrains Mono" }}>{slot.time}</div>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: `${slot.load}%`, background: color }} />
                </div>
                <div className="text-xs w-16 text-right" style={{ color }}>{slot.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
