"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { useCarbonStore } from "@/store/carbon-store";
import Image from "next/image";

/* ─── Animation Variants ─── */
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

/* ─── Mock Weekly Chart Component ─── */
function WeeklyChart({ data, budget }: { data: number[]; budget: number }) {
  const maxVal = Math.max(...data, budget);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="glass-card p-6 w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Weekly Emissions
        </h3>
        <p className="text-[11px] text-[var(--text-muted)]">Target: {budget} kg/day</p>
      </div>

      <div className="flex items-end justify-between h-48 gap-2">
        {data.map((val, i) => {
          const heightPct = Math.min(100, (val / maxVal) * 100);
          const isOverBudget = val > budget;
          return (
            <div key={i} className="flex flex-col items-center flex-1 h-full gap-3 relative group">
              {/* Tooltip */}
              <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[10px] px-2 py-1 rounded-md z-10 pointer-events-none">
                {val.toFixed(1)} kg
              </div>
              
              {/* Bar */}
              <div className="w-full flex-1 bg-white/[0.04] rounded-t-sm relative flex items-end justify-center overflow-hidden">
                <motion.div
                  className={`w-full rounded-t-sm ${
                    isOverBudget
                      ? "bg-gradient-to-t from-red-500/80 to-red-400"
                      : "bg-gradient-to-t from-emerald-500/80 to-emerald-400"
                  }`}
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ delay: 0.2 + i * 0.05, duration: 0.6, ease: "easeOut" }}
                />
              </div>

              {/* Day Label */}
              <span className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">
                {days[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Sprout Motivation Component ─── */
function SproutMotivation({ monthlyScore, weeklyEmissions }: { monthlyScore: number; weeklyEmissions: number[] }) {
  const [message, setMessage] = React.useState<string>("Let me think about your week...");
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    async function fetchAIMessage() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/analytics-nudge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ monthlyScore, weeklyEmissions }),
        });
        const data = await res.json();
        if (data.message) {
          setMessage(data.message);
        }
      } catch (err) {
        console.error("Failed to fetch AI message", err);
        setMessage("Something went wrong... I can't speak right now 🥀");
      } finally {
        setIsLoading(false);
      }
    }

    // Only run on client after mount, or if dependencies change
    fetchAIMessage();
  }, [monthlyScore, weeklyEmissions]);

  const isHealthy = monthlyScore <= 30;
  const isStruggling = monthlyScore > 30 && monthlyScore <= 70;

  const bubbleColor = isHealthy ? "border-emerald-500/30" : isStruggling ? "border-amber-500/30" : "border-red-500/30";
  const glowColor = isHealthy ? "shadow-[0_0_20px_rgba(52,211,153,0.15)]" : isStruggling ? "shadow-[0_0_20px_rgba(251,191,36,0.15)]" : "shadow-[0_0_20px_rgba(248,113,113,0.15)]";

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 p-6 glass-card mt-6">
      <motion.div 
        className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0"
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      >
        <Image
          src="/sprout.png"
          alt="Sprout Character"
          fill
          sizes="(max-width: 768px) 128px, 160px"
          className="object-contain drop-shadow-xl"
        />
      </motion.div>

      <div className="flex-1 relative">
        {/* Speech Bubble Arrow */}
        <div className={`absolute -left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-[var(--bg-secondary)] border-l border-b ${bubbleColor} rotate-45 hidden md:block`} />
        
        {/* Speech Bubble */}
        <div className={`relative bg-[var(--bg-secondary)] border ${bubbleColor} rounded-2xl p-5 ${glowColor} min-h-[80px] flex items-center`}>
          {isLoading ? (
            <div className="flex gap-2 items-center text-[var(--text-muted)]">
              <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Analytics View ─── */
export default function AnalyticsContent() {
  const weeklyEmissions = useCarbonStore((state) => state.weeklyEmissions);
  const monthlyScore = useCarbonStore((state) => state.monthlyScore);
  const dailyBudget = useCarbonStore((state) => state.dailyBudget);

  return (
    <main className="flex-1 h-full flex flex-col overflow-hidden">
      {/* Top Bar */}
      <motion.header
        className="flex items-center justify-between px-8 py-4 border-b border-[var(--border-subtle)]"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h2
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Analytics & Insights
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Your carbon footprint trends
          </p>
        </div>
      </motion.header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Monthly Score Card */}
          <motion.div 
            className="glass-card p-6 flex flex-col justify-center items-center text-center col-span-1"
            custom={1}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-4">
              Monthly Score
            </p>
            <div className="relative flex items-center justify-center w-32 h-32 rounded-full bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-baseline">
                <span className={`text-4xl font-bold ${monthlyScore <= 30 ? "gradient-text-green" : monthlyScore <= 70 ? "gradient-text-warm" : "gradient-text-danger"}`}>
                  {monthlyScore}
                </span>
                <span className="text-sm font-normal text-[var(--text-muted)] ml-1.5">/ 100</span>
              </div>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-4 max-w-[180px]">
              Aggregate score of your daily emissions. Keep it below 30 to thrive!
            </p>
          </motion.div>

          {/* Weekly Chart */}
          <motion.div 
            className="col-span-1 md:col-span-2 flex"
            custom={2}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <WeeklyChart data={weeklyEmissions} budget={dailyBudget} />
          </motion.div>
        </div>

        {/* Sprout's Motivation */}
        <motion.div
          custom={3}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <SproutMotivation monthlyScore={monthlyScore} weeklyEmissions={weeklyEmissions} />
        </motion.div>

      </div>
    </main>
  );
}
