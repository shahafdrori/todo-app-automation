// tests/utils/mapHelpers.ts
import { Page, expect, Locator } from "@playwright/test";

export const MAP_SELECTOR = '[data-test="task-map"]';
export const LNG_INPUT_SELECTOR = '[data-test="lng-input"]';
export const LAT_INPUT_SELECTOR = '[data-test="lat-input"]';

export type LngLat = {
  longitude: number;
  latitude: number;
};

async function waitForMapReady(page: Page): Promise<Locator> {
  const map = page.locator(MAP_SELECTOR);

  // 1. container visible
  await expect(map).toBeVisible();

  // 2. OpenLayers + marker + click handler are wired
  await page.waitForFunction(() => {
    const w = window as any;
    return !!w.__OL_DEBUG__ && !!w.__OL_DEBUG__.map && !!w.__OL_DEBUG__.markerFeature;
  });

  return map;
}

async function getMapBox(page: Page) {
  const map = await waitForMapReady(page);
  const box = await map.boundingBox();
  if (!box) {
    throw new Error("Map bounding box not found");
  }
  return box;
}

export async function getZoom(page: Page): Promise<number | null> {
  return await page.evaluate(() => {
    const debug = (window as any).__OL_DEBUG__;
    return debug?.getZoom?.() ?? null;
  });
}

export async function getMarkerCoords(
  page: Page
): Promise<[number, number] | null> {
  return await page.evaluate(() => {
    const debug = (window as any).__OL_DEBUG__;
    return debug?.getMarkerCoords?.() ?? null;
  });
}

/**
 * Dialog map:
 *  - click random point
 *  - wait for lng/lat inputs
 *  - validate ranges
 *  - validate marker is present and moved
 */
export async function clickRandomOnMapAndValidateInputs(
  page: Page
): Promise<LngLat> {
  const box = await getMapBox(page);

  const markerBefore = await getMarkerCoords(page);

  const x = box.x + Math.random() * box.width;
  const y = box.y + Math.random() * box.height;

  await page.mouse.click(x, y);

  const lngInput = page.locator(LNG_INPUT_SELECTOR);
  const latInput = page.locator(LAT_INPUT_SELECTOR);

  await expect(lngInput).toBeVisible();
  await expect(latInput).toBeVisible();

  await expect(lngInput).not.toHaveValue("");
  await expect(latInput).not.toHaveValue("");

  const lngStr = await lngInput.inputValue();
  const latStr = await latInput.inputValue();

  const longitude = Number(lngStr);
  const latitude = Number(latStr);

  expect(Number.isFinite(longitude)).toBeTruthy();
  expect(Number.isFinite(latitude)).toBeTruthy();
  expect(longitude).toBeGreaterThanOrEqual(-180);
  expect(longitude).toBeLessThanOrEqual(180);
  expect(latitude).toBeGreaterThanOrEqual(-90);
  expect(latitude).toBeLessThanOrEqual(90);

  await page.waitForTimeout(50);

  const markerAfter = await getMarkerCoords(page);
  expect(markerAfter).not.toBeNull();

  if (markerBefore && markerAfter) {
    const dx = markerAfter[0] - markerBefore[0];
    const dy = markerAfter[1] - markerBefore[1];
    const distance = Math.sqrt(dx * dx + dy * dy);

    expect(distance).toBeGreaterThan(0);
    expect(distance, "Marker coords did not change after click").toBeGreaterThan(0);

  }

  return { longitude, latitude };
}

/**
 * Generic pan helper.
 * Positive deltaX: drag right (map moves left); negative: drag left.
 * Positive deltaY: drag down (map moves up); negative: drag up.
 */
export async function pan(
  page: Page,
  deltaX: number,
  deltaY: number,
  steps = 15
) {
  const box = await getMapBox(page);
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps });
  await page.mouse.up();
}

/**
 * Zoom with + / − buttons (dialog map).
 */
export async function zoomWithButtons(
  page: Page,
  direction: "in" | "out",
  steps = 2
) {
  const map = await waitForMapReady(page);

  const button =
    direction === "in"
      ? map.locator("button.ol-zoom-in, .ol-zoom-in")
      : map.locator("button.ol-zoom-out, .ol-zoom-out");

  if (!(await button.isVisible())) {
    console.warn("[zoomWithButtons] Zoom buttons not visible, skipping.");
    return;
  }

  for (let i = 0; i < steps; i++) {
    await button.click();
  }
}

/**
 * Zoom with mouse wheel (map tab).
 * deltaY < 0 => zoom in, deltaY > 0 => zoom out.
 */
export async function zoomWithWheel(
  page: Page,
  deltaY: number,
  steps = 5
) {
  const box = await getMapBox(page);
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  await page.mouse.move(centerX, centerY);

  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, deltaY);
    await page.waitForTimeout(80);
  }
}
