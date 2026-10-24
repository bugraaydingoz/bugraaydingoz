import { expect, test } from "@playwright/test";

test("loads the UI and reaches the real API through the same-origin proxy", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "RoboFleet" })).toBeVisible();
  await expect(page.getByLabel("API response")).toContainText('"status": "ok"');

  await page.getByRole("button", { name: "Count: 0" }).click();
  await expect(page.getByRole("button", { name: "Count: 1" })).toBeVisible();

  const response = await request.get("/api/health?check=ready");
  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({ status: "ready" });
});

test("shows an error when the API is unavailable", async ({ page }) => {
  await page.route("**/api/health*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Unavailable" }),
    }),
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("Unable to reach the API");
});

test("uses shared design tokens in light and dark themes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("main")).toHaveCSS("padding", "32px");
  await expect(page.locator("body")).toHaveCSS("background-color", "oklch(1 0 0)");
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await expect(page.locator("body")).toHaveCSS("background-color", "oklch(0.145 0 0)");
  await expect(page.getByRole("button", { name: "Count: 0" })).toHaveCSS(
    "background-color",
    "oklch(0.922 0 0)",
  );
  await page.evaluate(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.setProperty("--primary", "rgb(1, 2, 3)");
  });
  await expect(page.getByRole("button", { name: "Count: 0" })).toHaveCSS(
    "background-color",
    "rgb(1, 2, 3)",
  );
});
