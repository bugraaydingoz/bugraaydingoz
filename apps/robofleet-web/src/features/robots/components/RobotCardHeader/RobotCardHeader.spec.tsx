import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RobotCardHeader } from "./RobotCardHeader";

const robot = { id: "AMR-001", name: "Atlas", status: "Working" as const };

describe("RobotCardHeader", () => {
  it("labels the details control and identifies the robot", () => {
    render(<RobotCardHeader robot={robot} expanded={false} />);

    const button = screen.getByRole("button", { name: "Atlas details" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.getAttribute("aria-controls")).toBe("AMR-001-details");
    expect(screen.getByText("Atlas").id).toBe("AMR-001-name");
    expect(screen.getByText("AMR-001")).toBeTruthy();
    expect(screen.getByText("Working")).toBeTruthy();
  });

  it("updates expansion and status when props change", () => {
    const { rerender } = render(<RobotCardHeader robot={robot} expanded={false} />);

    rerender(<RobotCardHeader robot={{ ...robot, status: "Blocked" }} expanded />);

    expect(screen.getByRole("button").getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Blocked")).toBeTruthy();
    expect(screen.queryByText("Working")).toBeNull();
  });
});
