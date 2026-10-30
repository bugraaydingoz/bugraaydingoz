import { StrictMode, createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TestEventSource } from "@/test/event-source";
import { useEventListener } from "./use-event-listener";

beforeEach(() => {
  TestEventSource.instances = [];
  vi.stubGlobal("EventSource", TestEventSource);
  vi.useFakeTimers();
});

afterEach(() => vi.useRealTimers());

describe("useEventListener", () => {
  it("uses one connection for all named events and keeps it across renders", () => {
    const snapshot = vi.fn();
    const update = vi.fn();
    const listeners = { "fleet.snapshot": snapshot, "robot.updated": update };
    const { result, rerender, unmount } = renderHook(() =>
      useEventListener("/api/events", listeners),
    );
    const source = TestEventSource.instances[0];

    expect(result.current).toBe("connecting");
    expect(source.url).toBe("/api/events");

    act(() => {
      source.emit("open");
      source.emit("fleet.snapshot", { robots: [] });
      source.emit("robot.updated", { robot: { robotId: "robot" } });
    });
    rerender();

    expect(result.current).toBe("live");
    expect(TestEventSource.instances).toHaveLength(1);
    expect(snapshot).toHaveBeenCalledOnce();
    expect(snapshot.mock.calls[0][0].data).toBe('{"robots":[]}');
    expect(update).toHaveBeenCalledOnce();

    unmount();
    source.emit("fleet.snapshot", { robots: [] });
    source.emit("error");
    act(() => vi.advanceTimersByTime(2000));

    expect(source.close).toHaveBeenCalledOnce();
    expect(snapshot).toHaveBeenCalledOnce();
    expect(TestEventSource.instances).toHaveLength(1);
  });

  it("closes failed connections, retries once after two seconds, and recovers", () => {
    const handler = vi.fn();
    const listeners = { update: handler };
    const { result, unmount } = renderHook(() => useEventListener("/events", listeners));
    const first = TestEventSource.instances[0];

    act(() => {
      first.emit("error");
      first.emit("error");
      first.emit("open");
      first.emit("update", {});
      vi.advanceTimersByTime(1999);
    });

    expect(result.current).toBe("reconnecting");
    expect(first.close).toHaveBeenCalledOnce();
    expect(handler).not.toHaveBeenCalled();
    expect(TestEventSource.instances).toHaveLength(1);

    act(() => vi.advanceTimersByTime(1));
    const second = TestEventSource.instances[1];

    expect(TestEventSource.instances).toHaveLength(2);

    act(() => {
      second.emit("open");
      second.emit("update", {});
    });

    expect(result.current).toBe("live");
    expect(handler).toHaveBeenCalledOnce();

    act(() => second.emit("error"));
    unmount();
    act(() => vi.advanceTimersByTime(10_000));

    expect(TestEventSource.instances).toHaveLength(2);
  });

  it("cancels a pending retry when the URL changes", () => {
    const listeners = { update: vi.fn() };
    const { result, rerender } = renderHook(({ url }) => useEventListener(url, listeners), {
      initialProps: { url: "/first" },
    });

    act(() => TestEventSource.instances[0].emit("error"));
    rerender({ url: "/second" });
    act(() => vi.advanceTimersByTime(2000));

    expect(result.current).toBe("connecting");
    expect(TestEventSource.instances.map((source) => source.url)).toEqual(["/first", "/second"]);
  });

  it("cleans up the extra Strict Mode subscription", () => {
    const handler = vi.fn();
    const listeners = { update: handler };
    const { unmount } = renderHook(() => useEventListener("/events", listeners), {
      wrapper: ({ children }: { children: ReactNode }) => createElement(StrictMode, null, children),
    });
    const [first, second] = TestEventSource.instances;

    first.emit("update", {});
    second.emit("update", {});

    expect(TestEventSource.instances).toHaveLength(2);
    expect(first.close).toHaveBeenCalledOnce();
    expect(second.close).not.toHaveBeenCalled();
    expect(handler).toHaveBeenCalledOnce();

    unmount();

    expect(second.close).toHaveBeenCalledOnce();
  });
});
