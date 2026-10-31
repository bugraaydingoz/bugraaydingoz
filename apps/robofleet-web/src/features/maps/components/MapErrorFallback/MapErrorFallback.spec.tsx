import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import { renderWithFleet } from "@/test/render-with-fleet";
import { TestEventSource } from "@/test/event-source";
import fixture from "@/test/fleet.json";
import { mapsQueryKey } from "../../api/maps.queries";

const mapState = vi.hoisted(() => ({ broken: true }));

// Simulate a rendering bug without changing or depending on the map renderer.
vi.mock("@/features/maps/components/HotelMap/HotelMap", () => ({
  HotelMap: () => {
    if (mapState.broken) throw new Error("Synthetic map failure");

    return <p>Map ready</p>;
  },
}));

const fetchMock = vi.fn<typeof fetch>();

function preventExpectedError(event: ErrorEvent) {
  if (event.error?.message === "Synthetic map failure") event.preventDefault();
}

beforeEach(() => {
  mapState.broken = true;
  TestEventSource.instances = [];
  vi.stubGlobal("EventSource", TestEventSource);
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
  window.addEventListener("error", preventExpectedError);
});

afterEach(() => {
  window.removeEventListener("error", preventExpectedError);
  vi.restoreAllMocks();
});

describe("MapErrorFallback", () => {
  it("keeps fleet events running and waits for both validated responses before remounting the map", async () => {
    let finishMaps!: (response: Response) => void;
    fetchMock.mockImplementation((input) =>
      String(input).endsWith("/api/maps")
        ? new Promise<Response>((resolve) => {
            finishMaps = resolve;
          })
        : Promise.resolve(Response.json({ robots: fixture.robots })),
    );
    renderWithFleet(<App />);
    const source = TestEventSource.instances[0];

    expect(screen.getByRole("heading", { name: "Map unavailable" })).toBeTruthy();
    expect(screen.getAllByRole("article")).toHaveLength(8);

    act(() => {
      source.emit("fleet.snapshot", { robots: fixture.robots });
      source.emit("robot.updated", {
        robot: { ...fixture.robots[0], sequence: 2, name: "Live Atlas", battery: 70 },
      });
    });
    await waitFor(() => expect(screen.getByLabelText("Live Atlas battery 70%")).toBeTruthy());

    mapState.broken = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    expect(screen.queryByText("Map ready")).toBeNull();
    expect(screen.getByRole("button", { name: "Retrying…" }).hasAttribute("disabled")).toBe(true);

    await act(async () => finishMaps(Response.json({ maps: fixture.maps })));
    await waitFor(() => expect(screen.getByText("Map ready")).toBeTruthy());

    expect(screen.getByRole("status").textContent).toBe("Live simulator");
    expect(
      screen.getByRole("button", { name: "Live Atlas details" }).getAttribute("aria-expanded"),
    ).toBe("true");
    expect(TestEventSource.instances).toHaveLength(1);
    expect(source.close).not.toHaveBeenCalled();
  });

  it("retains cached data and the fallback when refetch validation fails, then allows another attempt", async () => {
    let validMaps = false;
    fetchMock.mockImplementation(async (input) =>
      Response.json(
        String(input).endsWith("/api/maps")
          ? { maps: validMaps ? fixture.maps : [{ ...fixture.maps[0], version: 0 }] }
          : { robots: fixture.robots },
      ),
    );
    const { client } = renderWithFleet(<App />);
    const cachedMaps = client.getQueryData(mapsQueryKey);
    mapState.broken = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() =>
      expect(screen.getByText("Recovery failed. Please try again.")).toBeTruthy(),
    );

    expect(screen.queryByText("Map ready")).toBeNull();
    expect(screen.getAllByRole("article")).toHaveLength(8);
    expect(client.getQueryData(mapsQueryKey)).toBe(cachedMaps);
    expect(screen.getByRole("button", { name: "Try again" }).hasAttribute("disabled")).toBe(false);

    validMaps = true;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getByText("Map ready")).toBeTruthy());

    expect(TestEventSource.instances).toHaveLength(1);
    expect(TestEventSource.instances[0].close).not.toHaveBeenCalled();
  });

  it("contains a persistent rendering failure after successful refetches", async () => {
    fetchMock.mockImplementation(async (input) =>
      Response.json(
        String(input).endsWith("/api/maps") ? { maps: fixture.maps } : { robots: fixture.robots },
      ),
    );
    renderWithFleet(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(screen.getByRole("button", { name: "Try again" }).hasAttribute("disabled")).toBe(
        false,
      );
    });

    expect(screen.getByRole("heading", { name: "Map unavailable" })).toBeTruthy();
    expect(screen.getAllByRole("article")).toHaveLength(8);
    expect(TestEventSource.instances).toHaveLength(1);
  });
});
