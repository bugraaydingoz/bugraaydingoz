import { fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithFleet } from "@/test/render-with-fleet";
import type { EventConnection } from "@/shared/hooks/use-event-listener";
import { useRobotsStore } from "../../stores/robots.store";
import { RobotsPanel } from "./RobotsPanel";

beforeEach(() => useRobotsStore.setState({ hoveredId: null }));

describe("RobotsPanel", () => {
  it.each<[EventConnection, string]>([
    ["connecting", "Connecting…"],
    ["live", "Live simulator"],
    ["reconnecting", "Reconnecting…"],
    ["stale", "Updates paused · reconnecting…"],
  ])("keeps cached cards visible while reporting %s", (connection, message) => {
    renderWithFleet(<RobotsPanel connection={connection} />);

    expect(screen.getByRole("status").textContent).toBe(message);
    expect(screen.getAllByRole("article")).toHaveLength(8);
  });

  it("shows fleet cards and the selected robot's task details", () => {
    renderWithFleet(<RobotsPanel connection="live" />);
    expect(screen.getByRole("heading", { name: "Robots" })).toBeTruthy();
    expect(
      within(screen.getByRole("list", { name: "Robots" })).getAllByRole("listitem"),
    ).toHaveLength(8);
    expect(
      screen.getByRole("progressbar", { name: "Delivering towels" }).getAttribute("aria-valuenow"),
    ).toBe("64");
    expect(screen.getByLabelText("Atlas battery 84%")).toBeTruthy();
  });

  it("expands one robot at a time and allows details to collapse", () => {
    renderWithFleet(<RobotsPanel connection="live" />);
    fireEvent.click(screen.getByText("Reception dock"));
    expect(screen.getByRole("button", { name: "Nova details" }).getAttribute("aria-expanded")).toBe(
      "true",
    );
    expect(
      screen.getByText("Charging at dock C-02. Ready in approximately 24 minutes."),
    ).toBeTruthy();
    expect(screen.queryByRole("progressbar", { name: "Delivering towels" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Nova details" }));
    expect(screen.getByRole("button", { name: "Nova details" }).getAttribute("aria-expanded")).toBe(
      "false",
    );
    expect(
      screen.queryByText("Charging at dock C-02. Ready in approximately 24 minutes."),
    ).toBeNull();
  });

  it("filters active and attention robots without showing unrelated cards", () => {
    renderWithFleet(<RobotsPanel connection="live" />);
    fireEvent.click(screen.getByRole("button", { name: "Attention 2" }));
    expect(
      within(screen.getByRole("list", { name: "Robots" })).getAllByRole("listitem"),
    ).toHaveLength(2);
    expect(screen.getByRole("article", { name: "Bolt" })).toBeTruthy();
    expect(screen.getByRole("article", { name: "Milo" })).toBeTruthy();
    expect(screen.queryByRole("article", { name: "Atlas" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Active 4" }));
    expect(
      within(screen.getByRole("list", { name: "Robots" })).getAllByRole("listitem"),
    ).toHaveLength(4);
    expect(screen.queryByRole("article", { name: "Bolt" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "All robots" }));
    expect(
      within(screen.getByRole("list", { name: "Robots" })).getAllByRole("listitem"),
    ).toHaveLength(8);
  });
});
