import type { EventConnection } from "@/shared/hooks/use-server-events";

const statusLabels: Record<EventConnection | "unavailable", string> = {
  live: "Live simulator",
  connecting: "Connecting…",
  unavailable: "Backend unavailable",
  reconnecting: "Reconnecting…",
};

export function StatusBadge({ status }: { status: EventConnection | "unavailable" }) {
  return <span role="status">{statusLabels[status]}</span>;
}
