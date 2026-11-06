import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RobotCardRoute } from "./RobotCardRoute";

describe("RobotCardRoute", () => {
  it("shows the current location and destination with full text in titles", () => {
    render(<RobotCardRoute location="Lobby" destination="Room 204" />);

    expect(screen.getByText("Current location")).toBeTruthy();
    expect(screen.getByText("Destination")).toBeTruthy();
    expect(screen.getByTitle("Lobby").textContent).toBe("Lobby");
    expect(screen.getByTitle("Room 204").textContent).toBe("Room 204");
  });

  it("replaces an unassigned destination when a route is assigned", () => {
    const { rerender } = render(<RobotCardRoute location="Lobby" destination={null} />);

    expect(screen.getByTitle("Unassigned").textContent).toBe("Unassigned");

    rerender(<RobotCardRoute location="Lift" destination="Room 204" />);

    expect(screen.queryByText("Unassigned")).toBeNull();
    expect(screen.getByTitle("Lift").textContent).toBe("Lift");
    expect(screen.getByTitle("Room 204").textContent).toBe("Room 204");
  });
});
