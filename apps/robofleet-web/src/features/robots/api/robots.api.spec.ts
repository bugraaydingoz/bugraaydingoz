import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import fixture from "@/test/fleet.json";
import { getRobots } from "./robots.api";
import { robotsQueryKey, robotsQueryOptions } from "./robots.queries";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("getRobots", () => {
  it("returns validated fleet data, including offline robots and empty fleets", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ robots: fixture.robots }));

    await expect(getRobots()).resolves.toEqual(fixture.robots);

    fetchMock.mockResolvedValueOnce(Response.json({ robots: [] }));

    await expect(getRobots()).resolves.toEqual([]);
  });

  it.each([
    {},
    { robots: null },
    { robots: [fixture.robots[0], { ...fixture.robots[1], color: "red" }] },
    { robots: [{ ...fixture.robots[0], position: { x: "invalid" } }] },
  ])("rejects an invalid fleet response: %j", async (body) => {
    fetchMock.mockResolvedValueOnce(Response.json(body));

    await expect(getRobots()).rejects.toThrow("Invalid fleet response");
  });

  it("reports invalid JSON without exposing parser details", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{"));

    await expect(getRobots()).rejects.toThrow("Invalid fleet response");
  });

  it("keeps HTTP failures distinct from invalid responses", async () => {
    fetchMock.mockResolvedValueOnce(new Response("unavailable", { status: 503 }));

    await expect(getRobots()).rejects.toThrow("Unable to load fleet");
  });

  it("preserves the last validated fleet when a refetch is invalid", async () => {
    const client = new QueryClient();
    const options = { ...robotsQueryOptions(client), retry: false };
    fetchMock.mockResolvedValueOnce(Response.json({ robots: fixture.robots }));
    await client.fetchQuery(options);
    const cached = client.getQueryData(robotsQueryKey);
    fetchMock.mockResolvedValueOnce(
      Response.json({ robots: [{ ...fixture.robots[0], color: "red" }] }),
    );

    try {
      await expect(client.fetchQuery(options)).rejects.toThrow("Invalid fleet response");
      expect(client.getQueryData(robotsQueryKey)).toBe(cached);
      expect(client.getQueryState(robotsQueryKey)?.status).toBe("error");
    } finally {
      client.clear();
    }
  });
});
