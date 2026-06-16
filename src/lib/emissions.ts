/* ─── Emission Factors ───
 *  Approximate kg CO₂ per ₹ spent, by category.
 *  Sources: DEFRA 2023, IEA India averages, simplified for MVP.
 */

export interface TransactionTemplate {
  label: string;
  category: string;
  amount: number;
  icon: string;
}

const EMISSION_FACTORS: Record<string, number> = {
  // kg CO₂ per ₹ spent
  flight:        0.012,    // domestic aviation
  cab:           0.0035,   // ride-hailing (petrol auto/car)
  auto:          0.0025,   // auto-rickshaw
  metro:         0.0004,   // metro rail
  bus:           0.0006,   // public bus
  food_delivery: 0.0018,   // food delivery (packaging + transport)
  dining_out:    0.0012,   // restaurant dining
  groceries:     0.0008,   // supermarket groceries
  online_shop:   0.0022,   // e-commerce (packaging + logistics)
  electricity:   0.0040,   // electricity bill (coal-heavy grid)
  fuel:          0.0050,   // petrol/diesel
  clothing:      0.0015,   // fast fashion
  subscription:  0.0003,   // digital services
  default:       0.0010,   // fallback
};

/**
 * Calculate estimated CO₂ emissions for a transaction.
 * @returns kg CO₂
 */
export function calculateEmissions(category: string, amount: number): number {
  const factor = EMISSION_FACTORS[category] ?? EMISSION_FACTORS.default;
  return Math.round(factor * amount * 100) / 100; // 2 decimal places
}

/* ─── Mock Transaction Templates ─── */
export const MOCK_TRANSACTIONS: TransactionTemplate[] = [
  // Food & Dining
  { label: "Swiggy Delivery",        category: "food_delivery", amount: 500,   icon: "🍕" },
  { label: "Zomato Order",           category: "food_delivery", amount: 350,   icon: "🍔" },
  { label: "Restaurant Dinner",      category: "dining_out",    amount: 1200,  icon: "🍽️" },
  { label: "Café Coffee Day",        category: "dining_out",    amount: 250,   icon: "☕" },

  // Transport
  { label: "Uber Auto",              category: "auto",          amount: 150,   icon: "🛺" },
  { label: "Ola Cab",                category: "cab",           amount: 400,   icon: "🚗" },
  { label: "Rapido Bike",            category: "auto",          amount: 80,    icon: "🏍️" },
  { label: "Metro Card Recharge",    category: "metro",         amount: 500,   icon: "🚇" },
  { label: "MakeMyTrip Flight",      category: "flight",        amount: 8000,  icon: "✈️" },
  { label: "Bus Ticket",             category: "bus",           amount: 120,   icon: "🚌" },

  // Shopping
  { label: "Amazon Order",           category: "online_shop",   amount: 2000,  icon: "📦" },
  { label: "Flipkart Purchase",      category: "online_shop",   amount: 1500,  icon: "🛒" },
  { label: "Myntra Clothing",        category: "clothing",      amount: 1800,  icon: "👕" },

  // Utilities
  { label: "Electricity Bill",       category: "electricity",   amount: 2500,  icon: "⚡" },
  { label: "Petrol Refill",          category: "fuel",          amount: 3000,  icon: "⛽" },

  // Digital
  { label: "Netflix Subscription",   category: "subscription",  amount: 649,   icon: "🎬" },
  { label: "Spotify Premium",        category: "subscription",  amount: 119,   icon: "🎵" },

  // Groceries
  { label: "BigBasket Groceries",    category: "groceries",     amount: 1200,  icon: "🥦" },
  { label: "DMart Shopping",         category: "groceries",     amount: 800,   icon: "🛍️" },
];

/**
 * Get a human-readable impact label.
 */
export function getImpactLevel(carbonKg: number): { label: string; color: string } {
  if (carbonKg < 0.5) return { label: "Low Impact", color: "text-emerald-400" };
  if (carbonKg < 2.0) return { label: "Moderate", color: "text-amber-400" };
  if (carbonKg < 5.0) return { label: "High Impact", color: "text-orange-400" };
  return { label: "Very High", color: "text-red-400" };
}

/**
 * Format amount in INR.
 */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
