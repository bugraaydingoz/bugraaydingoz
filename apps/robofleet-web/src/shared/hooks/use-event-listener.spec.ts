import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TestEventSource } from "@/test/event-source";
import { useEventListener } from "./use-event-listener";

const options = { readyEvent: "snapshot", staleAfterMs: 15_000 };

beforeEach(() => {
  TestEventSource.instances = [];
  vi.stubGlobal("EventSource", TestEventSource);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function setup() {
  const listeners = {
    snapshot: vi.fn<(event: MessageEvent<string>) => boolean>(() => true),
    update: vi.fn(() => true),
  };
  const hook = renderHook(() => useEventListener("/events", listeners, options));

  return { ...hook, listeners, source: TestEventSource.instances[0] };
}

describe("useEventListener", () => {
  it("waits for an accepted snapshot, using one connection across renders", () => {
    const { source, listeners, result, rerender, unmount } = setup();

    expect(result.current).toBe("connecting");
    expect(source.url).toBe("/events");

    act(() => {
      source.emit("open");
      source.emit("update", {});
    });

    expect(result.current).toBe("connecting");

    act(() => source.emit("snapshot", { robots: [] }));
    rerender();

    expect(result.current).toBe("live");
    expect(TestEventSource.instances).toHaveLength(1);
    expect(listeners.snapshot).toHaveBeenCalledOnce();
    expect(listeners.snapshot.mock.calls[0][0].data).toBe('{"robots":[]}');

    unmount();
    source.emit("snapshot", { robots: [] });
    source.emit("error");
    act(() => vi.advanceTimersByTime(30_000));

    expect(source.close).toHaveBeenCalledOnce();
    expect(listeners.snapshot).toHaveBeenCalledOnce();
    expect(TestEventSource.instances).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("times out an open connection even if updates arrive before the first snapshot", () => {
    const { source, result } = setup();

    act(() => {
      source.emit("open");
      vi.advanceTimersByTime(10_000);
      source.emit("update", {});
      vi.advanceTimersByTime(5000);
    });

    expect(result.current).toBe("stale");
    expect(source.close).toHaveBeenCalledOnce();
  });

  it("renews the deadline for accepted snapshots and updates, but not rejected events", () => {
    const { source, listeners, result } = setup();

    act(() => {
      source.emit("snapshot", {});
      vi.advanceTimersByTime(10_000);
      source.emit("update", {});
      vi.advanceTimersByTime(10_000);
      source.emit("snapshot", {});
      vi.advanceTimersByTime(10_000);
    });
    listeners.update.mockReturnValue(false);
    listeners.snapshot.mockReturnValue(false);
    act(() => {
      source.emit("update", {});
      source.emit("snapshot", {});
      vi.advanceTimersByTime(4999);
    });

    expect(result.current).toBe("live");

    act(() => vi.advanceTimersByTime(1));

    expect(result.current).toBe("stale");
    expect(source.close).toHaveBeenCalledOnce();
  });

  it("keeps timed-out data stale through retries until a new snapshot is accepted", () => {
    const { source, listeners, result } = setup();

    act(() => {
      source.emit("snapshot", {});
      vi.advanceTimersByTime(15_000);
      source.emit("snapshot", {});
      source.emit("error");
      vi.advanceTimersByTime(1999);
    });

    expect(result.current).toBe("stale");
    expect(TestEventSource.instances).toHaveLength(1);
    expect(listeners.snapshot).toHaveBeenCalledOnce();

    act(() => vi.advanceTimersByTime(1));
    const second = TestEventSource.instances[1];
    act(() => {
      second.emit("open");
      second.emit("update", {});
      second.emit("error");
      vi.advanceTimersByTime(2000);
    });

    expect(result.current).toBe("stale");
    expect(second.close).toHaveBeenCalledOnce();
    expect(TestEventSource.instances).toHaveLength(3);

    act(() => TestEventSource.instances[2].emit("snapshot", {}));

    expect(result.current).toBe("live");

    act(() => TestEventSource.instances[2].emit("error"));

    expect(result.current).toBe("reconnecting");
  });

  it("closes failed connections and waits for a snapshot after retrying in two seconds", () => {
    const { source, listeners, result, unmount } = setup();

    act(() => {
      source.emit("error");
      source.emit("error");
      source.emit("update", {});
      vi.advanceTimersByTime(1999);
    });

    expect(result.current).toBe("reconnecting");
    expect(source.close).toHaveBeenCalledOnce();
    expect(listeners.update).not.toHaveBeenCalled();
    expect(TestEventSource.instances).toHaveLength(1);

    act(() => vi.advanceTimersByTime(1));
    const second = TestEventSource.instances[1];
    act(() => second.emit("open"));

    expect(result.current).toBe("reconnecting");

    act(() => second.emit("snapshot", {}));

    expect(result.current).toBe("live");

    act(() => second.emit("error"));
    unmount();
    act(() => vi.advanceTimersByTime(30_000));

    expect(TestEventSource.instances).toHaveLength(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("checks the monotonic deadline when a background tab becomes visible", () => {
    const { source, result, unmount } = setup();
    act(() => source.emit("snapshot", {}));

    // Simulate a suspended tab: elapsed time advances while timers do not run.
    const now = performance.now();
    vi.spyOn(performance, "now").mockReturnValue(now + 15_000);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    act(() => document.dispatchEvent(new Event("visibilitychange")));

    expect(result.current).toBe("live");

    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    act(() => document.dispatchEvent(new Event("visibilitychange")));

    expect(result.current).toBe("stale");
    expect(source.close).toHaveBeenCalledOnce();

    unmount();
    act(() => document.dispatchEvent(new Event("visibilitychange")));

    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not let a delayed event hide a timeout before the watchdog runs", () => {
    const { source, listeners, result } = setup();
    act(() => source.emit("snapshot", {}));
    vi.spyOn(performance, "now").mockReturnValue(performance.now() + 15_000);
    act(() => source.emit("snapshot", {}));

    expect(result.current).toBe("stale");
    expect(listeners.snapshot).toHaveBeenCalledOnce();
    expect(source.close).toHaveBeenCalledOnce();
  });

  it("does not expire early when the system clock changes", () => {
    const { source, result } = setup();
    act(() => source.emit("snapshot", {}));
    vi.setSystemTime(Date.now() + 60_000);
    act(() => vi.advanceTimersByTime(14_999));

    expect(result.current).toBe("live");

    act(() => vi.advanceTimersByTime(1));

    expect(result.current).toBe("stale");
  });

  it.each(["retry", "watchdog"])("cancels the old %s when the URL changes", (pending) => {
    const listeners = { snapshot: vi.fn(() => true) };
    const { result, rerender } = renderHook(
      ({ url }) => useEventListener(url, listeners, options),
      { initialProps: { url: "/first" } },
    );
    const first = TestEventSource.instances[0];
    act(() => {
      vi.advanceTimersByTime(1000);
      if (pending === "retry") first.emit("error");
    });
    rerender({ url: "/second" });
    act(() => vi.advanceTimersByTime(14_000));

    expect(result.current).toBe("connecting");
    expect(first.close).toHaveBeenCalledOnce();
    expect(TestEventSource.instances.map((source) => source.url)).toEqual(["/first", "/second"]);
  });

  it("cleans up the extra Strict Mode subscription", () => {
    const listeners = { snapshot: vi.fn(() => true) };
    const { unmount } = renderHook(() => useEventListener("/events", listeners, options), {
      reactStrictMode: true,
    });
    expect(TestEventSource.instances).toHaveLength(2);
    const [first, second] = TestEventSource.instances;

    act(() => {
      first.emit("snapshot", {});
      second.emit("snapshot", {});
    });

    expect(first.close).toHaveBeenCalledOnce();
    expect(second.close).not.toHaveBeenCalled();
    expect(listeners.snapshot).toHaveBeenCalledOnce();

    unmount();
    act(() => vi.advanceTimersByTime(30_000));

    expect(second.close).toHaveBeenCalledOnce();
    expect(TestEventSource.instances).toHaveLength(2);
    expect(vi.getTimerCount()).toBe(0);
  });
});
