import { useEffect, useEffectEvent, useState } from "react";

export type EventConnection = "connecting" | "live" | "reconnecting";

type EventListeners = Record<string, (event: MessageEvent<string>) => void>;

export function useServerEvents(url: string, listeners: EventListeners): EventConnection {
  const [connection, setConnection] = useState<EventConnection>("connecting");
  const names = JSON.stringify(Object.keys(listeners).sort());
  const handleEvent = useEffectEvent((name: string, event: MessageEvent<string>) => {
    listeners[name]?.(event);
  });

  useEffect(() => {
    const source = new EventSource(url);
    const onOpen = () => setConnection("live");
    const onError = () => setConnection("reconnecting");
    const unsubscribe = subscribeToEvents(source, JSON.parse(names) as string[], handleEvent);

    setConnection("connecting");
    source.addEventListener("open", onOpen);
    source.addEventListener("error", onError);

    return () => {
      unsubscribe();
      source.removeEventListener("open", onOpen);
      source.removeEventListener("error", onError);
      source.close();
    };
  }, [url, names]);

  return connection;
}

function subscribeToEvents(
  source: EventSource,
  names: string[],
  onEvent: (name: string, event: MessageEvent<string>) => void,
) {
  const subscriptions = names.map((name) => {
    const listener: EventListener = (event) => {
      onEvent(name, event as MessageEvent<string>);
    };

    source.addEventListener(name, listener);

    return { name, listener };
  });

  return () => {
    for (const { name, listener } of subscriptions) {
      source.removeEventListener(name, listener);
    }
  };
}
