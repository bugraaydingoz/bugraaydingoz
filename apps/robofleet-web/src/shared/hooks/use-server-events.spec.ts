import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TestEventSource } from "@/test/event-source";
import { useServerEvents } from "./use-server-events";

beforeEach(() => {
  TestEventSource.instances = [];
  vi.stubGlobal("EventSource", TestEventSource);
});

describe("useServerEvents", () => {
  it("reports transport status and lets EventSource handle reconnection", () => {
    const { result } = renderHook(() => useServerEvents("/events", {}));
    const source = TestEventSource.instances[0];

    expect(result.current).toBe("connecting");

    act(() => source.emit("open"));
    expect(result.current).toBe("live");

    act(() => source.emit("error"));
    expect(result.current).toBe("reconnecting");
    expect(source.close).not.toHaveBeenCalled();

    act(() => source.emit("open"));
    expect(result.current).toBe("live");
    expect(TestEventSource.instances).toHaveLength(1);
  });

  it("uses the latest callback without reconnecting", () => {
    const first = vi.fn();
    const next = vi.fn();
    const { rerender } = renderHook(
      ({ handler }) => useServerEvents("/events", { update: handler }),
      { initialProps: { handler: first } },
    );
    const source = TestEventSource.instances[0];

    act(() => source.emit("update", { sequence: 1 }));
    rerender({ handler: next });
    act(() => source.emit("update", { sequence: 2 }));

    expect(first).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0].data).toBe('{"sequence":2}');
    expect(TestEventSource.instances).toHaveLength(1);
  });

  it("reconnects for URL or event-name changes and cleans up old listeners", () => {
    const handler = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ url, name }) => useServerEvents(url, { [name]: handler }),
      { initialProps: { url: "/first", name: "update" } },
    );
    const first = TestEventSource.instances[0];
    rerender({ url: "/second", name: "update" });
    const second = TestEventSource.instances[1];
    rerender({ url: "/second", name: "changed" });
    const third = TestEventSource.instances[2];

    act(() => {
      first.emit("update", {});
      second.emit("update", {});
      third.emit("update", {});
      third.emit("changed", {});
    });

    expect(handler).toHaveBeenCalledOnce();
    expect(first.close).toHaveBeenCalledOnce();
    expect(second.close).toHaveBeenCalledOnce();
    expect(third.url).toBe("/second");

    unmount();
    act(() => third.emit("changed", {}));

    expect(handler).toHaveBeenCalledOnce();
    expect(third.close).toHaveBeenCalledOnce();
  });

  it("keeps the connection when event names are reordered", () => {
    const handler = vi.fn();
    const { rerender } = renderHook(
      ({ reversed }) =>
        useServerEvents(
          "/events",
          reversed
            ? { update: handler, snapshot: handler }
            : { snapshot: handler, update: handler },
        ),
      { initialProps: { reversed: false } },
    );

    rerender({ reversed: true });

    expect(TestEventSource.instances).toHaveLength(1);
  });

  it("cleans up Strict Mode's extra connection", () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useServerEvents("/events", { update: handler }), {
      reactStrictMode: true,
    });
    const [first, second] = TestEventSource.instances;

    act(() => {
      first.emit("update", {});
      second.emit("update", {});
    });

    expect(first.close).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledOnce();

    unmount();

    expect(second.close).toHaveBeenCalledOnce();
  });
});
