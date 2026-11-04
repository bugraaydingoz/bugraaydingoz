import { useRobots } from "@/features/robots/hooks/use-robots";
import { useMaps } from "@/features/maps/hooks/use-maps";
import type { EventConnection } from "@/shared/hooks/use-event-listener";
import { Bot, CircleDashed } from "lucide-react";
import { Badge } from "@/shared/components/Badge/Badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/Card/Card";
import { ScrollArea } from "@/shared/components/ScrollArea/ScrollArea";
import { Separator } from "@/shared/components/Separator/Separator";
import { cn } from "@/shared/utils/cn";
import { useRobotSelection } from "@/features/robots/hooks/use-robot-selection";
import { useRobotFilter } from "@/features/robots/hooks/use-robot-filter";
import { needsAttention } from "@/features/robots/utils/needs-attention";
import { RobotFilters } from "../RobotFilters/RobotFilters";
import { RobotCard } from "../RobotCard/RobotCard";
import { StatusBadge } from "../StatusBadge/StatusBadge";

export function RobotsPanel({
  className,
  connection,
}: {
  className?: string;
  connection: EventConnection;
}) {
  const robotsQuery = useRobots();
  const mapsQuery = useMaps();
  const status = robotsQuery.isError || mapsQuery.isError ? "unavailable" : connection;

  const [filter, setFilter] = useRobotFilter();
  const { selectedId, setSelectedId, hoverRobot, selectedCard } = useRobotSelection(filter);

  const active = robotsQuery.data?.filter((robot) => robot.status === "Working") ?? [];
  const attention = robotsQuery.data?.filter(needsAttention) ?? [];
  const visible =
    filter === "active" ? active : filter === "attention" ? attention : (robotsQuery.data ?? []);

  return (
    <aside aria-label="Robot fleet" className={cn("h-full w-[360px] max-w-full", className)}>
      <Card className="h-full gap-0 py-0">
        <CardHeader className="gap-4 py-5">
          <div className="flex items-center gap-2.5">
            <Bot className="size-5" aria-hidden="true" />
            <CardTitle>
              <h1>Robots</h1>
            </CardTitle>
            <Badge variant="secondary" className="ml-auto">
              {robotsQuery.data?.length ?? 0}
            </Badge>
          </div>
          <RobotFilters
            filter={filter}
            activeCount={active.length}
            attentionCount={attention.length}
            onFilterChange={(next) => {
              hoverRobot(null);
              void setFilter(next);
            }}
          />
        </CardHeader>
        <Separator />
        <CardContent className="min-h-0 flex-1 px-0">
          <ScrollArea className="h-full">
            <ul className="flex flex-col gap-3 p-4" aria-label="Robots">
              {visible.map((robot) => (
                <li key={robot.id} ref={selectedId === robot.id ? selectedCard : undefined}>
                  <RobotCard
                    robot={robot}
                    expanded={selectedId === robot.id}
                    onToggle={() => {
                      void setSelectedId((current) => (current === robot.id ? null : robot.id));
                    }}
                  />
                </li>
              ))}
            </ul>
          </ScrollArea>
        </CardContent>
        <CardFooter>
          <div className="flex w-full items-center gap-1.5 text-[11px] text-muted-foreground">
            <CircleDashed className="size-3.5" aria-hidden="true" />
            <StatusBadge status={status} />
            <span className="ml-auto">
              {mapsQuery.data?.length ?? 0}{" "}
              {mapsQuery.data?.length === 1 ? "facility" : "facilities"}
            </span>
          </div>
        </CardFooter>
      </Card>
    </aside>
  );
}
