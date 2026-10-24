export type RobotStatus = "Working" | "Charging" | "Idle" | "Blocked" | "Offline";

export type Robot = {
  id: string;
  name: string;
  status: RobotStatus;
  battery: number;
  location: string;
  destination: string | null;
  detail: string;
  task: {
    id: string;
    title: string;
    progress: number;
    distance: string;
    eta: string;
  } | null;
};

// Preview fixtures until the simulator and fleet endpoint are connected.
export const demoRobots: Robot[] = [
  {
    id: "AMR-001",
    name: "Atlas",
    status: "Working",
    battery: 84,
    location: "Guest corridor",
    destination: "Room 104",
    detail: "Delivering fresh towels to a guest room.",
    task: {
      id: "TSK-1042",
      title: "Delivering towels",
      progress: 64,
      distance: "128 m",
      eta: "2 min",
    },
  },
  {
    id: "AMR-002",
    name: "Scout",
    status: "Working",
    battery: 72,
    location: "Kitchen",
    destination: "Room 102",
    detail: "Taking a room-service order to a guest.",
    task: {
      id: "TSK-1043",
      title: "Delivering room service",
      progress: 28,
      distance: "246 m",
      eta: "4 min",
    },
  },
  {
    id: "AMR-003",
    name: "Nova",
    status: "Charging",
    battery: 36,
    location: "Reception dock",
    destination: null,
    detail: "Charging at dock C-02. Ready in approximately 24 minutes.",
    task: null,
  },
  {
    id: "AMR-004",
    name: "Orbit",
    status: "Working",
    battery: 91,
    location: "Lounge",
    destination: "Room 108",
    detail: "Taking guest amenities to a room.",
    task: {
      id: "TSK-1045",
      title: "Delivering amenities",
      progress: 12,
      distance: "182 m",
      eta: "3 min",
    },
  },
  {
    id: "AMR-005",
    name: "Echo",
    status: "Idle",
    battery: 95,
    location: "Reception",
    destination: null,
    detail: "Available and waiting for a new task.",
    task: null,
  },
  {
    id: "AMR-006",
    name: "Bolt",
    status: "Blocked",
    battery: 58,
    location: "Guest corridor",
    destination: "Room 105",
    detail: "An obstacle is blocking the route. Waiting for the corridor to clear.",
    task: {
      id: "TSK-1047",
      title: "Delivering guest supplies",
      progress: 42,
      distance: "96 m",
      eta: "Paused",
    },
  },
  {
    id: "AMR-007",
    name: "Pixel",
    status: "Working",
    battery: 67,
    location: "Dining entrance",
    destination: "Room 110",
    detail: "Delivering refreshments from the dining room.",
    task: {
      id: "TSK-1048",
      title: "Delivering refreshments",
      progress: 81,
      distance: "42 m",
      eta: "1 min",
    },
  },
  {
    id: "AMR-008",
    name: "Milo",
    status: "Offline",
    battery: 23,
    location: "Kitchen",
    destination: null,
    detail: "Connection lost. Last seen 3 minutes ago; battery and location are last-known values.",
    task: null,
  },
];

export function needsAttention(robot: Robot) {
  return robot.status === "Blocked" || robot.status === "Offline";
}
