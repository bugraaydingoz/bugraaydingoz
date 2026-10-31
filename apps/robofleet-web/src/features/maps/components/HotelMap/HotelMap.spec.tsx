import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithFleet } from "@/test/render-with-fleet";
import { TestEventSource } from "@/test/event-source";
import fixture from "@/test/fleet.json";
import type { FleetRobot } from "@/features/robots/api/robots.api";
import { robotsQueryKey } from "@/features/robots/api/robots.queries";
import { mapsQueryKey } from "../../api/maps.queries";
import { useRobotEvents } from "@/features/robots/hooks/use-robot-events";
import { useRobotsStore } from "@/features/robots/stores/robots.store";
import { RobotsPanel } from "@/features/robots/components/RobotsPanel/RobotsPanel";
import { HotelMap } from "./HotelMap";

function FleetMap() {
  const connection = useRobotEvents();

  return (
    <>
      <RobotsPanel connection={connection} />
      <HotelMap />
    </>
  );
}

beforeEach(() => {
  useRobotsStore.setState({ hoveredId: null });
  TestEventSource.instances = [];
  vi.stubGlobal("EventSource", TestEventSource);
});

describe("HotelMap", () => {
  it("links map selection to the card and reveals robots hidden by a filter", () => {
    renderWithFleet(<FleetMap />);
    fireEvent.click(screen.getByRole("button", { name: "Attention 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Select Scout on map" }));
    expect(screen.getByRole("button", { name: "All robots" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Scout details" }).getAttribute("aria-expanded"),
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: "Select Scout on map" }).getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Nova details" }));
    expect(
      screen.getByRole("button", { name: "Select Nova on map" }).getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("updates both query subscribers from one SSE subscription", async () => {
    const { client } = renderWithFleet(<FleetMap />);
    const source = TestEventSource.instances[0];
    const robot = { ...fixture.robots[0], name: "Updated Atlas", sequence: 2, battery: 70.4 };

    act(() => {
      source.emit("open");
      source.emit("fleet.snapshot", { robots: fixture.robots });
      source.emit("robot.updated", { robot });
    });

    await waitFor(() => {
      expect(screen.getByRole("article", { name: "Updated Atlas" })).toBeTruthy();
      expect(screen.getByLabelText("Updated Atlas battery 70%")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Select Updated Atlas on map" })).toBeTruthy();
    });

    expect(screen.getByRole("status").textContent).toBe("Live simulator");
    expect(client.getQueryData<FleetRobot[]>(robotsQueryKey)?.[0]).toEqual(robot);
    expect(TestEventSource.instances).toHaveLength(1);

    act(() => client.setQueryData(mapsQueryKey, []));

    await waitFor(() => {
      expect(screen.queryByRole("group", { name: "Hotel robot positions" })).toBeNull();
      expect(screen.getByText("0 facilities")).toBeTruthy();
    });
  });
});
