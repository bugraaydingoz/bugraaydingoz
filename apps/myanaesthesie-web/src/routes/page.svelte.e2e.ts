import { expect, test } from "@playwright/test";

test("calculates noradrenalin and switches patient defaults", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Perfusoren Rechner" })).toBeVisible();
  await expect(page.getByLabel("Gewicht in Kilogramm")).toHaveValue("80");
  await expect(page.getByLabel("Größe in Zentimeter")).toHaveValue("175");

  await expect(page.getByRole("row", { name: /Noradrenalin/ })).toContainText("14,4");
  await expect(page.getByRole("row", { name: /Remifentanil/ })).toContainText("96");

  await page.getByRole("radio", { name: "Kind", exact: true }).click();

  await expect(page.getByLabel("Noradrenalin Laufbahn", { exact: true })).toHaveValue("0");
  await expect(page.getByLabel("Adrenalin Laufbahn", { exact: true })).toHaveValue("0.1");
  await expect(page.getByRole("row", { name: /Noradrenalin/ })).toContainText("0");
});

test("shows physiology parameters from shared patient inputs", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Parameter" }).click();

  await expect(page.getByRole("heading", { name: "Physiologische Parameter" })).toBeVisible();
  await expect(page.getByText("Ideales Körpergewicht")).toBeVisible();
  await expect(page.getByText("70,6 kg")).toBeVisible();
  await expect(page.getByText("Blutvolumen · 75 ml/kg")).toBeVisible();
  await expect(page.getByText("6 L")).toBeVisible();
  await expect(page.getByText("423-565 mL")).toBeVisible();

  await page.getByRole("radio", { name: "Weiblich" }).click();
  await expect(page.getByText("Blutvolumen · 61 ml/kg")).toBeVisible();
  await expect(page.getByText("4,9 L")).toBeVisible();
});
