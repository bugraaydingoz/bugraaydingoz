"use client";

import { memo, useMemo, type CSSProperties } from "react";
import { renderRobot, robotCameraYaw } from "./robot-renderer.js";

export interface RobotProps {
  color?: string;
  /** Map heading in degrees: 0 = +X, 90 = +Y, 180 = -X, 270 = -Y. */
  heading?: number;
  /** Ratio of the map's projected ground Y and X scales. */
  groundRatio?: number;
  /** Wheel rotation in radians. */
  wheelAngle?: number;
  size?: number;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/** Pure, SSR-safe SVG rendering of the 3D robot. No effects or global state. */
export const Robot = memo(function Robot({
  color = "#79bca0",
  heading = 60,
  groundRatio = 0.5,
  wheelAngle = 0,
  size = 240,
  label = "Robot",
  className,
  style,
}: RobotProps) {
  const html = useMemo(
    () =>
      renderRobot(color, robotCameraYaw(heading, groundRatio), wheelAngle).replace(
        "<svg ",
        '<svg style="width:100%;height:100%" ',
      ),
    [color, heading, groundRatio, wheelAngle],
  );
  return (
    <div
      role="img"
      aria-label={label}
      className={className}
      style={{ width: size, height: (size * 235) / 260, lineHeight: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});
