import React from "react";
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import MainContent from "../components/layout/MainContent";

// Mock R3F Scene to prevent JSDOM WebGL rendering errors
vi.mock("@/components/3d/PlantScene", () => ({
  default: () => <div data-testid="mock-plant-scene">Mock Plant Scene</div>,
}));

// Mock Transaction components to keep it simple
vi.mock("@/components/dashboard/TransactionSimulator", () => ({
  default: () => <div data-testid="mock-simulator">Transaction Simulator</div>,
}));

vi.mock("@/components/dashboard/TransactionHistory", () => ({
  default: () => <div data-testid="mock-history">Transaction History</div>,
}));

test("Dashboard renders main sections and title", () => {
  render(<MainContent />);
  
  // Verify main title is present
  expect(screen.getByText("Dashboard")).toBeInTheDocument();
  
  // Verify stats cards row headers
  expect(screen.getByText("Today's Emissions")).toBeInTheDocument();
  expect(screen.getByText("Transactions")).toBeInTheDocument();
  
  // Verify mocks and loading fallbacks loaded
  expect(screen.getByText("Loading 3D Scene…")).toBeInTheDocument();
  expect(screen.getByTestId("mock-simulator")).toBeInTheDocument();
  expect(screen.getByTestId("mock-history")).toBeInTheDocument();
});
