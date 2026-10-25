import { HOTEL_RING, HOTEL_ROOMS } from "./hotel-layout";

export type HotelPoint = readonly [number, number];

// World coordinates from the supplied square courtyard hotel.
export const hotelDestinations: Record<string, HotelPoint> = Object.fromEntries(
  HOTEL_ROOMS.map((room) => [
    typeof room.id === "number" ? `Room ${room.id}` : room.id,
    [room.entry.x, room.entry.y],
  ]),
);

const corridorPoint = (node: number): HotelPoint => [HOTEL_RING[node].x, HOTEL_RING[node].y];

// Static preview positions. These are not autonomous or collision-avoiding robots.
export const hotelRobotPlacements: Record<
  string,
  { point: HotelPoint; color: string; heading: number }
> = {
  "AMR-001": { point: corridorPoint(5), color: "#79bca0", heading: -28 },
  "AMR-002": { point: corridorPoint(4), color: "#e9ad39", heading: 60 },
  "AMR-003": { point: hotelDestinations["Robot service"], color: "#ce94b5", heading: 120 },
  "AMR-004": { point: corridorPoint(9), color: "#7d9dce", heading: 150 },
  "AMR-005": { point: hotelDestinations.Reception, color: "#c2c6a7", heading: 60 },
  "AMR-006": { point: corridorPoint(6), color: "#e77960", heading: -28 },
  "AMR-007": { point: corridorPoint(13), color: "#87b9c6", heading: 150 },
  "AMR-008": { point: hotelDestinations.Kitchen, color: "#b5b9ad", heading: 60 },
};

function distance(a: HotelPoint, b: HotelPoint) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function corridorConnection(point: HotelPoint) {
  const room = HOTEL_ROOMS.find(({ entry }) => entry.x === point[0] && entry.y === point[1]);
  if (room) {
    return {
      node: room.node,
      via: "via" in room ? room.via.map(({ x, y }): HotelPoint => [x, y]) : [],
    };
  }
  const node = HOTEL_RING.reduce(
    (nearest, _, index) =>
      distance(point, corridorPoint(index)) < distance(point, corridorPoint(nearest))
        ? index
        : nearest,
    0,
  );
  return { node, via: [] };
}

/** Follow the shorter side of the courtyard corridor, then enter through the doorway. */
export function hotelRoute(start: HotelPoint, destination: HotelPoint): HotelPoint[] {
  const from = corridorConnection(start);
  const to = corridorConnection(destination);
  function walk(direction: number) {
    const points = [corridorPoint(from.node)];
    let length = 0;
    for (let node = from.node; node !== to.node; ) {
      const next = (node + direction + HOTEL_RING.length) % HOTEL_RING.length;
      length += distance(corridorPoint(node), corridorPoint(next));
      points.push(corridorPoint(next));
      node = next;
    }
    return { points, length };
  }
  const clockwise = walk(1);
  const counterclockwise = walk(-1);
  const corridor = clockwise.length <= counterclockwise.length ? clockwise : counterclockwise;
  return [start, ...[...from.via].reverse(), ...corridor.points, ...to.via, destination].filter(
    (point, index, points) => index === 0 || distance(point, points[index - 1]) > 0,
  );
}
