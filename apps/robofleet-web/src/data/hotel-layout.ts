/** World coordinates. The 2200-square building envelope is unchanged. */
export const HOTEL_SIZE = 2200;
export const HOTEL_ROOM_SIZE = { width: 320, depth: 620 };
export const HOTEL_VIEWBOX = { width: 1400, height: 1000 };
export const HOTEL_GARDEN = { x: 740, y: 740, width: 720, depth: 720 };
export const HOTEL_RING = [
  { x: 680, y: 680 },
  { x: 876, y: 680 },
  { x: 1196, y: 680 },
  { x: 1516, y: 680 },
  { x: 1520, y: 680 },
  { x: 1520, y: 876 },
  { x: 1520, y: 1196 },
  { x: 1520, y: 1516 },
  { x: 1520, y: 1520 },
  { x: 1324, y: 1520 },
  { x: 1004, y: 1520 },
  { x: 684, y: 1520 },
  { x: 680, y: 1520 },
  { x: 680, y: 1324 },
  { x: 680, y: 1004 },
  { x: 680, y: 684 },
] as const;
export const HOTEL_ROOMS = [
  { node: 1, entry: { x: 876, y: 570 }, id: 101 },
  { node: 2, entry: { x: 1196, y: 570 }, id: 102 },
  { node: 3, entry: { x: 1516, y: 570 }, id: 103 },
  { node: 5, entry: { x: 1630, y: 876 }, id: 104 },
  { node: 6, entry: { x: 1630, y: 1196 }, id: 105 },
  { node: 7, entry: { x: 1630, y: 1516 }, id: 106 },
  { node: 9, entry: { x: 1324, y: 1630 }, id: 107 },
  { node: 10, entry: { x: 1004, y: 1630 }, id: 108 },
  { node: 11, entry: { x: 684, y: 1630 }, id: 109 },
  { node: 13, entry: { x: 570, y: 1324 }, id: 110 },
  { node: 14, entry: { x: 570, y: 1004 }, id: 111 },
  { node: 15, entry: { x: 570, y: 684 }, id: 112 },
  {
    node: 0,
    entry: { x: 515, y: 560 },
    via: [
      { x: 620, y: 680 },
      { x: 620, y: 560 },
    ],
    id: "Reception",
  },
  {
    node: 4,
    entry: { x: 1640, y: 515 },
    via: [
      { x: 1520, y: 620 },
      { x: 1640, y: 620 },
    ],
    id: "Kitchen",
  },
  {
    node: 8,
    entry: { x: 1685, y: 1640 },
    via: [
      { x: 1580, y: 1520 },
      { x: 1580, y: 1640 },
    ],
    id: "Dining",
  },
  {
    node: 12,
    entry: { x: 560, y: 1685 },
    via: [
      { x: 680, y: 1580 },
      { x: 560, y: 1580 },
    ],
    id: "Robot service",
  },
] as const;
