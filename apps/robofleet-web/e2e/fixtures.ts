import fixture from "../src/test/fleet.json" with { type: "json" };
import { test as base } from "@playwright/test";

export { expect } from "@playwright/test";
export { fixture };

type BrowserEventSource = EventTarget & { closed: boolean };
declare global {
  interface Window {
    __fleetEventSources: BrowserEventSource[];
  }
}
type FleetEvents = {
  emit: (name: string, data?: unknown) => Promise<void>;
  connections: () => Promise<{ closed: boolean }[]>;
};

export const test = base.extend<{ fleetEvents: FleetEvents }>({
  // A controllable, persistent stream for workflows that must not signal EOF.
  fleetEvents: async ({ page }, use) => {
    await page.addInitScript(() => {
      const sources: BrowserEventSource[] = [];

      class ControlledEventSource extends EventTarget {
        closed = false;

        constructor() {
          super();
          sources.push(this);
        }

        close() {
          this.closed = true;
        }
      }

      Object.assign(window, { EventSource: ControlledEventSource, __fleetEventSources: sources });
    });

    await use({
      emit: (name, data) =>
        page.evaluate(
          ({ name, data }) => {
            const source = window.__fleetEventSources.at(-1);

            if (!source || source.closed) throw new Error("No active fleet stream");

            source.dispatchEvent(
              data === undefined
                ? new Event(name)
                : new MessageEvent(name, { data: JSON.stringify(data) }),
            );
          },
          { name, data },
        ),
      connections: () =>
        page.evaluate(() =>
          window.__fleetEventSources.map((source) => ({
            closed: source.closed,
          })),
        ),
    });
  },
  page: async ({ page }, use) => {
    await page.route("**/api/robots", (route) =>
      route.fulfill({ json: { robots: fixture.robots } }),
    );
    await page.route("**/api/maps", (route) => route.fulfill({ json: { maps: fixture.maps } }));
    await page.route("**/api/events", (route) =>
      route.fulfill({
        contentType: "text/event-stream",
        body: "event: fleet.snapshot\ndata: " + JSON.stringify({ robots: fixture.robots }) + "\n\n",
      }),
    );

    await use(page);
  },
});
