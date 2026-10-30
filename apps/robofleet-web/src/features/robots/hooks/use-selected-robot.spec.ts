import { act, renderHook } from "@testing-library/react";
import { withNuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";
import { useSelectedRobot } from "./use-selected-robot";

describe("useSelectedRobot", () => {
  it("starts without a selection when the robot parameter is absent", () => {
    const { result } = renderHook(useSelectedRobot, {
      wrapper: withNuqsTestingAdapter(),
    });

    expect(result.current[0]).toBeNull();
  });

  it.each(["", "a".repeat(101)])("ignores an invalid robot ID: %s", (robot) => {
    const { result } = renderHook(useSelectedRobot, {
      wrapper: withNuqsTestingAdapter({ searchParams: { robot } }),
    });

    expect(result.current[0]).toBeNull();
  });

  it("reads a deep link and removes selection without changing other parameters", async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    const { result } = renderHook(useSelectedRobot, {
      wrapper: withNuqsTestingAdapter({
        searchParams: "?robot=AMR-002&filter=active&view=hotel",
        hasMemory: true,
        onUrlUpdate,
      }),
    });

    expect(result.current[0]).toBe("AMR-002");

    await act(async () => {
      await result.current[1](null);
    });

    expect(result.current[0]).toBeNull();
    const update = onUrlUpdate.mock.lastCall![0];
    expect(update.searchParams.has("robot")).toBe(false);
    expect(update.searchParams.get("filter")).toBe("active");
    expect(update.searchParams.get("view")).toBe("hotel");
    expect(update.options.history).toBe("push");
  });
});
