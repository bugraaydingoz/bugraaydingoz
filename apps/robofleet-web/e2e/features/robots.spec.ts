import { expect, fixture, test } from "../fixtures";

test("shows the left fleet panel and expands the selected robot", async ({ page, request }) => {
  await page.goto("/?robot=AMR-001");
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

test.describe("Workflows", () => {
  test("restores URL state after reload and batches map selection with filter reset", async ({
    page,
  }) => {
    await page.goto("/?robot=AMR-006&filter=attention&view=hotel");
    await expect(page.getByRole("list", { name: "Robots" }).getByRole("listitem")).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Bolt details" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(page.getByRole("button", { name: "Select Bolt on map" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.getByRole("button", { name: "Select Pixel on map" }).click();
    await expect(page).toHaveURL(/robot=AMR-007/);
    expect(new URL(page.url()).searchParams.has("filter")).toBe(false);
    expect(new URL(page.url()).searchParams.get("view")).toBe("hotel");
    await expect(page.getByRole("button", { name: "Pixel details" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await page.reload();
    await expect(page.getByRole("list", { name: "Robots" }).getByRole("listitem")).toHaveCount(8);
    await expect(page.getByRole("button", { name: "Pixel details" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await page.getByRole("button", { name: "Pixel details" }).click();
    await expect(page).toHaveURL("/?view=hotel");
    await expect(page.getByRole("button", { name: "Select Pixel on map" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await page.goBack();
    await expect(page.getByRole("button", { name: "Pixel details" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await page.goBack();
    await expect(page.getByRole("button", { name: "Attention 2" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByRole("button", { name: "Bolt details" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  test("navigates robot and filter changes with browser Back and Forward", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[aria-expanded="true"]')).toHaveCount(0);

    await page.getByRole("button", { name: "Attention 2" }).click();
    await expect(page).toHaveURL("/?filter=attention");
    await page.getByRole("button", { name: "Bolt details" }).click();
    await expect(page).toHaveURL(/robot=AMR-006/);
    await page.getByRole("button", { name: "Active 4" }).click();
    await expect(page).toHaveURL(/filter=active/);

    await page.goBack();
    await expect(page.getByRole("button", { name: "Attention 2" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByRole("button", { name: "Bolt details" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await page.goBack();
    await expect(page.getByRole("button", { name: "Bolt details" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await page.goBack();
    await expect(page.getByRole("list", { name: "Robots" }).getByRole("listitem")).toHaveCount(8);
    await page.goForward();
    await expect(page.getByRole("list", { name: "Robots" }).getByRole("listitem")).toHaveCount(2);
    await page.goForward();
    await expect(page.getByRole("button", { name: "Select Bolt on map" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
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
    await page.route("**/api/events", (route) =>
      route.fulfill({ status: 503, body: "unavailable" }),
    );
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
});
