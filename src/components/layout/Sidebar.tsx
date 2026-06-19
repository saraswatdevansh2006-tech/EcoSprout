"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCarbonStore, HealthState } from "@/store/carbon-store";
import {
  HiOutlineHome,
  HiOutlineCog6Tooth,
  HiOutlineChartBar,
  HiOutlineBell,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import { PiPlantFill } from "react-icons/pi";
import PushManager from "./PushManager";

/* ─── Nav Item Component ─── */
function NavItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
        active
          ? "bg-white/[0.08] text-[var(--text-primary)]"
          : "text-[var(--text-muted)] hover:bg-white/[0.04] hover:text-[var(--text-secondary)]"
      }`}
    >
      <span className={`text-xl ${active ? "text-emerald-400" : ""}`}>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

/* ─── Health Badge ─── */
function HealthBadge({ state }: { state: HealthState }) {
  const config = {
    thriving: {
      label: "Thriving",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      dot: "bg-emerald-400",
    },
    struggling: {
      label: "Struggling",
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      dot: "bg-amber-400",
    },
    wilting: {
      label: "Wilting",
      color: "text-red-400",
      bg: "bg-red-400/10",
      dot: "bg-red-400",
    },
  }[state];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot} animate-pulse-glow`} />
      <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
    </div>
  );
}

/* ─── Score Ring (SVG) ─── */
function ScoreRing({ score, state }: { score: number; state: HealthState }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const strokeColor =
    state === "thriving"
      ? "#34d399"
      : state === "struggling"
      ? "#fbbf24"
      : "#f87171";

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.08)"
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={score}
            className="flex items-baseline"
            initial={{ opacity: 0, scale: 1.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.25 }}
          >
            <span className={`font-bold font-[var(--font-display)] ${score > 100 ? 'text-lg' : 'text-xl'}`}>
              {score}
            </span>
            {score > 100 && (
              <span className="text-[10px] text-[var(--text-muted)] ml-0.5 font-medium">/ 100</span>
            )}
          </motion.div>
        </AnimatePresence>
        <span className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase">score</span>
      </div>
    </div>
  );
}

/* ─── Sidebar Component ─── */
export default function Sidebar() {
  const carbonScore = useCarbonStore((state) => state.carbonScore);
  const healthState = useCarbonStore((state) => state.healthState);
  const totalEmissionsToday = useCarbonStore((state) => state.totalEmissionsToday);
  const dailyBudget = useCarbonStore((state) => state.dailyBudget);
  const activeView = useCarbonStore((state) => state.activeView);
  const setActiveView = useCarbonStore((state) => state.setActiveView);
  const resetDay = useCarbonStore((state) => state.resetDay);
  const fetchData = useCarbonStore((state) => state.fetchData);
  
  const [showSettings, setShowSettings] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);

  const logOut = async () => {
    const { supabase } = await import('@/lib/supabase');
    await supabase.auth.signOut();
  };

  const clearData = async () => {
    if (!confirm("Are you sure you want to delete all your tracked data? This cannot be undone.")) return;
    const { supabase } = await import('@/lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.from('transactions').delete().eq('user_id', session.user.id);
      fetchData(); // Refresh local state
    }
  };

  return (
    <motion.aside
      className="w-72 h-full flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)]"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
          <PiPlantFill className="text-white text-xl" />
        </div>
        <div>
          <h1
            className="text-lg font-bold tracking-tight text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            EcoSprout
          </h1>
          <p className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">
            Carbon Tracker
          </p>
        </div>
      </div>

      {/* Score Summary */}
      <div className="mx-4 mb-4 p-4 glass-card flex flex-col items-center gap-3">
        <ScoreRing score={carbonScore} state={healthState} />
        <HealthBadge state={healthState} />
        <div className="w-full mt-1 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-muted)]">Today&apos;s Emissions</span>
            <span className="text-[var(--text-secondary)] font-medium">
              {totalEmissionsToday.toFixed(1)} kg
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(100, (totalEmissionsToday / dailyBudget) * 100)}%`,
                background:
                  healthState === "thriving"
                    ? "linear-gradient(90deg, #34d399, #10b981)"
                    : healthState === "struggling"
                    ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                    : "linear-gradient(90deg, #f87171, #ef4444)",
              }}
            />
          </div>
          <p className="text-[10px] text-[var(--text-muted)] text-right">
            Budget: {dailyBudget} kg CO₂ / day
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <NavItem 
          icon={<HiOutlineHome />} 
          label="Dashboard" 
          active={activeView === "dashboard"} 
          onClick={() => setActiveView("dashboard")}
        />
        <NavItem 
          icon={<HiOutlineChartBar />} 
          label="Analytics" 
          active={activeView === "analytics"} 
          onClick={() => setActiveView("analytics")}
        />
        <NavItem 
          icon={<HiOutlineBell />} 
          label="Notifications" 
          active={showNotifications}
          onClick={() => setShowNotifications(!showNotifications)}
        />

        <PushManager isVisible={showNotifications} />

        <NavItem 
          icon={<HiOutlineCog6Tooth />} 
          label="Settings" 
          active={showSettings}
          onClick={() => setShowSettings(!showSettings)}
        />
        
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-4 space-y-1"
            >
              <button
                onClick={clearData}
                aria-label="Clear All Data"
                className="w-full text-left px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              >
                Clear All Data
              </button>
              <button
                onClick={logOut}
                aria-label="Log Out"
                className="w-full text-left px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-white/[0.04] hover:text-[var(--text-primary)] rounded-lg transition-colors"
              >
                Log Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Reset Button */}
      <div className="px-4 py-4 border-t border-[var(--border-subtle)]">
        <motion.button
          onClick={resetDay}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Reset Day"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/[0.04] transition-all duration-200 cursor-pointer"
        >
          <HiOutlineArrowPath className="text-base" />
          Reset Day
        </motion.button>
      </div>
    </motion.aside>
  );
}
