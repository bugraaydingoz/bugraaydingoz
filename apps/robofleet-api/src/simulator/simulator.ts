import type { FleetMap, RobotProfile, Telemetry } from "../contracts";
import type { Database } from "../maps/repository";
import { createMapRepository } from "../maps/repository";
import { advance, mapRoute, routeLength } from "../maps/routing";
import type { createTelemetryProducer } from "../telemetry/producer";

export async function startSimulator(
  database: Database,
  producer: Pick<ReturnType<typeof createTelemetryProducer>, "publish">,
) {
  // A dedicated session prevents a second API instance from simulating the same fleet.
  const lease = await database.client.reserve();
  const [lock] =
    await lease`select pg_try_advisory_lock(hashtext('robofleet:simulator')) as acquired`;

  if (!lock.acquired) {
    lease.release();

    return { stop: async () => {}, active: false };
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let pending: Promise<void> = Promise.resolve();

  try {
    const rows =
      await lease`update robots set generation=generation+1 where profile is not null returning id,generation,profile`;
    const maps = createMapRepository(database);
    const robots: {
      id: string;
      generation: number;
      sequence: number;
      profile: RobotProfile;
      map: FleetMap;
      state: RobotProfile["initial"];
      total: number;
      trip: number;
    }[] = [];

    for (const row of rows) {
      const profile = row.profile as RobotProfile,
        map = await maps.get(profile.mapId, profile.mapVersion);

      if (!map) throw new Error("Simulator map is missing");

      const [latest] = await lease`select payload from robot_state where robot_id=${row.id}`;
      const saved = latest?.payload as Telemetry | undefined;
      const state = structuredClone(
        saved?.mapId === map.id && saved?.mapVersion === map.version ? saved : profile.initial,
      );

      if (state.destination && !state.route.length)
        state.route = mapRoute(
          map.definition,
          [state.position.x, state.position.y],
          state.destination,
        );

      robots.push({
        id: row.id,
        generation: row.generation,
        sequence: 0,
        profile,
        map,
        state,
        total: routeLength(state.route),
        trip: Number(row.id.match(/\d+$/)?.[0] ?? 0),
      });
    }

    let last = Date.now();
    const started = last;

    async function tick() {
      const now = Date.now(),
        elapsed = Math.min((now - last) / 1000, 2);

      last = now;

      for (const robot of robots) {
        if (stopped) break;

        const { state, map, profile } = robot,
          age = (now - started) / 1000;

        if (profile.scenario === "offline" && age % 60 < 40) continue;

        if (profile.scenario === "charging") {
          state.battery = Math.min(100, state.battery + elapsed * 0.1);
          state.status = state.battery >= 100 ? "Idle" : "Charging";
          state.detail =
            state.battery >= 100
              ? "Fully charged and ready for a task."
              : "Charging at the robot service dock.";
        }

        if (profile.scenario === "offline") {
          state.status = "Idle";
          state.detail = "Connection restored. Available for a task.";
        }

        if (profile.scenario === "blocked") {
          state.status = state.task ? (age % 60 < 20 ? "Blocked" : "Working") : "Idle";
          state.detail =
            state.status === "Blocked"
              ? "An obstacle is blocking the route. Waiting for the corridor to clear."
              : "Continuing the delivery.";
        }

        if (
          (profile.scenario === "working" || (profile.scenario === "blocked" && age % 60 >= 20)) &&
          !state.task
        ) {
          const destinations = map.definition.destinations.filter((d) =>
            d.name.startsWith("Room "),
          );
          const target = destinations[robot.trip++ % destinations.length];

          if (target) {
            state.destination = target.name;
            state.detail = `Delivering guest supplies to ${target.name}.`;
            state.route = mapRoute(
              map.definition,
              [state.position.x, state.position.y],
              target.name,
            );
            robot.total = routeLength(state.route);
            state.status = "Working";
            state.task = {
              id: `${robot.id}-${robot.generation}-${robot.trip}`,
              title: "Delivering guest supplies",
              progress: 0,
              remainingDistance: 0,
              etaSeconds: 0,
            };
          }
        }

        if (state.status === "Working" && state.task && state.route.length) {
          const moved = advance(state.route, (elapsed * 0.8) / map.definition.metresPerUnit);

          state.position = { x: moved.point[0], y: moved.point[1], heading: moved.heading };
          state.route = moved.route;
          state.battery = Math.max(5, state.battery - elapsed * 0.005);

          const remaining = routeLength(state.route) * map.definition.metresPerUnit;

          state.task = {
            ...state.task,
            remainingDistance: remaining,
            etaSeconds: Math.ceil(remaining / 0.8),
            progress: robot.total
              ? Math.min(100, 100 * (1 - routeLength(state.route) / robot.total))
              : 100,
          };
          state.location = "Guest corridor";

          if (state.route.length === 1) {
            state.location = state.destination!;
            state.destination = null;
            state.task = null;
            state.status = "Idle";
            state.detail = "Delivery completed. Waiting for the next task.";
          }
        }

        if (state.status === "Blocked" && state.task) {
          state.task.etaSeconds = null;
          state.task.remainingDistance = routeLength(state.route) * map.definition.metresPerUnit;
        }

        const message: Telemetry = {
          ...structuredClone(state),
          version: 1,
          eventId: crypto.randomUUID(),
          robotId: robot.id,
          generation: robot.generation,
          sequence: ++robot.sequence,
          recordedAt: new Date(now).toISOString(),
        };

        try {
          await producer.publish(message);
        } catch {
          console.error("Simulator could not enqueue telemetry", robot.id);
        }
      }
    }

    const schedule = () => {
      if (stopped) return;

      pending = tick()
        .catch(() => console.error("Simulator tick failed"))
        .finally(() => {
          if (!stopped) timer = setTimeout(schedule, 1000);
        });
    };

    schedule();

    return {
      active: true,
      async stop() {
        stopped = true;
        clearTimeout(timer);
        await pending;
        await lease`select pg_advisory_unlock(hashtext('robofleet:simulator'))`;
        lease.release();
      },
    };
  } catch (error) {
    await lease`select pg_advisory_unlock(hashtext('robofleet:simulator'))`;
    lease.release();
    throw error;
  }
}
