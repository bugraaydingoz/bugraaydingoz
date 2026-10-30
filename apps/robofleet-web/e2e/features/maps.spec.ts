import { expect, fixture, test } from "../fixtures";

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

test("animates between samples, keeps overlays aligned, and stops on stale snapshots", async ({
  page,
}) => {
  const moving = {
    ...fixture.robots[0],
    speedMps: 0.8,
    sampleAgeMs: 0,
    route: [
      [1520, 876],
      [1520, 1196],
    ],
  };
  const robots = [moving, ...fixture.robots.slice(1)];

  await page.clock.install();
  await page.route("**/api/robots", (route) => route.fulfill({ json: { robots } }));
  await page.route("**/api/events", (route) =>
    route.fulfill({
      contentType: "text/event-stream",
      body: `event: fleet.snapshot\ndata: ${JSON.stringify({ robots })}\n\n`,
    }),
  );
  await page.goto("/?robot=AMR-001");

  const marker = page.locator('[data-robot-id="AMR-001"] foreignObject');
  await expect(marker).toBeVisible();
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 100)));

  const initial = Number(await marker.getAttribute("x"));
  await page.clock.runFor(250);
  const next = Number(await marker.getAttribute("x"));
  expect(initial - next).toBeGreaterThan(1.5);
  expect(initial - next).toBeLessThan(3);

  await page.clock.runFor(250);
  expect(next - Number(await marker.getAttribute("x"))).toBeGreaterThan(1.5);

  const ring = page.locator('[data-robot-id="AMR-001"] [data-slot="robot-highlight"]');
  const centerX = Number(await ring.getAttribute("cx"));
  const centerY = Number(await ring.getAttribute("cy"));
  expect(centerX - Number(await marker.getAttribute("x"))).toBeCloseTo(
    (((110 * 0.28) / 0.43) * 120) / 260,
    5,
  );
  const path = await page
    .getByRole("group", { name: "Hotel robot positions" })
    .locator("polyline")
    .getAttribute("points");
  const [routeX, routeY] = path!.split(" ")[0].split(",").map(Number);
  expect(routeX).toBeCloseTo(centerX, 5);
  expect(routeY).toBeCloseTo(centerY, 5);

  await page.clock.runFor(2000);
  const frozen = await marker.getAttribute("x");
  await page.clock.runFor(3000);
  await expect(marker).toHaveAttribute("x", frozen!);
});

test("respects reduced-motion preferences for predicted robot movement", async ({ page }) => {
  const moving = {
    ...fixture.robots[0],
    speedMps: 0.8,
    route: [
      [1520, 876],
      [1520, 1196],
    ],
  };
  const robots = [moving, ...fixture.robots.slice(1)];

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.route("**/api/robots", (route) => route.fulfill({ json: { robots } }));
  await page.route("**/api/events", (route) =>
    route.fulfill({
      contentType: "text/event-stream",
      body: `event: fleet.snapshot\ndata: ${JSON.stringify({ robots })}\n\n`,
    }),
  );
  await page.goto("/");

  const marker = page.locator('[data-robot-id="AMR-001"] foreignObject');
  await expect(marker).toBeVisible();
  const initial = await marker.getAttribute("x");
  await page.clock.runFor(1000);
  await expect(marker).toHaveAttribute("x", initial!);
});

test.describe("Workflows", () => {
  test("links neutral card and robot highlights on hover and preserves selection", async ({
    page,
  }) => {
    await page.goto("/?robot=AMR-001");
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
});
