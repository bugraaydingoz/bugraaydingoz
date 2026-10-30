import { describe, expect, it } from "vitest";
import { ROBOT_CAMERA_PITCH, robotCameraYaw } from "./robot-renderer.js";

const unit = (x: number, y: number) => {
  const length = Math.hypot(x, y);
  return [x / length, y / length];
};

describe("Robot facing direction", () => {
  it("projects the face normal along travel in every map direction", () => {
    for (const ratio of [0.5, 0.25, 0.75]) {
      for (const heading of [0, 30, 45, 90, 135, 180, 225, 270, 315, 359]) {
        const radians = (heading * Math.PI) / 180;
        const travel = unit(
          Math.cos(radians) - Math.sin(radians),
          (Math.cos(radians) + Math.sin(radians)) * ratio,
        );
        const yaw = (robotCameraYaw(heading, ratio) * Math.PI) / 180;
        // The model's face is local +X. Project that vector through the actual
        // camera basis used by the renderer (right and screen-down).
        const front = unit(
          Math.sin(yaw),
          Math.sin((ROBOT_CAMERA_PITCH * Math.PI) / 180) * Math.cos(yaw),
        );

        expect(front[0]).toBeCloseTo(travel[0], 8);
        expect(front[1]).toBeCloseTo(travel[1], 8);
      }
    }
  });

  it("faces toward the viewer on positive axes and away on negative axes", () => {
    expect(robotCameraYaw(0)).toBeGreaterThan(0);
    expect(robotCameraYaw(0)).toBeLessThan(90);
    expect(robotCameraYaw(90)).toBeGreaterThan(-90);
    expect(robotCameraYaw(90)).toBeLessThan(0);
    expect(Math.abs(robotCameraYaw(180))).toBeGreaterThan(90);
    expect(robotCameraYaw(270)).toBeGreaterThan(90);
    expect(robotCameraYaw(360)).toBeCloseTo(robotCameraYaw(0), 8);
  });
});
