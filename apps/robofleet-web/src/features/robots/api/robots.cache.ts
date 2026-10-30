import type { FleetRobot } from "./robots.api";

function keepCurrent(current: FleetRobot, incoming: FleetRobot, source: "rest" | "sse"): boolean {
  if (current.generation !== incoming.generation) {
    return current.generation > incoming.generation;
  }

  // SSE snapshots refresh age and offline status even without a new telemetry sequence.
  return source === "rest"
    ? current.sequence >= incoming.sequence
    : current.sequence > incoming.sequence;
}

export function mergeRobotsSnapshot(
  current: FleetRobot[] | undefined,
  incoming: FleetRobot[],
  source: "rest" | "sse",
): FleetRobot[] {
  const byId = new Map(current?.map((robot) => [robot.robotId, robot]));

  return incoming.map((robot) => {
    const prior = byId.get(robot.robotId);

    return prior && keepCurrent(prior, robot, source) ? prior : robot;
  });
}

export function mergeRobotUpdate(
  current: FleetRobot[] | undefined,
  incoming: FleetRobot,
): FleetRobot[] {
  if (!current) return [incoming];

  const prior = current.find((robot) => robot.robotId === incoming.robotId);

  if (prior && keepCurrent(prior, incoming, "sse")) return current;

  return prior
    ? current.map((robot) => (robot.robotId === incoming.robotId ? incoming : robot))
    : [...current, incoming];
}
