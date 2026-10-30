import { useEffect, useState } from "react";

export type EventConnection = "connecting" | "live" | "reconnecting";

type EventListeners = Record<string, (event: MessageEvent<string>) => void>;

// Keep the listeners object stable to retain the connection across renders.
export function useEventListener(url: string, listeners: EventListeners): EventConnection {
  const [connection, setConnection] = useState<EventConnection>("connecting");

  useEffect(() => {
    let stopped = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let disconnect = () => {};

    const connect = () => {
      const source = new EventSource(url);
      let active = true;

      const handlers = Object.entries(listeners).map(([name, handler]) => {
        const listener: EventListener = (event) => {
          if (active) handler(event as MessageEvent<string>);
        };

        source.addEventListener(name, listener);

        return { name, listener };
      });

      const onOpen = () => {
        if (active) setConnection("live");
      };

      const onError = () => {
        if (!active) return;

        disconnect();
        setConnection("reconnecting");
        retryTimer = setTimeout(() => {
          if (!stopped) connect();
        }, 2000);
      };

      disconnect = () => {
        active = false;
        source.removeEventListener("open", onOpen);
        source.removeEventListener("error", onError);

        for (const { name, listener } of handlers) {
          source.removeEventListener(name, listener);
        }

        source.close();
      };

      source.addEventListener("open", onOpen);
      source.addEventListener("error", onError);
    };

    setConnection("connecting");
    connect();

    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      disconnect();
    };
  }, [url, listeners]);

  return connection;
}
