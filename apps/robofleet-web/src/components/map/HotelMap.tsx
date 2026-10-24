import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { demoRobots } from "@/data/robots";
import { hotelDestinations, hotelRobotPlacements, hotelRoute } from "@/data/hotel";
import { useFleet } from "@/stores/fleet";
import { MapViewport } from "./MapViewport";
import { HotelFloor, projectHotelPoint } from "./illustrations/HotelFloor";
import { Robot } from "./illustrations/Robot";

const ROBOT_SIZE = 110;
const ROBOT_HEIGHT = (ROBOT_SIZE * 235) / 260;

export function HotelMap() {
  const { selectedId, hoveredId, selectRobot, hoverRobot } = useFleet();
  const selected = demoRobots.find((robot) => robot.id === selectedId);
  const destination = selected?.destination ? hotelDestinations[selected.destination] : undefined;
  const placement = selected ? hotelRobotPlacements[selected.id] : undefined;
  const route =
    placement && destination
      ? hotelRoute(placement.point, destination).map(([x, y]) => projectHotelPoint(x, y))
      : [];
  const markers = demoRobots
    .flatMap((robot) => {
      const placement = hotelRobotPlacements[robot.id];
      return placement ? [{ robot, placement, point: projectHotelPoint(...placement.point) }] : [];
    })
    .sort((a, b) => a.point.y - b.point.y);

  return (
    <Card role="region" aria-label="Hotel" className="relative h-full min-h-0 min-w-0 gap-0 py-0">
      <MapViewport className="bg-card">
        <HotelFloor />
        <svg
          viewBox="0 0 1400 950"
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
                  rx="26"
                  ry="12"
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
