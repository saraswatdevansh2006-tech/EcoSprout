import React from "react";
import { render, screen, act } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import AuthGate from "../components/auth/AuthGate";
import { useCarbonStore } from "../store/carbon-store";

// Mock Supabase client to prevent network requests and handle auth synchronously
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
    }
  }
}));

test("AuthGate renders login screen when no user is logged in", async () => {
  useCarbonStore.setState({ user: null });

  await act(async () => {
    render(
      <AuthGate>
        <div data-testid="protected-content">Secret Content</div>
      </AuthGate>
    );
  });

  // Verify login card elements are present
  expect(screen.getByText("EcoSprout")).toBeInTheDocument();
  expect(screen.getByText("Sign in to secure your plant's data.")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();

  // Verify protected content is NOT rendered
  expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
});
