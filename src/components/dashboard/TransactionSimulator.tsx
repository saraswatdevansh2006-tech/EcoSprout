"use client";

import React, { useState } from "react";
import { useCarbonStore } from "@/store/carbon-store";
import {
  MOCK_TRANSACTIONS,
  calculateEmissions,
  getImpactLevel,
  formatINR,
  TransactionTemplate,
} from "@/lib/emissions";

/* ─── Category Filter Tabs ─── */
const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "food", label: "🍕 Food" },
  { key: "transport", label: "🚗 Transport" },
  { key: "shopping", label: "🛒 Shopping" },
  { key: "utilities", label: "⚡ Utilities" },
  { key: "digital", label: "🎬 Digital" },
];

function getCategoryGroup(category: string): string {
  if (["food_delivery", "dining_out", "groceries"].includes(category)) return "food";
  if (["flight", "cab", "auto", "metro", "bus"].includes(category)) return "transport";
  if (["online_shop", "clothing"].includes(category)) return "shopping";
  if (["electricity", "fuel"].includes(category)) return "utilities";
  if (["subscription"].includes(category)) return "digital";
  return "all";
}

/* ─── Transaction Card (compact horizontal row) ─── */
function TransactionCard({
  template,
  onSimulate,
  isProcessing,
}: {
  template: TransactionTemplate;
  onSimulate: (t: TransactionTemplate) => void;
  isProcessing: boolean;
}) {
  const carbonKg = calculateEmissions(template.category, template.amount);
  const impact = getImpactLevel(carbonKg);

  const impactBg =
    carbonKg < 0.5
      ? "bg-emerald-400/10 text-emerald-400"
      : carbonKg < 2
      ? "bg-amber-400/10 text-amber-400"
      : carbonKg < 5
      ? "bg-orange-400/10 text-orange-400"
      : "bg-red-400/10 text-red-400";

  return (
    <button
      onClick={() => onSimulate(template)}
      disabled={isProcessing}
      className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                 bg-white/[0.03] border border-[var(--border-subtle)]
                 hover:bg-white/[0.06] hover:border-white/[0.12]
                 active:scale-[0.99] transition-all duration-200 cursor-pointer
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {/* Icon */}
      <span className="text-xl w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-white/[0.05]">
        {template.icon}
      </span>

      {/* Label + Amount */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
          {template.label}
        </p>
        <p className="text-[11px] text-[var(--text-muted)]">
          {formatINR(template.amount)}
        </p>
      </div>

      {/* CO₂ + Impact Badge */}
      <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
        <span className="text-[12px] font-semibold text-[var(--text-primary)] whitespace-nowrap">
          +{carbonKg} kg
        </span>
        <span className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md whitespace-nowrap ${impactBg}`}>
          {impact.label}
        </span>
      </div>
    </button>
  );
}

/* ─── Toast Notification ─── */
function SimulationToast({ 
  label, 
  carbonKg, 
  onDismiss 
}: { 
  label: string; 
  carbonKg: number; 
  onDismiss: () => void;
}) {
  const impact = getImpactLevel(carbonKg);
  
  React.useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-card px-5 py-3 flex items-center gap-3 animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)]">
      <div className={`w-2 h-2 rounded-full ${
        carbonKg < 0.5 ? "bg-emerald-400" : carbonKg < 2 ? "bg-amber-400" : "bg-red-400"
      } animate-pulse-glow`} />
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {label} processed
        </p>
        <p className={`text-[11px] ${impact.color}`}>
          +{carbonKg} kg CO₂ — {impact.label}
        </p>
      </div>
    </div>
  );
}

/* ─── Transaction Simulator ─── */
export default function TransactionSimulator() {
  const addTransaction = useCarbonStore((state) => state.addTransaction);
  const addNotification = useCarbonStore((state) => state.addNotification);
  const carbonScore = useCarbonStore((state) => state.carbonScore);
  const healthState = useCarbonStore((state) => state.healthState);
  const totalEmissionsToday = useCarbonStore((state) => state.totalEmissionsToday);
  const dailyBudget = useCarbonStore((state) => state.dailyBudget);

  const [activeFilter, setActiveFilter] = useState("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ label: string; carbonKg: number } | null>(null);

  const filteredTransactions =
    activeFilter === "all"
      ? MOCK_TRANSACTIONS
      : MOCK_TRANSACTIONS.filter((t) => getCategoryGroup(t.category) === activeFilter);

  const handleSimulate = async (template: TransactionTemplate) => {
    setIsProcessing(true);
    const carbonKg = calculateEmissions(template.category, template.amount);

    // Add transaction to store (updates score immediately)
    addTransaction({
      label: template.label,
      category: template.category,
      amount: template.amount,
      carbonKg,
      icon: template.icon,
    });

    setToast({ label: template.label, carbonKg });

    // Fetch AI nudge from Gemini (non-blocking for UI)
    try {
      const res = await fetch("/api/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          healthState,
          transactionLabel: template.label,
          transactionCategory: template.category,
          transactionAmount: template.amount,
          carbonKg,
          carbonScore,
          totalEmissionsToday: totalEmissionsToday + carbonKg,
          dailyBudget,
        }),
      });

      const data = await res.json();

      if (data.message) {
        addNotification({
          message: data.message,
          healthState,
          transactionLabel: template.label,
        });
      }
    } catch (err) {
      console.error("Failed to fetch nudge:", err);
      // Add a fallback notification
      addNotification({
        message:
          carbonKg > 2
            ? `That ${template.label} was a lot... I felt that one 🥀`
            : `Noted the ${template.label}! Every choice matters 🌱`,
        healthState,
        transactionLabel: template.label,
      });
    }

    setIsProcessing(false);
  };

  return (
    <>
      <div className="glass-card p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Simulate Transaction
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Tap a card to simulate a purchase and watch Sprout react
            </p>
          </div>
          {isProcessing && (
            <div className="w-5 h-5 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin" />
          )}
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveFilter(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeFilter === cat.key
                  ? "bg-white/[0.1] text-[var(--text-primary)] border border-white/[0.12]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Transaction Grid */}
        <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
          {filteredTransactions.map((template) => (
            <TransactionCard
              key={template.label}
              template={template}
              onSimulate={handleSimulate}
              isProcessing={isProcessing}
            />
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <SimulationToast
          label={toast.label}
          carbonKg={toast.carbonKg}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
}
