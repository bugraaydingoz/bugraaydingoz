import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

function preventExpectedError(event: ErrorEvent) {
  if (event.error?.message === "Private rendering details") event.preventDefault();
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  window.addEventListener("error", preventExpectedError);
});
afterEach(() => {
  window.removeEventListener("error", preventExpectedError);
  vi.restoreAllMocks();
});

describe("ErrorBoundary", () => {
  it("contains a rendering failure and recovers only when explicitly reset", () => {
    let broken = true;
    function Child() {
      if (broken) throw new Error("Private rendering details");

      return <p>Recovered content</p>;
    }

    render(
      <ErrorBoundary fallback={(reset) => <button onClick={reset}>Try again</button>}>
        <Child />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(screen.queryByText("Private rendering details")).toBeNull();

    // A persistent failure returns to the fallback instead of escaping the boundary.
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();

    broken = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByText("Recovered content")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("renders healthy children without invoking the fallback", () => {
    const fallback = vi.fn();
    render(
      <ErrorBoundary fallback={fallback}>
        <p>Dashboard</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(fallback).not.toHaveBeenCalled();
  });
});
