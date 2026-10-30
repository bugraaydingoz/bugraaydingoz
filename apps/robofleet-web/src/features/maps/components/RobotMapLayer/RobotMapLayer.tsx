import { useMemo } from "react";
import { Button } from "@/shared/components/Button/Button";
import { useRobotsStore } from "@/features/robots/stores/robots.store";
import { useSelectedRobot } from "@/features/robots/hooks/use-selected-robot";
import { useRobotFilter } from "@/features/robots/hooks/use-robot-filter";
import { useRobotMotion } from "@/features/maps/hooks/use-robot-motion";
import type { Robot as FleetRobot } from "@/features/robots/types/robot";
import type { FleetMap } from "@/features/maps/api/maps.api";
import { Robot } from "../Robot/Robot";

export function RobotMapLayer({ robots, map }: { robots: FleetRobot[]; map: FleetMap }) {
  const [selectedId, setSelectedId] = useSelectedRobot();
  const [, setFilter] = useRobotFilter();
  const hoveredId = useRobotsStore((state) => state.hoveredId);
  const hoverRobot = useRobotsStore((state) => state.hoverRobot);
  const visible = useMemo(
    () => robots.filter((robot) => robot.mapId === map.id && robot.mapVersion === map.version),
    [robots, map.id, map.version],
  );
  const poses = useRobotMotion(visible, map.definition.metresPerUnit);
  const { viewBox, projection } = map.definition;
  const ROBOT_SIZE = (110 * projection.scaleX) / 0.43;
  const ROBOT_HEIGHT = (ROBOT_SIZE * 235) / 260;
  const project = (x: number, y: number) => ({
    x: projection.x + (x - y) * projection.scaleX,
    y: projection.y + (x + y) * projection.scaleY,
  });
  const selected = visible.find((robot) => robot.id === selectedId);
  const route = (selected ? (poses.get(selected.id)?.route ?? selected.route) : []).map(([x, y]) =>
    project(x, y),
  );
  const markers = visible
    .map((robot) => {
      const pose = poses.get(robot.id) ?? robot.position;
      return {
        robot,
        placement: { color: robot.color, heading: pose.heading },
        point: project(pose.x, pose.y),
      };
    })
    .sort((a, b) => a.point.y - b.point.y);

  return (
    <svg
      viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
      role="group"
      aria-label="Hotel robot positions"
      className="absolute inset-0 h-full w-full"
    >
      {route.length > 0 && (
        <g
          aria-hidden="true"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
          pointerEvents="none"
        >
          <polyline
            points={route.map((p) => `${p.x},${p.y}`).join(" ")}
            strokeDasharray="5 6"
            strokeLinecap="round"
          />
          <circle cx={route.at(-1)!.x} cy={route.at(-1)!.y} r="7" fill="var(--card)" />
          <circle cx={route.at(-1)!.x} cy={route.at(-1)!.y} r="2" fill="var(--primary)" />
        </g>
      )}
      {markers.map(({ robot, placement, point }) => (
        <g key={robot.id} data-robot-id={robot.id}>
          {(selectedId === robot.id || hoveredId === robot.id) && (
            <ellipse
              data-slot="robot-highlight"
              cx={point.x}
              cy={point.y}
              rx={(26 * ROBOT_SIZE) / 110}
              ry={(12 * ROBOT_SIZE) / 110}
              fill="var(--primary)"
              fillOpacity={selectedId === robot.id ? 0.12 : 0.05}
              stroke="var(--primary)"
              strokeOpacity={selectedId === robot.id ? 1 : 0.4}
              strokeWidth="2.5"
              aria-hidden="true"
              pointerEvents="none"
            />
          )}
          <foreignObject
            x={point.x - (ROBOT_SIZE * 120) / 260}
            y={point.y - (ROBOT_SIZE * 178) / 260}
            width={ROBOT_SIZE}
            height={ROBOT_HEIGHT}
          >
            <Button
              variant="map"
              data-map-interactive=""
              className="h-full w-full p-0"
              aria-label={`Select ${robot.name} on map`}
              aria-pressed={selectedId === robot.id}
              title={`${robot.name} · ${robot.status}`}
              onClick={() => {
                void setSelectedId(robot.id);
                void setFilter("all");
              }}
              onPointerEnter={() => hoverRobot(robot.id)}
              onPointerLeave={() => hoverRobot(null)}
            >
              <Robot
                size={ROBOT_SIZE}
                color={placement.color}
                heading={placement.heading}
                groundRatio={projection.scaleY / projection.scaleX}
                label={`${robot.name} robot`}
              />
            </Button>
          </foreignObject>
        </g>
      ))}
    </svg>
  );
}
