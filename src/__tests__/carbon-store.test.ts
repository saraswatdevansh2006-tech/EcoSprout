import { expect, test, beforeEach } from "vitest";
import { useCarbonStore } from "../store/carbon-store";

beforeEach(() => {
  useCarbonStore.getState().resetDay();
});

test("should set active view correctly", () => {
  const store = useCarbonStore.getState();
  expect(store.activeView).toBe("dashboard");
  
  store.setActiveView("analytics");
  expect(useCarbonStore.getState().activeView).toBe("analytics");
});

test("should add transaction and calculate scores correctly", () => {
  const store = useCarbonStore.getState();
  expect(store.transactions.length).toBe(0);
  
  store.addTransaction({
    label: "Carpooling",
    category: "transport",
    amount: 0,
    carbonKg: -1.5,
    icon: "🚗",
  });
  
  const updatedStore = useCarbonStore.getState();
  expect(updatedStore.transactions.length).toBe(1);
  expect(updatedStore.transactions[0].label).toBe("Carpooling");
  expect(updatedStore.totalEmissionsToday).toBe(-1.5);
});
