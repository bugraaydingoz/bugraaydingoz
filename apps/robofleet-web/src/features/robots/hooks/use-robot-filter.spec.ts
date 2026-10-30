import { act, renderHook } from "@testing-library/react";
import { withNuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { useRobotFilter } from "./use-robot-filter";

describe("useRobotFilter", () => {
  it.each(["", "?filter=invalid"])("falls back to all for %s", (searchParams) => {
    const { result } = renderHook(useRobotFilter, {
      wrapper: withNuqsTestingAdapter({ searchParams }),
    });

    expect(result.current[0]).toBe("all");
  });

  it("reads a filter and removes its parameter when returning to all", async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    const { result } = renderHook(useRobotFilter, {
      wrapper: withNuqsTestingAdapter({
        searchParams: "?filter=attention&robot=AMR-006",
        hasMemory: true,
        onUrlUpdate,
      }),
    });

    expect(result.current[0]).toBe("attention");

    await act(async () => {
      await result.current[1]("all");
    });

    expect(result.current[0]).toBe("all");
    const update = onUrlUpdate.mock.lastCall![0];
    expect(update.searchParams.has("filter")).toBe(false);
    expect(update.searchParams.get("robot")).toBe("AMR-006");
    expect(update.options.history).toBe("push");
  });
});
