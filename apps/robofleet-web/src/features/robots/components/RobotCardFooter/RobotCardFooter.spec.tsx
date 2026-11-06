import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { RobotCardFooter } from "./RobotCardFooter";

type FooterRobot = ComponentProps<typeof RobotCardFooter>["robot"];
const robot: FooterRobot = {
  name: "Atlas", battery: 80, status: "Idle", task: null, lastSeenAt: null,
};

describe("RobotCardFooter", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([[24, "destructive"], [25, "outline"]] as const)(
    "shows battery %i with the appropriate severity",
    (battery, variant) => {
      render(<RobotCardFooter robot={{ ...robot, battery }} />);

      const badge = screen.getByLabelText(`Atlas battery ${battery}%`);
      expect(badge.textContent).toBe(`${battery}%`);
      expect(badge.getAttribute("data-variant")).toBe(variant);
    },
  );

  it.each<[FooterRobot["status"], string]>([
    ["Idle", "Ready for a task"],
    ["Charging", "Dock C-02"],
    ["Offline", "No telemetry received"],
  ])("shows the summary for %s without a task", (status, summary) => {
    render(<RobotCardFooter robot={{ ...robot, status }} />);

    expect(screen.getByText(summary)).toBeTruthy();
  });

  it("prioritizes the assigned task and shows its ETA", () => {
    render(<RobotCardFooter robot={{ ...robot, status: "Charging", task: {
      id: "TASK-42", title: "Deliver towels", progress: 65, distance: "12 m", eta: "30 s",
    } }} />);

    expect(screen.getByText("TASK-42")).toBeTruthy();
    expect(screen.getByText("30 s")).toBeTruthy();
    expect(screen.queryByText("Dock C-02")).toBeNull();
  });

  it.each([[12_900, 12], [0, 1]] as const)(
    "formats an offline sample aged %i ms as %i seconds",
    (ageMs, seconds) => {
      const now = Date.parse("2026-11-05T12:00:00Z");
      vi.spyOn(Date, "now").mockReturnValue(now);
      render(<RobotCardFooter robot={{ ...robot, status: "Offline", lastSeenAt: new Date(now - ageMs).toISOString() }} />);

      expect(screen.getByText(`Last seen ${seconds}s ago`)).toBeTruthy();
    },
  );
});
