import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useFleetData } from "@/hooks/use-fleet-data";
import { useFleet } from "@/stores/fleet";
import { MapViewport } from "./MapViewport";
import { HotelFloor } from "./illustrations/HotelFloor";
import { Robot } from "./illustrations/Robot";

export function HotelMap() {
  const { selectedId, hoveredId, selectRobot, hoverRobot } = useFleet();
  const { robots, maps } = useFleetData();
  const selected = robots.find((robot) => robot.id === selectedId);
  const map =
    maps.find((map) => map.id === selected?.mapId && map.version === selected?.mapVersion) ??
    maps[0];
  if (!map)
    return (
      <Card
        role="region"
        aria-label="Hotel"
        className="relative h-full min-h-0 min-w-0 gap-0 py-0"
      />
    );
  const { viewBox, projection } = map.definition;
  const ROBOT_SIZE = (110 * projection.scaleX) / 0.43;
  const ROBOT_HEIGHT = (ROBOT_SIZE * 235) / 260;
  const project = (x: number, y: number) => ({
    x: projection.x + (x - y) * projection.scaleX,
    y: projection.y + (x + y) * projection.scaleY,
  });
  const route = (
    selected?.mapId === map.id && selected.mapVersion === map.version ? selected.route : []
  ).map(([x, y]) => project(x, y));
  const markers = robots
    .filter((robot) => robot.mapId === map.id && robot.mapVersion === map.version)
    .map((robot) => ({
      robot,
      placement: { color: robot.color, heading: robot.position.heading },
      point: project(robot.position.x, robot.position.y),
    }))
    .sort((a, b) => a.point.y - b.point.y);

  return (
    <Card role="region" aria-label="Hotel" className="relative h-full min-h-0 min-w-0 gap-0 py-0">
      <MapViewport className="bg-card">
        {map.definition.asset === "hotel-courtyard" && <HotelFloor />}
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
                  onClick={() => selectRobot(robot.id)}
                  onPointerEnter={() => hoverRobot(robot.id)}
                  onPointerLeave={() => hoverRobot(null)}
                >
                  <Robot
                    size={ROBOT_SIZE}
                    color={placement.color}
                    heading={placement.heading}
                    label={`${robot.name} robot`}
                  />
                </Button>
              </foreignObject>
            </g>
          ))}
        </svg>
      </MapViewport>
    </Card>
  );
}
