import { expect, test } from "@playwright/test";

test("calculates noradrenalin and switches patient defaults", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Perfusoren Rechner" })).toBeVisible();
  await expect(page.getByLabel("Gewicht in Kilogramm")).toHaveValue("80");

  await expect(page.getByRole("row", { name: /Noradrenalin/ })).toContainText("14,4");
  await expect(page.getByRole("row", { name: /Remifentanil/ })).toContainText(
    "Konzentration fehlt",
  );

  await page.getByRole("radio", { name: "Kind", exact: true }).click();

  await expect(page.getByLabel("Noradrenalin Laufbahn", { exact: true })).toHaveValue("0");
  await expect(page.getByLabel("Adrenalin Laufbahn", { exact: true })).toHaveValue("0.1");
  await expect(page.getByRole("row", { name: /Noradrenalin/ })).toContainText("0");
});
