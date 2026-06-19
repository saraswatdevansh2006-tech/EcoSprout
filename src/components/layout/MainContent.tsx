"use client";

import React from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useCarbonStore, HealthState } from "@/store/carbon-store";
import TransactionSimulator from "@/components/dashboard/TransactionSimulator";
import TransactionHistory from "@/components/dashboard/TransactionHistory";

/* ─── Dynamic import for R3F (no SSR) ─── */
const PlantScene = dynamic(() => import("@/components/3d/PlantScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin" />
        <p className="text-xs text-[var(--text-muted)]">Loading 3D Scene…</p>
      </div>
    </div>
  ),
});

/* ─── Animation Variants ─── */
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};


/* ─── 3D Hero Section ─── */
function AvatarHero() {
  const healthState = useCarbonStore((state) => state.healthState);
  const carbonScore = useCarbonStore((state) => state.carbonScore);

  const statusText: Record<HealthState, string> = {
    thriving: "Feeling fresh and full of life!",
    struggling: "Getting a little hazy out here…",
    wilting: "I can barely breathe… please help.",
  };

  return (
    <motion.div
      className="relative w-full h-full rounded-2xl overflow-hidden"
      variants={scaleIn}
      initial="hidden"
      animate="visible"
    >
      {/* R3F Canvas */}
      <PlantScene healthState={healthState} />

      {/* Overlay — Sprout Name + Status */}
      <motion.div
        className="absolute bottom-4 left-4 glass-card px-4 py-2.5 flex items-center gap-3 pointer-events-none"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            healthState === "thriving"
              ? "bg-emerald-400"
              : healthState === "struggling"
              ? "bg-amber-400"
              : "bg-red-400"
          } animate-pulse-glow`}
        />
        <div>
          <p
            className="text-sm font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Sprout
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={healthState}
              className="text-[10px] text-[var(--text-muted)]"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              {statusText[healthState]}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Overlay — Score Badge */}
      <motion.div
        className="absolute top-4 right-4 glass-card px-3 py-1.5 flex items-center gap-2 pointer-events-none"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={carbonScore}
            className={`text-sm font-bold ${
              healthState === "thriving"
                ? "gradient-text-green"
                : healthState === "struggling"
                ? "gradient-text-warm"
                : "gradient-text-danger"
            }`}
            initial={{ opacity: 0, scale: 1.3 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.3 }}
          >
            {carbonScore}
          </motion.span>
        </AnimatePresence>
        {carbonScore > 100 && (
          <span className="text-[10px] text-[var(--text-muted)]">/ 100</span>
        )}
      </motion.div>

      {/* Overlay — Drag hint */}
      <motion.div
        className="absolute top-4 left-4 glass-card px-3 py-1.5 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.6 }}
      >
        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
          🖱 Drag to rotate
        </span>
      </motion.div>
    </motion.div>
  );
}

/* ─── Stats Cards Row ─── */
function StatsCards() {
  const totalEmissionsToday = useCarbonStore((state) => state.totalEmissionsToday);
  const dailyBudget = useCarbonStore((state) => state.dailyBudget);
  const transactions = useCarbonStore((state) => state.transactions);
  const healthState = useCarbonStore((state) => state.healthState);
  
  const remaining = dailyBudget - totalEmissionsToday;
  const isOverBudget = remaining < 0;

  const cards = [
    {
      label: "Today's Emissions",
      value: `${totalEmissionsToday.toFixed(1)} kg`,
      sub: "CO₂ equivalent",
      accent: "text-[var(--text-primary)]",
    },
    {
      label: isOverBudget ? "Over Budget" : "Budget Remaining",
      value: isOverBudget ? `+${Math.abs(remaining).toFixed(1)} kg` : `${remaining.toFixed(1)} kg`,
      sub: `of ${dailyBudget} kg daily`,
      accent:
        healthState === "thriving"
          ? "text-emerald-400"
          : healthState === "struggling"
          ? "text-amber-400"
          : "text-red-500 font-extrabold",
    },
    {
      label: "Transactions",
      value: transactions.length.toString(),
      sub: "tracked today",
      accent: "text-[var(--text-primary)]",
    },
  ];

  return (
    <section className="grid grid-cols-3 gap-4" aria-label="Emissions Stats">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          className="glass-card p-4 hover:bg-[var(--bg-card-hover)] transition-colors duration-200"
          custom={i + 3}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
        >
          <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-2">
            {card.label}
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={card.value}
              className={`text-2xl font-bold ${card.accent}`}
              style={{ fontFamily: "var(--font-display)" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {card.value}
            </motion.p>
          </AnimatePresence>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">{card.sub}</p>
        </motion.div>
      ))}
    </section>
  );
}

/* ─── Main Content Area ─── */
export default function MainContent() {
  const user = useCarbonStore((state) => state.user);
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "D";

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
            Dashboard
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <motion.button
          className="flex items-center gap-3 border-none bg-transparent outline-none cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="User Profile"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
            {userInitial}
          </div>
        </motion.button>
      </motion.header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* Hero — 3D Avatar Area */}
        <div className="canvas-container w-full" style={{ height: "420px" }}>
          <AvatarHero />
        </div>

        {/* Stats */}
        <StatsCards />

        {/* Transaction Simulator + History */}
        <motion.section
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          custom={5}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          aria-label="Transactions Log and Simulator"
        >
          <TransactionSimulator />
          <TransactionHistory />
        </motion.section>
      </div>
    </main>
  );
}
