import type { MapDefinition, Point } from "../contracts";

export const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Shortest path through the persisted graph, including destination vestibules. */
export function mapRoute(map: MapDefinition, start: Point, destination: string): Point[] {
  const target = map.destinations.find((d) => d.name === destination);

  if (!target) throw new Error("Unknown map destination");

  const entry = map.destinations.find((d) => distance(d.point, start) < 0.001);
  const source =
    entry?.node ??
    map.nodes.reduce(
      (best, point, i) => (distance(start, point) < distance(start, map.nodes[best]) ? i : best),
      0,
    );
  const costs = map.nodes.map(() => Infinity),
    previous = new Map<number, number>(),
    remaining = new Set(map.nodes.map((_, i) => i));

  costs[source] = 0;

  while (remaining.size) {
    const current = [...remaining].reduce((best, i) => (costs[i] < costs[best] ? i : best));

    if (!Number.isFinite(costs[current])) break;

    remaining.delete(current);

    if (current === target.node) break;

    for (const [a, b] of map.edges) {
      const next = a === current ? b : b === current ? a : -1;

      if (next < 0 || !remaining.has(next)) continue;

      const cost = costs[current] + distance(map.nodes[current], map.nodes[next]);

      if (cost < costs[next]) {
        costs[next] = cost;
        previous.set(next, current);
      }
    }
  }

  if (!Number.isFinite(costs[target.node])) throw new Error("Destination is disconnected");

  const nodes = [target.node];

  while (nodes[0] !== source) nodes.unshift(previous.get(nodes[0])!);

  return [
    start,
    ...[...(entry?.via ?? [])].reverse(),
    ...nodes.map((i) => map.nodes[i]),
    ...target.via,
    target.point,
  ].filter((p, i, all) => i === 0 || distance(p, all[i - 1]) > 0.001);
}

export function routeLength(route: Point[]) {
  return route.slice(1).reduce((length, p, i) => length + distance(route[i], p), 0);
}

export function advance(
  route: Point[],
  amount: number,
): { point: Point; heading: number; route: Point[] } {
  const rest = route.map((p) => [...p] as Point);
  let heading = 0;

  while (rest.length > 1) {
    const [a, b] = rest,
      length = distance(a, b);

    heading = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;

    if (amount < length) {
      const point: Point = [
        a[0] + ((b[0] - a[0]) * amount) / length,
        a[1] + ((b[1] - a[1]) * amount) / length,
      ];

      rest[0] = point;

      return { point, heading, route: rest };
    }

    amount -= length;
    rest.shift();
  }

  return { point: rest[0], heading, route: rest };
}
