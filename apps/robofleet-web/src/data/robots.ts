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
    location: "Storage A",
    destination: "Assembly",
    detail: "Transporting a pallet to the assembly line.",
    task: {
      id: "TSK-1042",
      title: "Delivering pallet #024",
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
    location: "Loading bay",
    destination: "Storage B",
    detail: "Collecting an incoming delivery.",
    task: {
      id: "TSK-1043",
      title: "Collecting inventory",
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
    location: "Charging bay",
    destination: null,
    detail: "Charging at dock C-02. Ready in approximately 24 minutes.",
    task: null,
  },
  {
    id: "AMR-004",
    name: "Orbit",
    status: "Working",
    battery: 91,
    location: "Assembly",
    destination: "Packing",
    detail: "Moving completed parts to the packing station.",
    task: {
      id: "TSK-1045",
      title: "Moving finished parts",
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
    location: "Packing",
    destination: null,
    detail: "Available and waiting for a new task.",
    task: null,
  },
  {
    id: "AMR-006",
    name: "Bolt",
    status: "Blocked",
    battery: 58,
    location: "Corridor B",
    destination: "Loading bay",
    detail: "An obstacle is blocking the route. Waiting for the aisle to clear.",
    task: {
      id: "TSK-1047",
      title: "Returning empty pallet",
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
    location: "Storage B",
    destination: "Quality control",
    detail: "Delivering a sample for inspection.",
    task: {
      id: "TSK-1048",
      title: "Delivering sample #018",
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
    location: "Maintenance",
    destination: null,
    detail: "Connection lost. Last seen 3 minutes ago; battery and location are last-known values.",
    task: null,
  },
];

export function needsAttention(robot: Robot) {
  return robot.status === "Blocked" || robot.status === "Offline";
}
