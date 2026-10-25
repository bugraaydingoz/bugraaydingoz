import fixture from "../src/test/fleet.json" with { type: "json" };
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/robots", (route) => route.fulfill({ json: { robots: fixture.robots } }));
  await page.route("**/api/maps", (route) => route.fulfill({ json: { maps: fixture.maps } }));
  await page.route("**/api/events", (route) =>
    route.fulfill({
      contentType: "text/event-stream",
      body: "event: fleet.snapshot\ndata: " + JSON.stringify({ robots: fixture.robots }) + "\n\n",
    }),
  );
});

test("shows the left fleet panel and expands the selected robot", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Robots" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Robots" }).getByRole("listitem")).toHaveCount(8);
  await expect(page.getByRole("progressbar", { name: "Delivering towels" })).toHaveAttribute(
    "aria-valuenow",
    "64",
  );
  await page.getByRole("article", { name: "Scout", exact: true }).getByText("Kitchen").click();
  await expect(page.getByRole("progressbar", { name: "Delivering room service" })).toHaveAttribute(
    "aria-valuenow",
    "28",
  );
  await expect(page.getByRole("progressbar", { name: "Delivering towels" })).toHaveCount(0);
  await page.getByLabel("Scout battery 72%", { exact: true }).click();
  await expect(page.getByRole("progressbar", { name: "Delivering room service" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Select Scout on map" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.getByRole("button", { name: "Scout details" }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Scout details" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Scout details" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  await expect(navigation.getByRole("button")).toHaveCount(5);
  await expect(navigation.getByRole("button", { name: "Home", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("heading", { name: "API Health Check" })).toHaveCount(0);
  const response = await request.get("/api/health?check=ready");
  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({ status: "ready" });
});

test("filters attention and active robots and supports keyboard navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Attention 2" }).click();
  await expect(page.getByRole("list", { name: "Robots" }).getByRole("listitem")).toHaveCount(2);
  await page.getByRole("button", { name: "Bolt details" }).click();
  await expect(page.getByRole("article", { name: "Bolt" })).toContainText(
    "An obstacle is blocking the route.",
  );
  await page.getByRole("button", { name: "All robots", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "Active 4" })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByRole("list", { name: "Robots" }).getByRole("listitem")).toHaveCount(4);
  await expect(page.getByRole("article", { name: "Milo" })).toHaveCount(0);
});

test("keeps the fleet list scrollable on mobile without page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Robots" })).toBeVisible();
  await page.getByRole("button", { name: "Milo details" }).click();
  await expect(page.getByRole("article", { name: "Milo" })).toContainText("Connection lost.");
  await expect(page.getByRole("status")).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    viewportWidth: innerWidth,
    viewportHeight: innerHeight,
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(dimensions.height).toBeLessThanOrEqual(dimensions.viewportHeight);
});

test("uses shared light and dark surfaces with green working badges", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toHaveCSS("background-color", "oklch(1 0 0)");
  const working = page
    .getByRole("article", { name: "Atlas" })
    .getByText("Working", { exact: true });
  await expect(working).toHaveCSS("background-color", "oklch(0.527 0.154 150.069)");
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await expect(page.locator("body")).toHaveCSS("background-color", "oklch(0.145 0 0)");
  await expect(working).toHaveCSS("background-color", "oklch(0.792 0.209 151.711)");
});

test("links neutral card and robot highlights on hover and preserves selection", async ({
  page,
}) => {
  await page.goto("/");
  const scout = page.getByRole("article", { name: "Scout", exact: true });
  const atlas = page.getByRole("article", { name: "Atlas", exact: true });
  const bolt = page.getByRole("article", { name: "Bolt", exact: true });
  const scoutMarker = page.locator('[data-robot-id="AMR-002"] [data-slot="robot-highlight"]');
  const boltMarker = page.locator('[data-robot-id="AMR-006"] [data-slot="robot-highlight"]');
  const primary = "oklch(0.205 0 0)";
  const ringPrimary = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--primary").trim(),
  );
  const leave = () => page.getByRole("heading", { name: "Robots", exact: true }).hover();

  await scout.hover();
  await expect(scout).toHaveCSS("--tw-ring-color", /40%/);
  await expect(scoutMarker).toHaveCSS("stroke", primary);
  await expect(scoutMarker).toHaveCSS("stroke-opacity", "0.4");
  await expect(atlas).toHaveCSS("--tw-ring-color", ringPrimary);
  await expect(page.getByRole("button", { name: "Scout details" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await leave();
  await expect(scout).not.toHaveCSS("--tw-ring-color", ringPrimary);
  await expect(scoutMarker).toHaveCount(0);

  await page.getByRole("button", { name: "Scout details" }).click();
  await leave();
  await expect(scout).toHaveCSS("--tw-ring-color", ringPrimary);
  await expect(scoutMarker).toHaveCSS("stroke", primary);
  await expect(scoutMarker).toHaveCSS("stroke-opacity", "1");
  await expect(atlas).not.toHaveCSS("--tw-ring-color", ringPrimary);
  await expect(page.getByRole("button", { name: "Scout details" })).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );

  const mapRobot = page.getByRole("button", { name: "Select Bolt on map" });
  await mapRobot.hover();
  await expect(bolt).toHaveCSS("--tw-ring-color", /40%/);
  await expect(boltMarker).toHaveCSS("stroke", primary);
  await expect(boltMarker).toHaveCSS("stroke-opacity", "0.4");
  await leave();
  await expect(bolt).not.toHaveCSS("--tw-ring-color", ringPrimary);
  await expect(boltMarker).toHaveCount(0);

  await mapRobot.click();
  await leave();
  await expect(bolt).toHaveCSS("--tw-ring-color", ringPrimary);
  await expect(boltMarker).toHaveCSS("stroke", primary);
  await expect(boltMarker).toHaveCSS("stroke-opacity", "1");
  await expect(scout).not.toHaveCSS("--tw-ring-color", ringPrimary);
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  const darkRingPrimary = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--primary").trim(),
  );
  await expect(bolt).toHaveCSS("--tw-ring-color", darkRingPrimary);
  await expect(boltMarker).toHaveCSS("stroke", "oklch(0.922 0 0)");
});

test("fills the area beside the panel and links map robots to their cards", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("img", { name: "Isometric hotel floor plan" })).toBeVisible();
  const panel = (await page.getByRole("complementary", { name: "Robot fleet" }).boundingBox())!;
  const map = (await page.getByRole("region", { name: "Hotel", exact: true }).boundingBox())!;
  expect(map.x).toBeGreaterThanOrEqual(panel.x + panel.width);
  expect(map.y).toBe(panel.y);
  expect(map.height).toBe(panel.height);
  const panelCard = page
    .getByRole("complementary", { name: "Robot fleet" })
    .locator('[data-slot="card"]')
    .first();
  const radius = await panelCard.evaluate((element) => getComputedStyle(element).borderRadius);
  await expect(page.getByRole("region", { name: "Hotel", exact: true })).toHaveCSS(
    "border-radius",
    radius,
  );
  await page.getByRole("button", { name: "Scout details" }).click();
  await expect(page.getByRole("button", { name: "Select Scout on map" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Attention 2" }).click();
  await page.getByRole("button", { name: "Select Pixel on map" }).click();
  await expect(page.getByRole("button", { name: "All robots", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "Pixel details" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pixel details" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
});

test("supports hotel map zoom, wheel input, dragging, keyboard pan, and reset", async ({
  page,
}) => {
  await page.goto("/");
  const map = page.getByRole("group", { name: "Hotel map canvas", exact: true });
  const layers = map.locator('[data-slot="map-layers"]');
  const initial = await layers.getAttribute("style");
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reset map view" })).toHaveText("120%");
  await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reset map view" })).toHaveText("100%");
  const bounds = (await map.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + 120);
  await page.mouse.down();
  await expect(map).toHaveCSS("outline-style", "none");
  await page.mouse.move(bounds.x + bounds.width / 2 + 80, bounds.y + 160, { steps: 6 });
  await page.mouse.up();
  await expect(map).toHaveCSS("outline-style", "none");
  expect(await layers.getAttribute("style")).not.toBe(initial);
  await page.getByRole("button", { name: "Reset map view" }).click();
  await expect(layers).toHaveAttribute("style", initial!);
  await map.focus();
  await page.keyboard.press("ArrowDown");
  await expect(map).toHaveCSS("outline-style", "solid");
  expect(await layers.getAttribute("style")).not.toBe(initial);
  await page.keyboard.press("0");
  await expect(layers).toHaveAttribute("style", initial!);
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + 120);
  await page.mouse.wheel(0, -120);
  await expect(page.getByRole("button", { name: "Reset map view" })).not.toHaveText("100%");
});

test("keeps map robots anchored while pressing and selecting them", async ({ page }) => {
  await page.goto("/");
  const robot = page.getByRole("button", { name: "Select Bolt on map" });
  const artwork = page.getByRole("img", { name: "Bolt robot", exact: true });
  for (const zoom of ["100%", "120%"]) {
    if (zoom === "120%") {
      await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    }
    await expect(page.getByRole("button", { name: "Reset map view" })).toHaveText(zoom);
    const initial = (await artwork.boundingBox())!;
    const bounds = (await robot.boundingBox())!;
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await expect(robot).toHaveCSS("translate", "none");
    expect(await artwork.boundingBox()).toEqual(initial);
    await page.mouse.up();
    await expect(robot).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Bolt details" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(await artwork.boundingBox()).toEqual(initial);
  }
});

test("updates fleet cards and map positions from SSE and ignores older telemetry", async ({
  page,
}) => {
  const robot = {
    ...fixture.robots[0],
    sequence: 2,
    battery: 99,
    position: { ...fixture.robots[0].position, x: 1700 },
  };
  await page.route("**/api/events", (route) =>
    route.fulfill({
      contentType: "text/event-stream",
      body:
        `event: fleet.snapshot\ndata: ${JSON.stringify({ robots: fixture.robots })}\n\n` +
        `event: robot.updated\ndata: ${JSON.stringify({ robot })}\n\n` +
        `event: robot.updated\ndata: ${JSON.stringify({ robot: { ...robot, sequence: 1, battery: 1 } })}\n\n`,
    }),
  );
  await page.goto("/");
  await expect(page.getByLabel("Atlas battery 99%")).toBeVisible();
  const marker = page.locator('[data-robot-id="AMR-001"] foreignObject');
  const x = 700 + (1700 - robot.position.y) * 0.28 - (((110 * 0.28) / 0.43) * 120) / 260;
  await expect(marker).toHaveAttribute("x", String(x));
});

test("shows a backend failure without a demo fleet fallback", async ({ page }) => {
  await page.route("**/api/robots", (route) =>
    route.fulfill({ status: 503, json: { error: "unavailable" } }),
  );
  await page.route("**/api/maps", (route) =>
    route.fulfill({ status: 503, json: { error: "unavailable" } }),
  );
  await page.route("**/api/events", (route) => route.fulfill({ status: 503, body: "unavailable" }));
  await page.goto("/");
  await expect(page.getByRole("status")).toHaveText("Backend unavailable");
  await expect(page.getByRole("article")).toHaveCount(0);
});

test("recovers when the first SSE request fails before the backend starts", async ({ page }) => {
  let connections = 0;
  await page.route("**/api/events", (route) => {
    connections++;
    return connections === 1
      ? route.fulfill({ status: 503, body: "starting" })
      : route.fulfill({
          contentType: "text/event-stream",
          body: `event: fleet.snapshot\ndata: ${JSON.stringify({ robots: fixture.robots })}\n\n`,
        });
  });
  await page.goto("/");
  await expect.poll(() => connections).toBeGreaterThan(1);
  await expect(page.getByRole("article")).toHaveCount(8);
});
