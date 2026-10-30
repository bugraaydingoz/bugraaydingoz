import type { Robot } from "../types/robot";

export function needsAttention(robot: Robot) {
  return robot.status === "Blocked" || robot.status === "Offline";
}
