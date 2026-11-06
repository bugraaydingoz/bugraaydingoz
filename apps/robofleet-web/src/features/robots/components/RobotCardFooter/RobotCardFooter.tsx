import { BatteryMedium, Clock3, Package, PlugZap, WifiOff } from "lucide-react";
import type { Robot } from "@/features/robots/types/robot";
import { Badge } from "@/shared/components/Badge/Badge";
import { CardFooter } from "@/shared/components/Card/Card";

export function RobotCardFooter({
  robot,
}: {
  robot: Pick<Robot, "name" | "battery" | "task" | "status" | "lastSeenAt">;
}) {
  return (
    <CardFooter className="justify-between gap-2">
      <Badge
        variant={robot.battery < 25 ? "destructive" : "outline"}
        aria-label={`${robot.name} battery ${robot.battery}%`}
      >
        <BatteryMedium data-icon="inline-start" aria-hidden="true" />
        {robot.battery}%
      </Badge>
      <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        {robot.task ? (
          <>
            <Package className="size-3" aria-hidden="true" />
            {robot.task.id}
          </>
        ) : robot.status === "Charging" ? (
          <>
            <PlugZap className="size-3" aria-hidden="true" />
            Dock C-02
          </>
        ) : robot.status === "Offline" ? (
          <>
            <WifiOff className="size-3" aria-hidden="true" />
            {robot.lastSeenAt
              ? `Last seen ${Math.max(1, Math.floor((Date.now() - Date.parse(robot.lastSeenAt)) / 1000))}s ago`
              : "No telemetry received"}
          </>
        ) : (
          "Ready for a task"
        )}
      </span>
      {robot.task && (
        <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock3 className="size-3" aria-hidden="true" />
          {robot.task.eta}
        </span>
      )}
    </CardFooter>
  );
}
