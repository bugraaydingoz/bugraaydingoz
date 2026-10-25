import { describe, expect, it } from "vitest";
import { HOTEL_GARDEN } from "./hotel-layout";
import { hotelDestinations, hotelRobotPlacements, hotelRoute } from "./hotel";

describe("Courtyard hotel routes", () => {
  it("takes the short corridor path to a room on the next side", () => {
    expect(hotelRoute([1516, 680], hotelDestinations["Room 104"])).toEqual([
      [1516, 680],
      [1520, 680],
      [1520, 876],
      [1630, 876],
    ]);
  });

  it("uses the enclosed service-room vestibule in both directions", () => {
    const start = hotelDestinations["Robot service"];
    const end = hotelDestinations["Room 110"];
    const route = hotelRoute(start, end);
    expect(route).toEqual([
      [560, 1685],
      [560, 1580],
      [680, 1580],
      [680, 1520],
      [680, 1324],
      [570, 1324],
    ]);
    expect(hotelRoute(end, start)).toEqual([...route].reverse());
  });

  it("keeps fleet routes orthogonal and outside the inner garden", () => {
    let segments = 0;
    for (const { point } of Object.values(hotelRobotPlacements)) {
      for (const destination of Object.values(hotelDestinations)) {
        const route = hotelRoute(point, destination);
        for (let index = 1; index < route.length; index++) {
          const [x, y] = route[index];
          const [previousX, previousY] = route[index - 1];
          expect(x === previousX || y === previousY).toBe(true);
          const midpointX = (x + previousX) / 2;
          const midpointY = (y + previousY) / 2;
          expect(
            midpointX > HOTEL_GARDEN.x &&
              midpointX < HOTEL_GARDEN.x + HOTEL_GARDEN.width &&
              midpointY > HOTEL_GARDEN.y &&
              midpointY < HOTEL_GARDEN.y + HOTEL_GARDEN.depth,
          ).toBe(false);
          segments++;
        }
      }
    }
    expect(segments).toBeGreaterThan(0);
  });
});
