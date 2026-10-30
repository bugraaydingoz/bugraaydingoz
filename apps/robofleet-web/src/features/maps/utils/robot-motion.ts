import type { Robot } from "@/features/robots/types/robot";

export type Point = [number, number];
export type MotionSample = Pick<
  Robot,
  | "id"
  | "generation"
  | "sequence"
  | "mapId"
  | "mapVersion"
  | "position"
  | "route"
  | "speedMps"
  | "sampleAgeMs"
  | "status"
  | "destination"
  | "task"
>;
export type MotionPose = { x: number; y: number; heading: number; route: Point[] };

export const PREDICTION_MS = 1500;
export const CORRECTION_MS = 200;
const SNAP_DISTANCE_M = 1.5;
const EPSILON = 0.000001;

export type MotionModel = {
  sample: MotionSample;
  path: Point[];
  anchorAt: number;
  baseDistance: number;
  correction: number;
  correctionMs: number;
  metresPerUnit: number;
  heading: number;
  renderedAt: number;
  enabled: boolean;
};

const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const normalAngle = (angle: number) => ((angle % 360) + 360) % 360;
const angleDifference = (from: number, to: number) => ((to - from + 540) % 360) - 180;

function cleanPath(points: Point[]): Point[] {
  return points.filter(
    (point, index) => index === 0 || distance(point, points[index - 1]) > EPSILON,
  );
}

function samplePath(sample: MotionSample): Point[] {
  return cleanPath([[sample.position.x, sample.position.y], ...sample.route]);
}

function pathLength(path: Point[]): number {
  return path.slice(1).reduce((length, point, index) => length + distance(path[index], point), 0);
}

function pointOnPath(path: Point[], travel: number, heading: number): MotionPose {
  let remaining = Math.max(0, travel);

  for (let index = 1; index < path.length; index++) {
    const start = path[index - 1];
    const end = path[index];
    const length = distance(start, end);

    if (remaining < length) {
      const ratio = remaining / length;
      const point: Point = [
        start[0] + (end[0] - start[0]) * ratio,
        start[1] + (end[1] - start[1]) * ratio,
      ];

      return {
        x: point[0],
        y: point[1],
        heading: normalAngle((Math.atan2(end[1] - start[1], end[0] - start[0]) * 180) / Math.PI),
        route: [point, ...path.slice(index)],
      };
    }

    remaining -= length;
    heading = normalAngle((Math.atan2(end[1] - start[1], end[0] - start[0]) * 180) / Math.PI);
  }

  const point = path.at(-1)!;

  return { x: point[0], y: point[1], heading, route: [point] };
}

/** Find a point's progress along a path, with error measured in world units. */
function locate(path: Point[], point: Point) {
  let travelled = 0;
  let nearest = { error: Infinity, progress: 0, segment: 0 };

  for (let index = 1; index < path.length; index++) {
    const start = path[index - 1];
    const end = path[index];
    const length = distance(start, end);
    const ratio = Math.max(
      0,
      Math.min(
        1,
        ((point[0] - start[0]) * (end[0] - start[0]) +
          (point[1] - start[1]) * (end[1] - start[1])) /
          (length * length),
      ),
    );
    const projected: Point = [
      start[0] + (end[0] - start[0]) * ratio,
      start[1] + (end[1] - start[1]) * ratio,
    ];
    const error = distance(projected, point);

    if (error < nearest.error)
      nearest = { error, progress: travelled + ratio * length, segment: index - 1 };

    travelled += length;
  }

  return nearest;
}

function canPredict(model: MotionModel) {
  return (
    model.enabled &&
    model.sample.status === "Working" &&
    model.sample.speedMps > 0 &&
    model.path.length > 1 &&
    model.sample.sampleAgeMs < PREDICTION_MS
  );
}

/** Sample the display pose. Neither telemetry nor its route is mutated. */
export function evaluateMotion(
  model: MotionModel,
  now: number,
): { pose: MotionPose; active: boolean } {
  const rawElapsed = Math.max(0, now - model.anchorAt);
  const horizon = Math.max(0, PREDICTION_MS - model.sample.sampleAgeMs);
  const elapsed = Math.min(rawElapsed, horizon);
  const predicting = canPredict(model);
  const age = Math.min(PREDICTION_MS, model.sample.sampleAgeMs + elapsed);
  const travel = predicting ? (model.sample.speedMps * age) / 1000 / model.metresPerUnit : 0;
  const fraction = Math.min(1, elapsed / model.correctionMs);
  const ease = fraction * fraction * (3 - 2 * fraction);
  const progress = Math.max(0, model.baseDistance + travel + model.correction * (1 - ease));
  const pose = pointOnPath(model.path, progress, model.sample.position.heading);
  const targetHeading = normalAngle(predicting ? pose.heading : model.sample.position.heading);
  const difference = angleDifference(model.heading, targetHeading);
  const delta = Math.max(0, now - model.renderedAt);

  model.heading = model.enabled
    ? normalAngle(model.heading + difference * (1 - Math.exp(-delta / 60)))
    : targetHeading;
  model.renderedAt = now;
  pose.heading = model.heading;

  return {
    pose,
    active:
      (predicting && age < PREDICTION_MS && progress < pathLength(model.path)) ||
      (predicting &&
        rawElapsed < horizon &&
        elapsed < model.correctionMs &&
        Math.abs(model.correction) > EPSILON) ||
      (model.enabled && Math.abs(angleDifference(model.heading, targetHeading)) > 0.1),
  };
}

export function reconcileMotion(
  previous: MotionModel | undefined,
  sample: MotionSample,
  now: number,
  metresPerUnit: number,
  enabled = true,
): MotionModel {
  if (
    previous &&
    (sample.generation < previous.sample.generation ||
      (sample.generation === previous.sample.generation &&
        sample.sequence < previous.sample.sequence))
  )
    return previous;

  const sameMap =
    previous?.sample.mapId === sample.mapId && previous.sample.mapVersion === sample.mapVersion;
  const sameGeneration = previous?.sample.generation === sample.generation;

  if (previous && sameMap && sameGeneration && sample.sequence <= previous.sample.sequence) {
    // Status can change to Offline without a new telemetry sequence. Snap to the
    // last authoritative position, but never refresh prediction for a snapshot.
    if (
      sample.sequence < previous.sample.sequence ||
      (sample.status === previous.sample.status && previous.enabled === enabled)
    )
      return previous;

    sample = {
      ...sample,
      sampleAgeMs: Math.max(
        sample.sampleAgeMs,
        previous.sample.sampleAgeMs + Math.max(0, now - previous.anchorAt),
      ),
    };
  }

  const model: MotionModel = {
    sample,
    path: samplePath(sample),
    anchorAt: now,
    baseDistance: 0,
    correction: 0,
    correctionMs: CORRECTION_MS,
    metresPerUnit,
    heading: normalAngle(sample.position.heading),
    renderedAt: now,
    enabled,
  };

  if (
    !previous ||
    !sameMap ||
    !sameGeneration ||
    !canPredict(model) ||
    !previous.enabled ||
    sample.destination !== previous.sample.destination ||
    sample.task?.id !== previous.sample.task?.id
  )
    return model;

  const displayed = evaluateMotion(previous, now).pose;
  const target = pointOnPath(
    model.path,
    (sample.speedMps * sample.sampleAgeMs) / 1000 / metresPerUnit,
    sample.position.heading,
  );

  if (distance([displayed.x, displayed.y], [target.x, target.y]) * metresPerUnit > SNAP_DISTANCE_M)
    return model;

  const displayPoint: Point = [displayed.x, displayed.y];
  const onNewPath = locate(model.path, displayPoint);

  if (onNewPath.error * metresPerUnit < 0.005) {
    model.correction =
      onNewPath.progress - (sample.speedMps * sample.sampleAgeMs) / 1000 / metresPerUnit;
  } else {
    // If the update has passed a corner, retain the old corridor prefix up to
    // the reported position, then join the new route. Corrections stay on-path.
    const onOldPath = locate(displayed.route, [sample.position.x, sample.position.y]);

    if (onOldPath.error * metresPerUnit >= 0.005) return model;

    const prefix = cleanPath([
      ...displayed.route.slice(0, onOldPath.segment + 1),
      [sample.position.x, sample.position.y],
    ]);
    model.baseDistance = pathLength(prefix);
    model.path = cleanPath([...prefix, ...model.path]);
    model.correction =
      -model.baseDistance - (sample.speedMps * sample.sampleAgeMs) / 1000 / metresPerUnit;
  }

  // A longer slowdown for an overshoot avoids reversing the robot merely to
  // correct network jitter. Behind-schedule corrections still take 200 ms.
  model.correctionMs =
    model.correction > 0
      ? Math.max(CORRECTION_MS, ((model.correction * metresPerUnit) / sample.speedMps) * 1500)
      : CORRECTION_MS;
  model.heading = displayed.heading;

  return model;
}
