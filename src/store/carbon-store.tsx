import { create } from "zustand";
import { supabase } from "@/lib/supabase";

/* ─── Types ─── */
export type HealthState = "thriving" | "struggling" | "wilting";

export interface Transaction {
  id: string;
  label: string;
  category: string;
  amount: number;
  carbonKg: number;
  timestamp: Date;
  icon: string;
}

export interface Notification {
  id: string;
  message: string;
  timestamp: Date;
  healthState: HealthState;
  transactionLabel: string;
}

interface CarbonState {
  carbonScore: number;          // 0-100+ scale
  totalEmissionsToday: number;  // kg CO2
  dailyBudget: number;          // kg CO2
  healthState: HealthState;
  transactions: Transaction[];
  notifications: Notification[];
  activeView: "dashboard" | "analytics";
  weeklyEmissions: number[];
  monthlyScore: number;
  isLoadingData: boolean;
  timePhase: "day" | "evening" | "night";
  user: any | null; // using any to avoid importing User type in store, or we can just import it
  
  setActiveView: (view: "dashboard" | "analytics") => void;
  setUser: (user: any | null) => void;
  addTransaction: (tx: Omit<Transaction, "id" | "timestamp">) => void;
  addNotification: (notif: Omit<Notification, "id" | "timestamp">) => void;
  fetchData: () => Promise<void>;
  resetDay: () => void;
  startTimeSync: () => void;
}

/* ─── Helpers ─── */
export const DAILY_BUDGET_KG = 6; // average daily budget in kg CO2

function computeHealthState(score: number): HealthState {
  if (score <= 30) return "thriving";
  if (score <= 70) return "struggling";
  return "wilting";
}

function getTimePhase(): "day" | "evening" | "night" {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Compute metrics from all transactions
function computeMetrics(txs: Transaction[]) {
  const now = new Date();
  
  // Today's total
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayTxs = txs.filter(t => t.timestamp.getTime() >= todayStart);
  const totalEmissionsToday = todayTxs.reduce((sum, t) => sum + t.carbonKg, 0);
  
  const carbonScore = Math.round((totalEmissionsToday / DAILY_BUDGET_KG) * 100);
  const healthState = computeHealthState(carbonScore);

  // Weekly Emissions (Mon-Sun)
  // Find current day of week (0=Sun, 1=Mon, ..., 6=Sat)
  // We want an array of 7 elements (Mon=0 to Sun=6)
  const currentDayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; 
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - currentDayOfWeek).getTime();
  
  const weeklyEmissions = [0, 0, 0, 0, 0, 0, 0];
  txs.forEach(t => {
    const tTime = t.timestamp.getTime();
    if (tTime >= weekStart && tTime < weekStart + 7 * 86400000) {
      const dayIndex = t.timestamp.getDay() === 0 ? 6 : t.timestamp.getDay() - 1;
      weeklyEmissions[dayIndex] += t.carbonKg;
    }
  });

  // Monthly Score (Average daily score over last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).getTime();
  const monthTxs = txs.filter(t => t.timestamp.getTime() >= thirtyDaysAgo);
  const totalMonthEmissions = monthTxs.reduce((sum, t) => sum + t.carbonKg, 0);
  
  // Determine how many days have actually elapsed in the last 30 days, 
  // or just use 30 as a baseline divisor.
  const avgDailyEmissions = totalMonthEmissions / 30;
  const monthlyScore = Math.round((avgDailyEmissions / DAILY_BUDGET_KG) * 100);

  return { totalEmissionsToday, carbonScore, healthState, weeklyEmissions, monthlyScore };
}

/* ─── Zustand Store ─── */
export const useCarbonStore = create<CarbonState>((set, get) => ({
  carbonScore: 0,
  totalEmissionsToday: 0,
  dailyBudget: DAILY_BUDGET_KG,
  healthState: "thriving",
  transactions: [],
  notifications: [],
  activeView: "dashboard",
  weeklyEmissions: [0, 0, 0, 0, 0, 0, 0],
  monthlyScore: 0,
  isLoadingData: false,
  timePhase: getTimePhase(),
  user: null,

  setUser: (user) => set({ user }),
  setActiveView: (view) => set({ activeView: view }),

  startTimeSync: () => {
    // Update immediately
    set({ timePhase: getTimePhase() });
    // Check every minute
    setInterval(() => {
      set({ timePhase: getTimePhase() });
    }, 60000);
  },

  fetchData: async () => {
    set({ isLoadingData: true });
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('timestamp', { ascending: false });
        
      if (error) {
        console.error("Error fetching transactions:", error);
        return;
      }
      
      const parsedTxs: Transaction[] = (data || []).map(row => ({
        id: row.id,
        label: row.label,
        category: row.category,
        amount: row.amount,
        carbonKg: row.carbon_kg,
        timestamp: new Date(row.timestamp),
        icon: row.icon
      }));

      const metrics = computeMetrics(parsedTxs);
      
      set({
        transactions: parsedTxs,
        ...metrics,
        isLoadingData: false
      });
    } catch (err) {
      console.error(err);
      set({ isLoadingData: false });
    }
  },

  addTransaction: async (tx) => {
    const newTx: Transaction = {
      ...tx,
      id: generateId(), // Temporary ID for optimistic UI
      timestamp: new Date(),
    };

    // Optimistic UI Update
    set((state) => {
      const newTransactions = [newTx, ...state.transactions];
      const metrics = computeMetrics(newTransactions);
      return {
        transactions: newTransactions,
        ...metrics
      };
    });

    // Supabase Insert
    try {
      const { error } = await supabase.from('transactions').insert([{
        label: newTx.label,
        category: newTx.category,
        amount: newTx.amount,
        carbon_kg: newTx.carbonKg,
        icon: newTx.icon
      }]);
      
      if (error) {
        console.error("Failed to insert transaction into Supabase:", error);
        // We could revert optimistic update here, but we'll ignore for MVP
      }
    } catch (e) {
      console.error("Supabase insert error", e);
    }
  },

  addNotification: (notif) =>
    set((state) => {
      const newNotif: Notification = {
        ...notif,
        id: generateId(),
        timestamp: new Date(),
      };
      return { notifications: [newNotif, ...state.notifications] };
    }),

  resetDay: () =>
    set({
      carbonScore: 0,
      totalEmissionsToday: 0,
      healthState: computeHealthState(0),
      // We do not clear Supabase transactions here to preserve history
    }),
}));
