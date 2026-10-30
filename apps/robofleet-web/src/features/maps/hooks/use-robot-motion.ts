import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Robot } from "@/data/robots";
import {
  evaluateMotion,
  reconcileMotion,
  type MotionModel,
  type MotionPose,
} from "@/features/maps/utils/robot-motion";

export function useRobotMotion(robots: Robot[], metresPerUnit: number) {
  const models = useRef(new Map<string, MotionModel>());
  const [poses, setPoses] = useState(new Map<string, MotionPose>());
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );

  useEffect(() => {
    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference?.matches ?? false);

    preference?.addEventListener("change", update);

    return () => preference?.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    let frame: number | undefined;
    const now = performance.now();
    const next = new Map<string, MotionModel>();

    for (const robot of robots) {
      next.set(
        robot.id,
        reconcileMotion(models.current.get(robot.id), robot, now, metresPerUnit, !reducedMotion),
      );
    }

    models.current = next;

    const paint = (time: number) => {
      const display = new Map<string, MotionPose>();
      let active = false;

      for (const [id, model] of models.current) {
        const result = evaluateMotion(model, time);

        display.set(id, result.pose);
        active ||= result.active;
      }

      setPoses(display);

      if (active) frame = requestAnimationFrame(paint);
    };

    paint(now);

    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [robots, metresPerUnit, reducedMotion]);

  return poses;
}
