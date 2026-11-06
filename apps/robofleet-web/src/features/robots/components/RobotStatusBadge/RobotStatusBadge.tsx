import { CircleAlert, PlugZap, WifiOff } from "lucide-react";
import { Badge } from "@/shared/components/Badge/Badge";
import type { RobotStatus } from "@/features/robots/types/robot";

export function RobotStatusBadge({ status }: { status: RobotStatus }) {
  const variant =
    status === "Blocked" ? "destructive" : status === "Working" ? "success" : "secondary";
  return (
    <Badge variant={variant}>
      {status === "Working" && <span className="size-1 rounded-full bg-current" />}
      {status === "Charging" && <PlugZap data-icon="inline-start" aria-hidden="true" />}
      {status === "Blocked" && <CircleAlert data-icon="inline-start" aria-hidden="true" />}
      {status === "Offline" && <WifiOff data-icon="inline-start" aria-hidden="true" />}
      {status}
    </Badge>
  );
}

