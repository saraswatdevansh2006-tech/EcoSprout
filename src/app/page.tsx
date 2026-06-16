"use client";

import React from "react";
import { useCarbonStore } from "@/store/carbon-store";
import Sidebar from "@/components/layout/Sidebar";
import MainContent from "@/components/layout/MainContent";
import AnalyticsContent from "@/components/dashboard/AnalyticsContent";
import NotificationFeed from "@/components/layout/NotificationFeed";

import AuthGate from "@/components/auth/AuthGate";

function AppContent() {
  const activeView = useCarbonStore((state) => state.activeView);
  const fetchData = useCarbonStore((state) => state.fetchData);
  const startTimeSync = useCarbonStore((state) => state.startTimeSync);

  React.useEffect(() => {
    fetchData();
    startTimeSync();
  }, [fetchData, startTimeSync]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Area */}
      {activeView === "dashboard" ? <MainContent /> : <AnalyticsContent />}

      {/* Right Notification Feed */}
      <NotificationFeed />
    </div>
  );
}

export default function Home() {
  return (
    <AuthGate>
      <AppContent />
    </AuthGate>
  );
}
