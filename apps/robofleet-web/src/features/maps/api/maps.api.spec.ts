import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import fixture from "@/test/fleet.json";
import { getMaps } from "./maps.api";
import { mapsQueryKey, mapsQueryOptions } from "./maps.queries";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("getMaps", () => {
  it("returns validated maps and accepts an empty list", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ maps: fixture.maps }));

    await expect(getMaps()).resolves.toEqual(fixture.maps);

    fetchMock.mockResolvedValueOnce(Response.json({ maps: [] }));

    await expect(getMaps()).resolves.toEqual([]);
  });

  it.each([
    {},
    { maps: null },
    { maps: [{ ...fixture.maps[0], version: 0 }] },
    {
      maps: [
        { ...fixture.maps[0], definition: { ...fixture.maps[0].definition, metresPerUnit: 0 } },
      ],
    },
    {
      maps: [
        { ...fixture.maps[0], definition: { ...fixture.maps[0].definition, edges: [[0, 999]] } },
      ],
    },
  ])("rejects an invalid maps response: %j", async (body) => {
    fetchMock.mockResolvedValueOnce(Response.json(body));

    await expect(getMaps()).rejects.toThrow("Invalid maps response");
  });

  it("reports invalid JSON without exposing parser details", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{"));

    await expect(getMaps()).rejects.toThrow("Invalid maps response");
  });

  it("keeps HTTP failures distinct from invalid responses", async () => {
    fetchMock.mockResolvedValueOnce(new Response("unavailable", { status: 503 }));

    await expect(getMaps()).rejects.toThrow("Unable to load maps");
  });

  it("preserves validated maps when a refetch is invalid", async () => {
    const client = new QueryClient();
    const options = { ...mapsQueryOptions(), staleTime: 0, retry: false };
    fetchMock.mockResolvedValueOnce(Response.json({ maps: fixture.maps }));
    await client.fetchQuery(options);
    const cached = client.getQueryData(mapsQueryKey);
    fetchMock.mockResolvedValueOnce(Response.json({ maps: [{ ...fixture.maps[0], version: 0 }] }));

    try {
      await expect(client.fetchQuery(options)).rejects.toThrow("Invalid maps response");
      expect(client.getQueryData(mapsQueryKey)).toBe(cached);
    } finally {
      client.clear();
    }
  });
});
