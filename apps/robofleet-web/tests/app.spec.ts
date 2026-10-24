import { expect, test } from "@playwright/test";

test("shows the left fleet panel and expands the selected robot", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Robots" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Robots" }).getByRole("listitem")).toHaveCount(8);
  await expect(page.getByRole("progressbar", { name: "Delivering pallet #024" })).toHaveAttribute(
    "aria-valuenow",
    "64",
  );
  await page.getByRole("button", { name: "Scout details" }).click();
  await expect(page.getByRole("progressbar", { name: "Collecting inventory" })).toHaveAttribute(
    "aria-valuenow",
    "28",
  );
  await expect(page.getByRole("progressbar", { name: "Delivering pallet #024" })).toHaveCount(0);
  await page.getByRole("button", { name: "Scout details" }).click();
  await expect(page.getByRole("progressbar", { name: "Collecting inventory" })).toHaveCount(0);
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
