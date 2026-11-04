import type { EventConnection } from "@/shared/hooks/use-event-listener";

const statusLabels: Record<EventConnection | "unavailable", string> = {
  live: "Live simulator",
  connecting: "Connecting…",
  unavailable: "Backend unavailable",
  stale: "Updates paused · reconnecting…",
  reconnecting: "Reconnecting…",
};

export function StatusBadge({ status }: { status: EventConnection | "unavailable" }) {
  return <span role="status">{statusLabels[status]}</span>;
}
