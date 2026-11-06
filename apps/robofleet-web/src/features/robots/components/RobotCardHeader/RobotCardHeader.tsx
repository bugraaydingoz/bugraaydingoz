import { Bot, ChevronDown } from "lucide-react";
import { RobotStatusBadge } from "@/features/robots/components/RobotStatusBadge/RobotStatusBadge";
import type { Robot } from "@/features/robots/types/robot";
import { Button } from "@/shared/components/Button/Button";
import { CardHeader, CardTitle } from "@/shared/components/Card/Card";
import { cn } from "@/shared/utils/cn";

export function RobotCardHeader({
  robot,
  expanded,
}: {
  robot: Pick<Robot, "id" | "name" | "status">;
  expanded: boolean;
}) {
  return (
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
        <RobotStatusBadge status={robot.status} />
        <ChevronDown
          aria-hidden="true"
          data-icon="inline-end"
          className={cn("transition-transform", expanded && "rotate-180")}
        />
      </Button>
    </CardHeader>
  );
}
