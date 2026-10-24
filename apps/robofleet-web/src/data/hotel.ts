export type HotelPoint = readonly [number, number];

// Coordinates match the supplied hotel's 2160 × 660 floor plan (x: -360…1800).
export const hotelDestinations: Record<string, HotelPoint> = {
  "Room 101": [150, 260],
  "Room 102": [450, 260],
  "Room 103": [750, 260],
  "Room 104": [1050, 260],
  "Room 105": [1350, 260],
  "Room 106": [150, 400],
  "Room 107": [450, 400],
  "Room 108": [750, 400],
  "Room 109": [1050, 400],
  "Room 110": [1350, 400],
};

// Static preview positions. These are not autonomous or collision-avoiding robots.
export const hotelRobotPlacements: Record<
  string,
  { point: HotelPoint; color: string; heading: number }
> = {
  "AMR-001": { point: [780, 330], color: "#79bca0", heading: -28 },
  "AMR-002": { point: [-150, 460], color: "#e9ad39", heading: 60 },
  "AMR-003": { point: [-260, 310], color: "#ce94b5", heading: 120 },
  "AMR-004": { point: [1580, 230], color: "#7d9dce", heading: 150 },
  "AMR-005": { point: [-100, 200], color: "#c2c6a7", heading: 60 },
  "AMR-006": { point: [1110, 330], color: "#e77960", heading: -28 },
  "AMR-007": { point: [1720, 360], color: "#87b9c6", heading: 150 },
  "AMR-008": { point: [-150, 580], color: "#b5b9ad", heading: 60 },
};

/** A preview route through the shared corridor to a room's doorway. */
export function hotelRoute(start: HotelPoint, destination: HotelPoint): HotelPoint[] {
  return [start, [start[0], 330], [destination[0], 330], destination];
}
