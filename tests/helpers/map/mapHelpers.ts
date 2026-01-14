// tests/helpers/map/mapHelpers.ts
import { Page, expect, Locator } from "@playwright/test";
import { TEST_IDS } from "../../data/testIds";

export const MAP_TEST_ID = TEST_IDS.map.taskMap;
export const LNG_INPUT_TEST_ID = TEST_IDS.map.lngInput;
export const LAT_INPUT_TEST_ID = TEST_IDS.map.latInput;

export type LngLat = {
  longitude: number;
  latitude: number;
};

const MAP_SAFE_PADDING = {
  top: 40,
  right: 40,
  bottom: 40,
  left: 40,
};

async function waitForMapReady(page: Page): Promise<Locator> {
  const map = page.getByTestId(MAP_TEST_ID);

  await expect(map).toBeVisible();

  await page.waitForFunction(() => {
    const w = window as any;
    return (
      !!w.__OL_DEBUG__ && !!w.__OL_DEBUG__.map && !!w.__OL_DEBUG__.markerFeature
    );
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

function getSafeRandomPoint(box: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const width = box.width - MAP_SAFE_PADDING.left - MAP_SAFE_PADDING.right;
  const height = box.height - MAP_SAFE_PADDING.top - MAP_SAFE_PADDING.bottom;

  if (width <= 0 || height <= 0) {
    throw new Error("Map too small after applying safe padding");
  }

  const x = box.x + MAP_SAFE_PADDING.left + Math.random() * width;
  const y = box.y + MAP_SAFE_PADDING.top + Math.random() * height;

  return { x, y };
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

// Convert EPSG:3857 meters to lon/lat degrees (EPSG:4326)
function webMercatorToLonLat(x: number, y: number): [number, number] {
  const R = 6378137;
  const lon = (x / R) * (180 / Math.PI);
  const lat =
    (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI);
  return [lon, lat];
}

/**
 * Returns marker coordinates as lon/lat degrees.
 * Works whether __OL_DEBUG__.getMarkerCoords returns EPSG:3857 meters or lon/lat degrees.
 */
export async function getMarkerLonLat(
  page: Page
): Promise<[number, number] | null> {
  return await page.evaluate(() => {
    const debug = (window as any).__OL_DEBUG__;
    const coords = debug?.getMarkerCoords?.() ?? null;
    if (!coords) return null;

    const x = Number(coords[0]);
    const y = Number(coords[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

    // Heuristic:
    // If abs(x) > 180 or abs(y) > 90, it's almost certainly WebMercator meters.
    const looksLikeDegrees = Math.abs(x) <= 180 && Math.abs(y) <= 90;

    if (looksLikeDegrees) return [x, y];

    // WebMercator -> lon/lat
    const R = 6378137;
    const lon = (x / R) * (180 / Math.PI);
    const lat =
      (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI);

    return [lon, lat];
  });
}

export async function clickRandomOnMapAndValidateInputs(
  page: Page
): Promise<LngLat> {
  const box = await getMapBox(page);
  const markerBefore = await getMarkerCoords(page);

  const { x, y } = getSafeRandomPoint(box);

  await page.mouse.dblclick(x, y);

  const lngInput = page.getByTestId(LNG_INPUT_TEST_ID);
  const latInput = page.getByTestId(LAT_INPUT_TEST_ID);

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
    expect(distance, "Marker coords did not change after click").toBeGreaterThan(
      0
    );
  }

  return { longitude, latitude };
}

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

export async function zoomWithWheel(page: Page, deltaY: number, steps = 5) {
  const box = await getMapBox(page);
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  await page.mouse.move(centerX, centerY);

  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, deltaY);
    await page.waitForTimeout(80);
  }
}
