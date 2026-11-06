import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RobotCardTask } from "./RobotCardTask";

const task = { id: "TASK-42", title: "Deliver towels", progress: 65, distance: "12 m", eta: "30 s" };

describe("RobotCardTask", () => {
  it("shows task progress and delivery details", () => {
    render(<RobotCardTask task={task} status="Working" detail="Following route" />);

    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("65");
    expect(screen.getByText("Deliver towels")).toBeTruthy();
    for (const text of ["Task ID", "TASK-42", "Distance left", "12 m", "Est. arrival", "30 s"]) {
      expect(screen.getByText(text)).toBeTruthy();
    }
    expect(screen.queryByText("Following route")).toBeNull();
  });

  it("shows the blocking reason and removes it when work resumes", () => {
    const { rerender } = render(
      <RobotCardTask task={task} status="Blocked" detail="Corridor obstructed" />,
    );
    expect(screen.getByText("Corridor obstructed")).toBeTruthy();

    rerender(<RobotCardTask task={{ ...task, progress: 70 }} status="Working" detail="Corridor obstructed" />);

    expect(screen.queryByText("Corridor obstructed")).toBeNull();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("70");
  });
});
