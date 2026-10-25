import { useFleetData } from "@/hooks/use-fleet-data";
import { useEffect, useRef } from "react";
import { Bot, CircleDashed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/utils/utils";
import { useFleet } from "@/stores/fleet";
import { needsAttention } from "@/data/robots";
import { RobotCard } from "./RobotCard";

export function RobotsPanel({ className }: { className?: string }) {
  const { robots, maps, connection } = useFleetData();
  const { filter, selectedId, setFilter, toggleRobot } = useFleet();
  const selectedCard = useRef<HTMLLIElement>(null);
  useEffect(() => {
    selectedCard.current?.scrollIntoView?.({ block: "nearest" });
  }, [selectedId, filter]);
  const active = robots.filter((robot) => robot.status === "Working");
  const attention = robots.filter(needsAttention);
  const visible = filter === "active" ? active : filter === "attention" ? attention : robots;

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
              {robots.length}
            </Badge>
          </div>
          <ToggleGroup
            value={[filter]}
            onValueChange={(value) => {
              const next = value[0];
              if (next === "all" || next === "active" || next === "attention") setFilter(next);
            }}
            variant="outline"
            size="sm"
            spacing={0}
            aria-label="Filter robots"
            className="w-full"
          >
            <ToggleGroupItem value="all" className="flex-1">
              All robots
            </ToggleGroupItem>
            <ToggleGroupItem value="active" className="flex-1">
              Active <span className="ml-1 text-[10px] opacity-50">{active.length}</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="attention" className="flex-1">
              Attention <span className="ml-1 text-[10px] opacity-50">{attention.length}</span>
            </ToggleGroupItem>
          </ToggleGroup>
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
                    onToggle={() => toggleRobot(robot.id)}
                  />
                </li>
              ))}
            </ul>
          </ScrollArea>
        </CardContent>
        <CardFooter>
          <div className="flex w-full items-center gap-1.5 text-[11px] text-muted-foreground">
            <CircleDashed className="size-3.5" aria-hidden="true" />
            <span role="status">
              {connection === "live"
                ? "Live simulator"
                : connection === "connecting"
                  ? "Connecting…"
                  : connection === "unavailable"
                    ? "Backend unavailable"
                    : "Reconnecting…"}
            </span>
            <span className="ml-auto">
              {maps.length} {maps.length === 1 ? "facility" : "facilities"}
            </span>
          </div>
        </CardFooter>
      </Card>
    </aside>
  );
}
