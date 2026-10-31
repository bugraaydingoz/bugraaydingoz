import { useEffect, useState } from "react";

export type EventConnection = "connecting" | "live" | "reconnecting" | "stale";

// Return true only when a payload was validated and accepted.
type EventListeners = Record<string, (event: MessageEvent<string>) => boolean>;

type EventOptions = { readyEvent: string; staleAfterMs: number };

// Keep the listeners object stable to retain the connection across renders.
export function useEventListener(
  url: string,
  listeners: EventListeners,
  { readyEvent, staleAfterMs }: EventOptions,
): EventConnection {
  const [connection, setConnection] = useState<EventConnection>("connecting");

  useEffect(() => {
    let stopped = false;
    let stale = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let disconnect = () => {};
    let checkFreshness = () => {};

    const connect = () => {
      const source = new EventSource(url);
      let active = true;
      let synchronized = false;
      let deadline = performance.now() + staleAfterMs;
      let watchdogTimer: ReturnType<typeof setTimeout> | undefined;

      const reconnect = (expired: boolean) => {
        if (!active) return;

        disconnect();
        stale ||= expired;
        setConnection(stale ? "stale" : "reconnecting");
        retryTimer = setTimeout(() => {
          if (!stopped) connect();
        }, 2000);
      };

      const watch = () => {
        if (!active) return;

        const remaining = deadline - performance.now();

        if (remaining <= 0) {
          reconnect(true);
          return;
        }

        clearTimeout(watchdogTimer);
        watchdogTimer = setTimeout(watch, remaining);
      };

      checkFreshness = watch;

      const handlers = Object.entries(listeners).map(([name, handler]) => {
        const listener: EventListener = (event) => {
          if (!active) return;

          // A delayed event must not hide a timeout after a suspended tab resumes.
          if (performance.now() >= deadline) {
            reconnect(true);
            return;
          }

          if (!handler(event as MessageEvent<string>)) return;

          if (name === readyEvent) synchronized = true;
          if (!synchronized) return;

          stale = false;
          deadline = performance.now() + staleAfterMs;
          setConnection("live");
          watch();
        };

        source.addEventListener(name, listener);

        return { name, listener };
      });

      const onError = () => {
        reconnect(performance.now() >= deadline);
      };

      disconnect = () => {
        if (!active) return;

        active = false;
        clearTimeout(watchdogTimer);
        source.removeEventListener("error", onError);

        for (const { name, listener } of handlers) {
          source.removeEventListener(name, listener);
        }

        source.close();
      };

      source.addEventListener("error", onError);
      watch();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkFreshness();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    setConnection("connecting");
    connect();

    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [url, listeners, readyEvent, staleAfterMs]);

  return connection;
}
