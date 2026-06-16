"use client";

import React from "react";
import { useCarbonStore } from "@/store/carbon-store";
import { getImpactLevel, formatINR } from "@/lib/emissions";

/* ─── Relative Time ─── */
function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

/* ─── Transaction History ─── */
export default function TransactionHistory() {
  const transactions = useCarbonStore((state) => state.transactions);

  if (transactions.length === 0) return null;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-sm font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Recent Activity
        </h3>
        <span className="text-[11px] text-[var(--text-muted)] bg-white/[0.05] px-2 py-0.5 rounded-md">
          {transactions.length} today
        </span>
      </div>

      <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
        {transactions.map((tx) => {
          const impact = getImpactLevel(tx.carbonKg);
          return (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg flex-shrink-0">{tx.icon}</span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                    {tx.label}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {timeAgo(tx.timestamp)} · {formatINR(tx.amount)}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className={`text-[13px] font-semibold ${impact.color}`}>
                  +{tx.carbonKg} kg
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">CO₂</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
