import React from "react";
import { useApp } from "../context/AppContext";
import type { Page } from "../types";
import { STUDENT } from "../data/mockData";

const NAV_ITEMS: { id: Page; label: string; icon: string; mobileIcon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "⊞", mobileIcon: "🏠" },
  { id: "menu", label: "Menu", icon: "🍽", mobileIcon: "🍽" },
  { id: "queue", label: "Queue", icon: "⏳", mobileIcon: "⏳" },
  { id: "token", label: "My Token", icon: "🎫", mobileIcon: "🎫" },
  { id: "announcements", label: "Announcements", icon: "📢", mobileIcon: "📢" },
  { id: "history", label: "History", icon: "🕑", mobileIcon: "🕑" },
  { id: "profile", label: "Profile", icon: "👤", mobileIcon: "👤" },
];

const MOBILE_NAV: { id: Page; label: string; icon: string }[] = [
  { id: "dashboard", label: "Home", icon: "🏠" },
  { id: "menu", label: "Menu", icon: "🍽" },
  { id: "queue", label: "Queue", icon: "⏳" },
  { id: "token", label: "Token", icon: "🎫" },
  { id: "announcements", label: "More", icon: "⋯" },
];

export default function Navigation() {
  const { activePage, setActivePage, cartCount, newAnnouncementCount, messOpen } = useApp();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen fixed left-0 top-0 bottom-0 z-40"
        style={{ background: "#060910", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Logo */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}>
              🍴
            </div>
            <div>
              <div className="font-bold text-white text-sm leading-tight">VIT Night Mess</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Student Portal</div>
            </div>
          </div>
        </div>

        {/* Mess Status */}
        <div className="mx-4 mb-4 px-3 py-2.5 rounded-xl" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-glow" />
            <span className="text-xs font-semibold text-green-400">MESS OPEN</span>
            <span className="ml-auto text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>until 12:30 AM</span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const isActive = activePage === item.id;
            const badge = item.id === "announcements" ? newAnnouncementCount
              : item.id === "menu" && cartCount > 0 ? cartCount
              : 0;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative"
                style={{
                  background: isActive ? "rgba(249,115,22,0.12)" : "transparent",
                  color: isActive ? "#F97316" : "rgba(255,255,255,0.5)",
                  borderLeft: isActive ? "2px solid #F97316" : "2px solid transparent",
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                <span>{item.label}</span>
                {badge > 0 && (
                  <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                    style={{ background: item.id === "announcements" ? "#EF4444" : "#F97316", color: "white" }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Profile Footer */}
        <div className="p-4 mt-auto">
          <div className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
            onClick={() => setActivePage("profile")}
            style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "white" }}>
              {STUDENT.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{STUDENT.name.split(" ")[0]}</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{STUDENT.id}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex"
        style={{ background: "#060910", borderTop: "1px solid rgba(255,255,255,0.08)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {MOBILE_NAV.map(item => {
          const isActive = activePage === item.id ||
            (item.id === "announcements" && ["announcements", "history", "profile"].includes(activePage));
          const badge = item.id === "announcements" ? newAnnouncementCount : 0;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "announcements" && !["announcements", "history", "profile"].includes(activePage)) {
                  setActivePage("announcements");
                } else {
                  setActivePage(item.id);
                }
              }}
              className="flex-1 flex flex-col items-center gap-1 py-3 relative"
              style={{ color: isActive ? "#F97316" : "rgba(255,255,255,0.4)" }}
            >
              <span className="text-lg leading-none relative">
                {item.icon}
                {badge > 0 && (
                  <span className="absolute -top-1 -right-2 text-[9px] font-bold px-1 rounded-full"
                    style={{ background: "#EF4444", color: "white", lineHeight: "14px", minWidth: 14, textAlign: "center" }}>
                    {badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                  style={{ background: "#F97316" }} />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
