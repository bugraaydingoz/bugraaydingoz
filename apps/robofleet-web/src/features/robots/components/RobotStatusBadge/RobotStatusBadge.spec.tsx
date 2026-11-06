import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RobotStatus } from "@/features/robots/types/robot";
import { RobotStatusBadge } from "./RobotStatusBadge";

describe("RobotStatusBadge", () => {
  it.each<[RobotStatus, string]>([
    ["Working", "success"],
    ["Blocked", "destructive"],
    ["Charging", "secondary"],
    ["Idle", "secondary"],
    ["Offline", "secondary"],
  ])("shows %s with the appropriate severity", (status, variant) => {
    render(<RobotStatusBadge status={status} />);

    expect(screen.getByText(status).getAttribute("data-variant")).toBe(variant);
  });
});
