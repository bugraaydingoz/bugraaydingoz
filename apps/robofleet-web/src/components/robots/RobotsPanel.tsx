import { useState } from "react";
import { Bot, CircleDashed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { demoRobots, needsAttention } from "@/data/robots";
import { RobotCard } from "./RobotCard";

type Filter = "all" | "active" | "attention";

export function RobotsPanel() {
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(demoRobots[0].id);
  const active = demoRobots.filter((robot) => robot.status === "Working");
  const attention = demoRobots.filter(needsAttention);
  const visible = filter === "active" ? active : filter === "attention" ? attention : demoRobots;

  return (
    <aside aria-label="Robot fleet" className="h-full w-[360px] max-w-full">
      <Card className="h-full gap-0 py-0">
        <CardHeader className="gap-4 py-5">
          <div className="flex items-center gap-2.5">
            <Bot className="size-5" aria-hidden="true" />
            <CardTitle>
              <h1>Robots</h1>
            </CardTitle>
            <Badge variant="secondary" className="ml-auto">
              {demoRobots.length}
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
                <li key={robot.id}>
                  <RobotCard
                    robot={robot}
                    expanded={expandedId === robot.id}
                    onToggle={() => setExpandedId(expandedId === robot.id ? null : robot.id)}
                  />
                </li>
              ))}
            </ul>
          </ScrollArea>
        </CardContent>
        <CardFooter>
          <div className="flex w-full items-center gap-1.5 text-[11px] text-muted-foreground">
            <CircleDashed className="size-3.5" aria-hidden="true" />
            <span>Demo fleet</span>
            <span className="ml-auto">1 facility</span>
          </div>
        </CardFooter>
      </Card>
    </aside>
  );
}
