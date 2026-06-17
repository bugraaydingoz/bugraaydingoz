import { expect, test } from "@playwright/test";

test("home page presents portfolio essentials", async ({ page }) => {
    await page.goto("/");

    const brand = page.getByRole("link", { name: /Buğra Aydıngöz/ });
    await expect(brand).toBeVisible();
    await expect(brand).toContainText("Product Engineer");
    await expect(page.getByRole("heading", { name: "Work" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Contact" })).toBeVisible();
});

test("FigmaBox can be selected, dragged, resized, and rounded", async ({ page }) => {
    await page.goto("/");

    const box = page.locator("[data-figma-box]");
    const frame = box.locator(".frame");
    const text = page.getByText("I am a Product Engineer");
    const textBefore = await text.boundingBox();

    await box.click();
    await expect(box).toHaveAttribute("data-selected", "true");

    const frameBeforeDrag = await frame.boundingBox();
    if (!frameBeforeDrag || !textBefore) {
        throw new Error("Expected FigmaBox and intro text to have layout boxes");
    }

    await page.mouse.move(
        frameBeforeDrag.x + frameBeforeDrag.width / 2,
        frameBeforeDrag.y + frameBeforeDrag.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
        frameBeforeDrag.x + frameBeforeDrag.width / 2 + 32,
        frameBeforeDrag.y + frameBeforeDrag.height / 2 + 24,
    );
    await page.mouse.up();

    const frameAfterDrag = await frame.boundingBox();
    const textAfterDrag = await text.boundingBox();
    if (!frameAfterDrag || !textAfterDrag) {
        throw new Error("Expected FigmaBox and intro text to remain measurable");
    }

    expect(frameAfterDrag.x).toBeGreaterThan(frameBeforeDrag.x + 20);
    expect(frameAfterDrag.y).toBeGreaterThan(frameBeforeDrag.y + 12);
    expect(textAfterDrag.y).toBeCloseTo(textBefore.y, 1);

    const rightEdge = page.locator('[data-resize-handle="r"]');
    const rightEdgeBox = await rightEdge.boundingBox();
    if (!rightEdgeBox) {
        throw new Error("Expected right resize edge to have a layout box");
    }

    await page.mouse.move(
        rightEdgeBox.x + rightEdgeBox.width / 2,
        rightEdgeBox.y + rightEdgeBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
        rightEdgeBox.x + rightEdgeBox.width / 2 + 24,
        rightEdgeBox.y + rightEdgeBox.height / 2,
    );
    await page.mouse.up();

    const frameAfterResize = await frame.boundingBox();
    if (!frameAfterResize) {
        throw new Error("Expected resized FigmaBox to have a layout box");
    }
    expect(frameAfterResize.width).toBeGreaterThan(frameAfterDrag.width + 12);

    const radiusHandle = page.locator('[data-radius-handle="tl"]');
    const radiusHandleBox = await radiusHandle.boundingBox();
    if (!radiusHandleBox) {
        throw new Error("Expected radius handle to have a layout box");
    }

    await page.mouse.move(
        radiusHandleBox.x + radiusHandleBox.width / 2,
        radiusHandleBox.y + radiusHandleBox.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
        radiusHandleBox.x + radiusHandleBox.width / 2 + 20,
        radiusHandleBox.y + radiusHandleBox.height / 2 + 20,
    );
    await page.mouse.up();

    await expect(box).toHaveAttribute("data-radius", /[1-9]/);
});
