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

  const snapMove = await page.evaluate(() => {
    const frameElement = document.querySelector(".frame");
    const targetElement = document.querySelector(".section > p");

    if (!frameElement || !targetElement) {
      throw new Error("Expected frame and snap target to exist");
    }

    const frameRect = frameElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();

    return {
      startX: frameRect.left + frameRect.width / 2,
      startY: frameRect.top + frameRect.height / 2,
      endX: frameRect.left + frameRect.width / 2 + targetRect.left - frameRect.left + 4,
      endY: targetRect.top + targetRect.height / 2,
      targetLeft: targetRect.left,
    };
  });

  await page.mouse.move(snapMove.startX, snapMove.startY);
  await page.mouse.down();
  await page.mouse.move(snapMove.endX, snapMove.endY);

  const verticalGuide = page.locator('[data-snap-guide="vertical"]');
  await expect(verticalGuide).toHaveAttribute("data-visible", "true");

  const frameDuringSnap = await frame.boundingBox();
  if (!frameDuringSnap) {
    throw new Error("Expected snapped FigmaBox to have a layout box");
  }
  expect(frameDuringSnap.x).toBeCloseTo(snapMove.targetLeft, 1);

  await page.mouse.up();
  await expect(verticalGuide).not.toHaveAttribute("data-visible", "true");

  const verticalLineSnapMove = await page.evaluate(() => {
    const frameElement = document.querySelector(".frame");
    const targetElement = document.querySelector(".site-header");

    if (!frameElement || !targetElement) {
      throw new Error("Expected frame and header snap target to exist");
    }

    const frameRect = frameElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();

    return {
      startX: frameRect.left + frameRect.width / 2,
      startY: frameRect.top + frameRect.height / 2,
      endX: frameRect.left + frameRect.width / 2 + targetRect.left - frameRect.left + 4,
      endY: targetRect.bottom + 48,
      targetLeft: targetRect.left,
    };
  });

  await page.mouse.move(verticalLineSnapMove.startX, verticalLineSnapMove.startY);
  await page.mouse.down();
  await page.mouse.move(verticalLineSnapMove.endX, verticalLineSnapMove.endY);

  await expect(verticalGuide).toHaveAttribute("data-visible", "true");

  const frameDuringVerticalLineSnap = await frame.boundingBox();
  if (!frameDuringVerticalLineSnap) {
    throw new Error("Expected edge-snapped FigmaBox to have a layout box");
  }
  expect(
    Math.abs(frameDuringVerticalLineSnap.x - verticalLineSnapMove.targetLeft),
  ).toBeLessThanOrEqual(1);

  await page.mouse.up();
  await expect(verticalGuide).not.toHaveAttribute("data-visible", "true");

  const verticalSnapMove = await page.evaluate(() => {
    const frameElement = document.querySelector(".frame");
    const targetElement = document.querySelector(".section > p");

    if (!frameElement || !targetElement) {
      throw new Error("Expected frame and vertical snap target to exist");
    }

    const frameRect = frameElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();

    return {
      startX: frameRect.left + frameRect.width / 2,
      startY: frameRect.top + frameRect.height / 2,
      endX: frameRect.left + frameRect.width / 2,
      endY: frameRect.top + frameRect.height / 2 + targetRect.top - frameRect.top + 4,
      targetTop: targetRect.top,
    };
  });

  await page.mouse.move(verticalSnapMove.startX, verticalSnapMove.startY);
  await page.mouse.down();
  await page.mouse.move(verticalSnapMove.endX, verticalSnapMove.endY);

  const horizontalGuide = page.locator('[data-snap-guide="horizontal"]');
  await expect(horizontalGuide).toHaveAttribute("data-visible", "true");

  const frameDuringVerticalSnap = await frame.boundingBox();
  if (!frameDuringVerticalSnap) {
    throw new Error("Expected vertically snapped FigmaBox to have a layout box");
  }
  expect(Math.abs(frameDuringVerticalSnap.y - verticalSnapMove.targetTop)).toBeLessThanOrEqual(1);

  await page.mouse.up();
  await expect(horizontalGuide).not.toHaveAttribute("data-visible", "true");

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
