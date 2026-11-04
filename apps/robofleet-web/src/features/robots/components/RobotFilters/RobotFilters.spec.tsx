import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RobotFilters } from "./RobotFilters";

describe("RobotFilters", () => {
  it("shows counts and reflects the controlled filter when it changes", () => {
    const onFilterChange = vi.fn();
    const { rerender } = render(
      <RobotFilters
        filter="all"
        activeCount={4}
        attentionCount={2}
        onFilterChange={onFilterChange}
      />,
    );

    expect(screen.getByRole("button", { name: "All robots" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByRole("button", { name: "Active 4" }).getAttribute("aria-pressed")).toBe(
      "false",
    );

    rerender(
      <RobotFilters
        filter="attention"
        activeCount={3}
        attentionCount={0}
        onFilterChange={onFilterChange}
      />,
    );

    expect(screen.getByRole("button", { name: "All robots" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
    expect(screen.getByRole("button", { name: "Attention 0" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByRole("button", { name: "Active 3" })).toBeTruthy();
    expect(onFilterChange).not.toHaveBeenCalled();
  });

  it.each([
    ["Active 4", "active"],
    ["Attention 2", "attention"],
    ["All robots", "all"],
  ] as const)("requests the %s filter", (name, expected) => {
    const onFilterChange = vi.fn();

    render(
      <RobotFilters
        filter={expected === "all" ? "active" : "all"}
        activeCount={4}
        attentionCount={2}
        onFilterChange={onFilterChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name }));

    expect(onFilterChange).toHaveBeenCalledExactlyOnceWith(expected);
  });

  it("keeps a filter selected when the current option is clicked again", () => {
    const onFilterChange = vi.fn();

    render(
      <RobotFilters
        filter="all"
        activeCount={4}
        attentionCount={2}
        onFilterChange={onFilterChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "All robots" }));

    expect(onFilterChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "All robots" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });
});
