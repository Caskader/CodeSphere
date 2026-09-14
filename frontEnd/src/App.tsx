import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import Navigation from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import MenuPage from "./pages/MenuPage";
import QueuePage from "./pages/QueuePage";
import TokenPage from "./pages/TokenPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import HistoryPage from "./pages/HistoryPage";
import ProfilePage from "./pages/ProfilePage";

function AppContent() {
  const { activePage } = useApp();

  const pages: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    menu: <MenuPage />,
    queue: <QueuePage />,
    token: <TokenPage />,
    announcements: <AnnouncementsPage />,
    history: <HistoryPage />,
    profile: <ProfilePage />,
  };

  return (
    <div className="min-h-screen" style={{ background: "#080B14" }}>
      <Navigation />

      {/* Main content area */}
      <main className="lg:pl-64 pb-24 lg:pb-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-8">
          {pages[activePage] ?? <Dashboard />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
