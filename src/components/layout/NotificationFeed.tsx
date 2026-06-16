"use client";

import React from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useCarbonStore } from "@/store/carbon-store";
import { PiPlantFill } from "react-icons/pi";

/* ─── Relative Time ─── */
function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

/* ─── Notification Item Animation ─── */
const notifVariants: Variants = {
  hidden: { opacity: 0, x: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    x: 20,
    scale: 0.95,
    transition: { duration: 0.25 },
  },
};

/* ─── Notification Feed ─── */
export default function NotificationFeed() {
  const notifications = useCarbonStore((state) => state.notifications);
  const healthState = useCarbonStore((state) => state.healthState);

  const borderColor =
    healthState === "thriving"
      ? "border-emerald-500/20"
      : healthState === "struggling"
      ? "border-amber-500/20"
      : "border-red-500/20";

  return (
    <aside className="w-80 h-full flex flex-col bg-[var(--bg-secondary)] border-l border-[var(--border-subtle)]">
      {/* Header */}
      <motion.div
        className="px-5 py-5 border-b border-[var(--border-subtle)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h2
          className="text-sm font-semibold tracking-wide"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Sprout&apos;s Thoughts
        </h2>
        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
          {notifications.length === 0
            ? "No notifications yet — simulate a transaction!"
            : `${notifications.length} notification${notifications.length !== 1 ? "s" : ""}`}
        </p>
      </motion.div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <AnimatePresence mode="popLayout">
          {notifications.length === 0 ? (
            <motion.div
              key="empty"
              className="flex flex-col items-center justify-center h-full text-center px-6 py-12 opacity-60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-16 h-16 rounded-full bg-emerald-400/10 flex items-center justify-center mb-4"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                <PiPlantFill className="text-emerald-400 text-2xl" />
              </motion.div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Your Sprout is quietly growing. Make a transaction to see how it reacts!
              </p>
            </motion.div>
          ) : (
            notifications.map((notif) => (
              <motion.div
                key={notif.id}
                className={`p-3.5 rounded-xl bg-white/[0.03] border ${borderColor} transition-colors duration-300 hover:bg-white/[0.05]`}
                variants={notifVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
              >
                {/* Transaction tag */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] bg-white/[0.05] px-2 py-0.5 rounded-md">
                    {notif.transactionLabel}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {timeAgo(notif.timestamp)}
                  </span>
                </div>
                {/* Message */}
                <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
                  {notif.message}
                </p>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
