import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { robotsQueryKey } from "@/features/robots/api/robots.queries";
import { mapsQueryKey } from "@/features/maps/api/maps.queries";
import fixture from "@/test/fleet.json";
import { TestEventSource } from "@/test/event-source";
import type { FleetRobot } from "@/features/robots/api/robots.api";
import type { FleetMap } from "@/features/maps/api/maps.api";
import {
  act,
  fireEvent,
  render as renderReact,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { useRobotsStore } from "@/features/robots/stores/robots.store";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";

const render = (node: React.ReactNode) => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, gcTime: Infinity } },
  });

  client.setQueryData(robotsQueryKey, fixture.robots as FleetRobot[]);
  client.setQueryData(mapsQueryKey, fixture.maps as FleetMap[]);

  return {
    client,
    ...renderReact(
      <NuqsTestingAdapter searchParams="?robot=AMR-001" hasMemory>
        <QueryClientProvider client={client}>{node}</QueryClientProvider>
      </NuqsTestingAdapter>,
    ),
  };
};

beforeEach(() => {
  useRobotsStore.setState({ hoveredId: null });
  TestEventSource.instances = [];
  vi.stubGlobal("EventSource", TestEventSource);
});

describe("Robots panel", () => {
  it("replaces the scaffold with fleet cards and the first robot's task details", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Robots" })).toBeTruthy();
    expect(
      within(screen.getByRole("list", { name: "Robots" })).getAllByRole("listitem"),
    ).toHaveLength(8);
    expect(
      screen.getByRole("progressbar", { name: "Delivering towels" }).getAttribute("aria-valuenow"),
    ).toBe("64");
    expect(screen.getByLabelText("Atlas battery 84%")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "API Health Check" })).toBeNull();
    expect(
      within(screen.getByRole("navigation", { name: "Main navigation" })).getAllByRole("button"),
    ).toHaveLength(5);
  });

  it("expands one robot at a time and allows details to collapse", () => {
    render(<App />);
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
    render(<App />);
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
  it("links map selection to the card and reveals robots hidden by a filter", () => {
    render(<App />);
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
    const { client } = render(<App />);
    const source = TestEventSource.instances[0];
    const robot = { ...fixture.robots[0], name: "Updated Atlas", sequence: 2, battery: 70.4 };

    act(() => {
      source.emit("open");
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
