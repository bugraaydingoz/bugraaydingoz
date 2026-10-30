import { Card } from "@/shared/components/Card/Card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { robotsQueryOptions } from "@/features/robots/api/robots.queries";
import { mapsQueryOptions } from "@/features/maps/api/maps.queries";
import { useSelectedRobot } from "@/features/robots/hooks/use-selected-robot";
import { MapViewport } from "../MapViewport/MapViewport";
import { HotelFloor } from "../HotelFloor/HotelFloor";
import { RobotMapLayer } from "../RobotMapLayer/RobotMapLayer";

export function HotelMap() {
  const queryClient = useQueryClient();
  const { data: robots = [] } = useQuery(robotsQueryOptions(queryClient));
  const { data: maps = [] } = useQuery(mapsQueryOptions());

  const [selectedId] = useSelectedRobot();
  const selected = robots.find((robot) => robot.id === selectedId);
  const map =
    maps.find((map) => map.id === selected?.mapId && map.version === selected?.mapVersion) ??
    maps[0];

  return (
    <Card role="region" aria-label="Hotel" className="relative h-full min-h-0 min-w-0 gap-0 py-0">
      {map && (
        <MapViewport className="bg-card">
          {map.definition.asset === "hotel-courtyard" && <HotelFloor />}
          <RobotMapLayer robots={robots} map={map} />
        </MapViewport>
      )}
    </Card>
  );
}
