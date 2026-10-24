import { expect, test } from "@playwright/test";

test("shows the left fleet panel and expands the selected robot", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Robots" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Robots" }).getByRole("listitem")).toHaveCount(8);
  await expect(page.getByRole("progressbar", { name: "Delivering towels" })).toHaveAttribute(
    "aria-valuenow",
    "64",
  );
  await page.getByRole("button", { name: "Scout details" }).click();
  await expect(page.getByRole("progressbar", { name: "Delivering room service" })).toHaveAttribute(
    "aria-valuenow",
    "28",
  );
  await expect(page.getByRole("progressbar", { name: "Delivering towels" })).toHaveCount(0);
  await page.getByRole("button", { name: "Scout details" }).click();
  await expect(page.getByRole("progressbar", { name: "Delivering room service" })).toHaveCount(0);
  await expect(page.getByRole("navigation")).toHaveCount(0);
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
  await expect(page.getByText("Demo fleet", { exact: true })).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    viewportWidth: innerWidth,
    viewportHeight: innerHeight,
  }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(dimensions.height).toBeLessThanOrEqual(dimensions.viewportHeight);
});

test("uses the shared light and dark design tokens", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toHaveCSS("background-color", "oklch(1 0 0)");
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await expect(page.locator("body")).toHaveCSS("background-color", "oklch(0.145 0 0)");
  await expect(
    page.getByRole("article", { name: "Atlas" }).getByText("Working", { exact: true }),
  ).toHaveCSS("background-color", "oklch(0.922 0 0)");
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
