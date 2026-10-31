import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "react-error-boundary";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardErrorFallback } from "./DashboardErrorFallback";

function BrokenDashboard(): never {
  throw new Error("Private dashboard details");
}

function preventExpectedError(event: ErrorEvent) {
  if (event.error?.message === "Private dashboard details") event.preventDefault();
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  window.addEventListener("error", preventExpectedError);
});

afterEach(() => {
  window.removeEventListener("error", preventExpectedError);
  vi.restoreAllMocks();
});

describe("DashboardErrorFallback", () => {
  it("offers page recovery for dashboard failures without displaying exception details", () => {
    render(
      <ErrorBoundary FallbackComponent={DashboardErrorFallback}>
        <BrokenDashboard />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("heading", { name: "Dashboard unavailable" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reload page" })).toBeTruthy();
    expect(screen.queryByText("Private dashboard details")).toBeNull();
  });
});
