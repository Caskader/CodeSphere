import { useState } from "react";
import { StoreProvider } from "./store";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import LiveQueue from "./pages/LiveQueue";
import MenuFood from "./pages/MenuFood";
import OrdersTokens from "./pages/OrdersTokens";
import Payments from "./pages/Payments";
import Announcements from "./pages/Announcements";
import Complaints from "./pages/Complaints";
import Analytics from "./pages/Analytics";
import CrowdPrediction from "./pages/CrowdPrediction";
import Settings from "./pages/Settings";

type Page = "dashboard" | "queue" | "menu" | "orders" | "payments" | "announcements" | "complaints" | "analytics" | "prediction" | "settings";

function AppContent() {
  const [page, setPage] = useState<Page>("dashboard");

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard onNavigate={(p) => setPage(p as Page)} />;
      case "queue": return <LiveQueue />;
      case "menu": return <MenuFood />;
      case "orders": return <OrdersTokens />;
      case "payments": return <Payments />;
      case "announcements": return <Announcements />;
      case "complaints": return <Complaints />;
      case "analytics": return <Analytics />;
      case "prediction": return <CrowdPrediction />;
      case "settings": return <Settings />;
      default: return <Dashboard onNavigate={(p) => setPage(p as Page)} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#080d1a" }}>
      <Sidebar active={page} onNavigate={(p) => setPage(p as Page)} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 border-b border-[#1a2540]" style={{ background: "#080d1a" }}>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#00e676] animate-pulse-dot" />
            <span className="text-[10px] mono text-[#5a7099] uppercase tracking-widest">LIVE</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] mono text-[#3a4d6b]">
            <span>{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
            <span>{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>

        {/* Page content */}
        <div className="p-5 max-w-7xl mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
