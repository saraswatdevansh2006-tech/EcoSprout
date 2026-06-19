import React from "react";
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import TransactionSimulator from "../components/dashboard/TransactionSimulator";

test("TransactionSimulator renders simulator header and categories", () => {
  render(<TransactionSimulator />);
  
  // Verify main headers are present
  expect(screen.getByText("Simulate Transaction")).toBeInTheDocument();
  expect(screen.getByText("Tap a card to simulate a purchase and watch Sprout react")).toBeInTheDocument();
  
  // Verify category filter buttons are rendered
  expect(screen.getByText("All")).toBeInTheDocument();
  expect(screen.getByText("🍕 Food")).toBeInTheDocument();
  expect(screen.getByText("🚗 Transport")).toBeInTheDocument();
});
