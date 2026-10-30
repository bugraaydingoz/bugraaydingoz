export type RobotStatus = "Working" | "Charging" | "Idle" | "Blocked" | "Offline";

export type Robot = {
  id: string;
  name: string;
  status: RobotStatus;
  battery: number;
  location: string;
  destination: string | null;
  detail: string;
  lastSeenAt: string | null;
  generation: number;
  sequence: number;
  recordedAt: string;
  speedMps: number;
  sampleAgeMs: number;
  color: string;
  mapId: string;
  mapVersion: number;
  position: { x: number; y: number; heading: number };
  route: [number, number][];
  task: { id: string; title: string; progress: number; distance: string; eta: string } | null;
};
