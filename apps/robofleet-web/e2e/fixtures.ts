import fixture from "../src/test/fleet.json" with { type: "json" };
import { test as base } from "@playwright/test";

export { expect } from "@playwright/test";
export { fixture };

export const test = base.extend({
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
