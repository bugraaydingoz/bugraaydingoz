import { Card } from "@/shared/components/Card/Card";
import { useFleetData } from "@/hooks/use-fleet-data";
import { useFleet } from "@/stores/fleet";
import { MapViewport } from "../MapViewport/MapViewport";
import { HotelFloor } from "../HotelFloor/HotelFloor";
import { RobotMapLayer } from "../RobotMapLayer/RobotMapLayer";

export function HotelMap() {
  const selectedId = useFleet((state) => state.selectedId);
  const { robots, maps } = useFleetData();
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
