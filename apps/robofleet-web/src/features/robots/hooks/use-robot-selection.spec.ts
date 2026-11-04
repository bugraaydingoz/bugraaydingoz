import { act, renderHook } from "@testing-library/react";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRobotsStore } from "../stores/robots.store";
import { useRobotSelection } from "./use-robot-selection";

beforeEach(() => useRobotsStore.setState({ hoveredId: null }));

describe("useRobotSelection", () => {
  it("reads URL selection and scrolls the selected card when selection or filter changes", async () => {
    const { result, rerender } = renderHook(
      ({ filter }: { filter: "all" | "active" }) => useRobotSelection(filter),
      {
        initialProps: { filter: "all" },
        wrapper: withNuqsTestingAdapter({ searchParams: "?robot=AMR-001", hasMemory: true }),
      },
    );
    const card = document.createElement("li");
    const scrollIntoView = vi.fn();
    card.scrollIntoView = scrollIntoView;
    result.current.selectedCard.current = card;

    expect(result.current.selectedId).toBe("AMR-001");

    rerender({ filter: "all" });

    expect(scrollIntoView).not.toHaveBeenCalled();

    rerender({ filter: "active" });

    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: "nearest" });

    await act(async () => {
      await result.current.setSelectedId("AMR-002");
    });

    expect(result.current.selectedId).toBe("AMR-002");
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it("exposes the hover action and handles clearing selection without a mounted card", async () => {
    const { result } = renderHook(() => useRobotSelection("all"), {
      wrapper: withNuqsTestingAdapter({ searchParams: "?robot=AMR-001", hasMemory: true }),
    });

    act(() => result.current.hoverRobot("AMR-002"));

    expect(useRobotsStore.getState().hoveredId).toBe("AMR-002");

    act(() => result.current.hoverRobot(null));

    expect(useRobotsStore.getState().hoveredId).toBeNull();

    await act(async () => {
      await result.current.setSelectedId(null);
    });

    expect(result.current.selectedId).toBeNull();
    expect(result.current.selectedCard.current).toBeNull();
  });
});
