import type { FleetRobot } from "../api/robots.api";
import type { Robot } from "../types/robot";

export function presentRobot(robot: FleetRobot): Robot {
  return {
    ...robot,
    id: robot.robotId,
    battery: Math.round(robot.battery),
    speedMps: robot.speedMps ?? 0,
    sampleAgeMs: robot.sampleAgeMs ?? 0,
    task: robot.task
      ? {
          ...robot.task,
          progress: Math.round(robot.task.progress),
          distance: `${Math.round(robot.task.remainingDistance)} m`,
          eta:
            robot.task.etaSeconds === null
              ? "Paused"
              : `${Math.max(1, Math.ceil(robot.task.etaSeconds / 60))} min`,
        }
      : null,
  };
}

export function presentRobots(robots: FleetRobot[]): Robot[] {
  return robots.map(presentRobot);
}
