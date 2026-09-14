import { useState } from "react";
import {
  LayoutDashboard, Users, UtensilsCrossed, ClipboardList, CreditCard,
  Megaphone, MessageSquareWarning, BarChart3, Settings, Menu, X,
  ChevronRight, Wifi, WifiOff, Sparkles
} from "lucide-react";
import { useStore } from "../store";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "queue", label: "Live Queue", icon: Users },
  { id: "menu", label: "Menu & Food", icon: UtensilsCrossed },
  { id: "orders", label: "Orders & Tokens", icon: ClipboardList },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "complaints", label: "Complaints", icon: MessageSquareWarning },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "prediction", label: "Crowd Forecast", icon: Sparkles },
  { id: "settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  active: string;
  onNavigate: (page: string) => void;
}

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { state, dispatch } = useStore();

  const openComplaints = state.complaints.filter((c) => c.status === "open").length;
  const pendingOrders = state.orders.filter((o) => o.status === "pending").length;
  const unresolved = state.fraudAlerts.filter((f) => !f.resolved).length;

  const badges: Record<string, number> = {
    orders: pendingOrders,
    complaints: openComplaints,
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-20 bg-black/60 md:hidden transition-opacity ${collapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        onClick={() => setCollapsed(true)}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-30 flex flex-col h-full
          transition-all duration-200 ease-out
          ${collapsed ? "w-16" : "w-56"}
          border-r border-[#1a2540]
        `}
        style={{ background: "#090e1c" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-[#1a2540] min-h-[60px]">
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #00c8ff, #7c3aed)" }}>
                <UtensilsCrossed size={14} className="text-white" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-[#dce6f5] truncate mono">NIGHT MESS</div>
                <div className="text-[10px] text-[#5a7099] truncate mono">ADMIN PANEL</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#1a2540] text-[#5a7099] hover:text-[#dce6f5] transition-colors"
          >
            {collapsed ? <ChevronRight size={14} /> : <X size={14} />}
          </button>
        </div>

        {/* Mess status */}
        <div className={`px-3 py-2 border-b border-[#1a2540] ${collapsed ? "flex justify-center" : ""}`}>
          <button
            onClick={() => dispatch({ type: "TOGGLE_MESS", open: !state.messOpen })}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors w-full ${
              state.messOpen
                ? "bg-[#00e67620] text-[#00e676] hover:bg-[#00e67630]"
                : "bg-[#ff3d7120] text-[#ff3d71] hover:bg-[#ff3d7130]"
            } ${collapsed ? "justify-center px-1.5" : ""}`}
          >
            {state.messOpen ? <Wifi size={12} /> : <WifiOff size={12} />}
            {!collapsed && (
              <span className="mono text-[10px]">{state.messOpen ? "MESS OPEN" : "MESS CLOSED"}</span>
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            const badge = badges[id];
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`
                  w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs
                  transition-all duration-150 group relative
                  ${isActive
                    ? "bg-[#00c8ff15] text-[#00c8ff] font-medium"
                    : "text-[#5a7099] hover:text-[#a0b4cc] hover:bg-[#1a254015]"
                  }
                  ${collapsed ? "justify-center" : ""}
                `}
              >
                <Icon
                  size={15}
                  className={`flex-shrink-0 ${isActive ? "text-[#00c8ff]" : "text-[#3a4d6b] group-hover:text-[#5a7099]"}`}
                />
                {!collapsed && (
                  <span className="font-medium">{label}</span>
                )}
                {!collapsed && badge && badge > 0 && (
                  <span className="ml-auto flex items-center justify-center w-4 h-4 rounded-full bg-[#ff3d71] text-white text-[9px] font-bold mono">
                    {badge}
                  </span>
                )}
                {collapsed && badge && badge > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ff3d71]" />
                )}
                {isActive && (
                  <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r-full bg-[#00c8ff]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="px-3 py-3 border-t border-[#1a2540]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#1a2540] flex items-center justify-center">
                <span className="text-[10px] font-bold text-[#00c8ff] mono">AD</span>
              </div>
              <div>
                <div className="text-[10px] font-medium text-[#a0b4cc]">Admin</div>
                <div className="text-[9px] text-[#3a4d6b] mono">mess-admin@univ.edu</div>
              </div>
            </div>
            {unresolved > 0 && (
              <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded bg-[#ff3d7115] text-[#ff3d71] text-[10px] mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff3d71] animate-pulse-dot" />
                {unresolved} FRAUD ALERT{unresolved > 1 ? "S" : ""}
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
