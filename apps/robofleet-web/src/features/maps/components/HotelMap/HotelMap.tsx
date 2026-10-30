import { Card } from "@/shared/components/Card/Card";
import { useRobots } from "@/features/robots/hooks/use-robots";
import { useMaps } from "@/features/maps/hooks/use-maps";
import { useSelectedRobot } from "@/features/robots/hooks/use-selected-robot";
import { MapViewport } from "../MapViewport/MapViewport";
import { HotelFloor } from "../HotelFloor/HotelFloor";
import { RobotMapLayer } from "../RobotMapLayer/RobotMapLayer";

export function HotelMap() {
  const robotsQuery = useRobots();
  const mapsQuery = useMaps();

  const [selectedId] = useSelectedRobot();
  const selected = robotsQuery.data?.find((robot) => robot.id === selectedId);
  const map =
    mapsQuery.data?.find(
      (map) => map.id === selected?.mapId && map.version === selected?.mapVersion,
    ) ?? mapsQuery.data?.[0];

  return (
    <Card role="region" aria-label="Hotel" className="relative h-full min-h-0 min-w-0 gap-0 py-0">
      {map && (
        <MapViewport className="bg-card">
          {map.definition.asset === "hotel-courtyard" && <HotelFloor />}
          <RobotMapLayer robots={robotsQuery.data ?? []} map={map} />
        </MapViewport>
      )}
    </Card>
  );
}
