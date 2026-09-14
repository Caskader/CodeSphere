import React from "react";
import { useApp } from "../context/AppContext";
import { ANNOUNCEMENTS } from "../data/mockData";

const TYPE_STYLE: Record<string, { color: string; bg: string; icon: string }> = {
  warning: { color: "#EAB308", bg: "rgba(234,179,8,0.1)", icon: "⚠️" },
  alert: { color: "#EF4444", bg: "rgba(239,68,68,0.1)", icon: "🚨" },
  success: { color: "#22C55E", bg: "rgba(34,197,94,0.1)", icon: "✅" },
  info: { color: "#6366F1", bg: "rgba(99,102,241,0.1)", icon: "ℹ️" },
};

export default function AnnouncementsPage() {
  const { newAnnouncementCount, setNewAnnouncementCount } = useApp();

  React.useEffect(() => {
    setNewAnnouncementCount(0);
  }, [setNewAnnouncementCount]);

  return (
    <div className="animate-slide-up space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Announcements</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Mess notices, queue alerts & updates</p>
      </div>

      {/* New Badge */}
      {newAnnouncementCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>
          🔴 {newAnnouncementCount} new announcement{newAnnouncementCount > 1 ? "s" : ""} since your last visit
        </div>
      )}

      <div className="space-y-3">
        {ANNOUNCEMENTS.map(ann => {
          const style = TYPE_STYLE[ann.type] || TYPE_STYLE.info;
          return (
            <div key={ann.id} className="glass-card rounded-2xl p-4 transition-all"
              style={{ borderLeft: `3px solid ${style.color}` }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: style.bg }}>
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-white text-sm leading-snug">{ann.title}</div>
                    {ann.isNew && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: "#EF4444", color: "white" }}>NEW</span>
                    )}
                  </div>
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {ann.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
                      style={{ background: style.bg, color: style.color }}>
                      {ann.type}
                    </span>
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "JetBrains Mono" }}>{ann.time}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
