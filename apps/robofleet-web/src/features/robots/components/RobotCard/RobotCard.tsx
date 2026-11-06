import { RobotCardHeader } from "@/features/robots/components/RobotCardHeader/RobotCardHeader";
import { RobotCardRoute } from "@/features/robots/components/RobotCardRoute/RobotCardRoute";
import { RobotCardFooter } from "@/features/robots/components/RobotCardFooter/RobotCardFooter";
import { RobotCardTask } from "@/features/robots/components/RobotCardTask/RobotCardTask";
import { Card, CardContent } from "@/shared/components/Card/Card";
import { Separator } from "@/shared/components/Separator/Separator";
import type { Robot } from "@/features/robots/types/robot";
import { useRobotsStore } from "@/features/robots/stores/robots.store";

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
      <RobotCardHeader robot={robot} expanded={expanded} />
      <CardContent className="flex flex-col gap-4">
        <RobotCardRoute location={robot.location} destination={robot.destination} />
        {expanded && (
          <div id={`${robot.id}-details`} className="flex flex-col gap-4">
            <Separator />
            {robot.task ? (
              <RobotCardTask task={robot.task} status={robot.status} detail={robot.detail} />
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground">{robot.detail}</p>
            )}
          </div>
        )}
      </CardContent>
      <RobotCardFooter robot={robot} />
    </Card>
  );
}
