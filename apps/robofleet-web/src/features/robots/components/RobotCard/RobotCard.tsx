import {
  ArrowRight,
  BatteryMedium,
  Bot,
  ChevronDown,
  CircleAlert,
  Clock3,
  Package,
  PlugZap,
  WifiOff,
} from "lucide-react";
import { Badge } from "@/shared/components/Badge/Badge";
import { Button } from "@/shared/components/Button/Button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/Card/Card";
import { Progress, ProgressLabel, ProgressValue } from "@/shared/components/Progress/Progress";
import { Separator } from "@/shared/components/Separator/Separator";
import type { Robot, RobotStatus } from "@/features/robots/types/robot";
import { cn } from "@/shared/utils/cn";
import { useRobotsStore } from "@/features/robots/stores/robots.store";

function StatusBadge({ status }: { status: RobotStatus }) {
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

export function RobotCard({
  robot,
  expanded,
  onToggle,
}: {
  robot: Robot;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hovered = useRobotsStore((state) => state.hoveredId === robot.id);
  const hoverRobot = useRobotsStore((state) => state.hoverRobot);

  return (
    <Card
      size="sm"
      variant="interactive"
      role="article"
      aria-labelledby={`${robot.id}-name`}
      data-highlighted={expanded ? "selected" : hovered ? "hovered" : undefined}
      onClick={onToggle}
      onPointerEnter={() => hoverRobot(robot.id)}
      onPointerLeave={() => hoverRobot(null)}
    >
      <CardHeader>
        <Button
          variant="card"
          className="h-auto w-full justify-start px-0 py-0"
          aria-label={`${robot.name} details`}
          aria-expanded={expanded}
          aria-controls={`${robot.id}-details`}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border bg-muted/50">
            <Bot aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
            <CardTitle id={`${robot.id}-name`}>{robot.name}</CardTitle>
            <span className="font-mono text-[10px] font-normal text-muted-foreground">
              {robot.id}
            </span>
          </span>
          <StatusBadge status={robot.status} />
          <ChevronDown
            aria-hidden="true"
            data-icon="inline-end"
            className={cn("transition-transform", expanded && "rotate-180")}
          />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] text-muted-foreground">Current location</p>
            <p className="truncate" title={robot.location}>
              {robot.location}
            </p>
          </div>
          <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0 text-right">
            <p className="mb-1 text-[10px] text-muted-foreground">Destination</p>
            <p
              className={cn("truncate", !robot.destination && "text-muted-foreground")}
              title={robot.destination ?? "Unassigned"}
            >
              {robot.destination ?? "Unassigned"}
            </p>
          </div>
        </div>
        {expanded && (
          <div id={`${robot.id}-details`} className="flex flex-col gap-4">
            <Separator />
            {robot.task ? (
              <>
                <Progress value={robot.task.progress}>
                  <ProgressLabel>{robot.task.title}</ProgressLabel>
                  <ProgressValue />
                </Progress>
                <dl className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <dt className="text-[10px] text-muted-foreground">Task ID</dt>
                    <dd className="mt-1 font-mono text-[11px]">{robot.task.id}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-muted-foreground">Distance left</dt>
                    <dd className="mt-1">{robot.task.distance}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-muted-foreground">Est. arrival</dt>
                    <dd className="mt-1">{robot.task.eta}</dd>
                  </div>
                </dl>
                {robot.status === "Blocked" && (
                  <p className="text-xs leading-relaxed text-destructive">{robot.detail}</p>
                )}
              </>
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground">{robot.detail}</p>
            )}
          </div>
        )}
      </CardContent>
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
    </Card>
  );
}
