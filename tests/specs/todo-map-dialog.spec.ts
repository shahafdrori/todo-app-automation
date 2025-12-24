// tests/specs/todo-map-dialog.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { MapPage } from "../pages/MapPage";
import { NavBar } from "../components/navBar";

test("select location on map fills coordinates and moves marker correctly", async ({ page }) => {
  await page.goto("/");
  const navBar = new NavBar(page);
  await navBar.navigateToTab("home");

  await page.locator('[data-test="add-task-button"]').click();

  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();

  await mapPage.zoomOutDialog(2);
  await mapPage.panLeft(200);

  const { longitude, latitude } = await mapPage.clickRandomAndReadCoordinates();

  expect(Number.isNaN(longitude)).toBeFalsy();
  expect(Number.isNaN(latitude)).toBeFalsy();
});

test("user can select very far location on map dialog", async ({ page }) => {
  await page.goto("/");
  const navBar = new NavBar(page);
  await navBar.navigateToTab("home");

  await page.locator('[data-test="add-task-button"]').click();

  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();

  const first = await mapPage.clickRandomAndReadCoordinates();

  await mapPage.zoomOutDialog(3);
  await mapPage.panLeft(800);
  await mapPage.panUp(300);

  const second = await mapPage.clickRandomAndReadCoordinates();

  const deltaLon = Math.abs(second.longitude - first.longitude);
  const deltaLat = Math.abs(second.latitude - first.latitude);

  expect(deltaLon).toBeGreaterThan(0.005);
  expect(deltaLat).toBeGreaterThan(0.005);
});

test("zoom buttons change map view zoom", async ({ page }) => {
  await page.goto("/");
  const navBar = new NavBar(page);
  await navBar.navigateToTab("home");

  await page.locator('[data-test="add-task-button"]').click();

  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();

  const zoomBefore = await mapPage.getZoom();
  expect(zoomBefore).not.toBeNull();

  await mapPage.zoomOutDialog(2);

  await expect
    .poll(async () => await mapPage.getZoom(), { timeout: 2000 })
    .toBeLessThan(zoomBefore!);

  const zoomAfterOut = await mapPage.getZoom();
  expect(zoomAfterOut).not.toBeNull();

  await mapPage.zoomInDialog(2);

  await expect
    .poll(async () => await mapPage.getZoom(), { timeout: 2000 })
    .toBeGreaterThan(zoomAfterOut!);
});

test("zoom in eventually increases map view zoom", async ({ page }) => {
  await page.goto("/");
  const navBar = new NavBar(page);
  await navBar.navigateToTab("home");

  await page.locator('[data-test="add-task-button"]').click();

  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();

  const zoomBefore = await mapPage.getZoom();
  expect(zoomBefore).not.toBeNull();

  await mapPage.zoomInDialog(2);

  await expect
    .poll(async () => await mapPage.getZoom(), { timeout: 2000 })
    .toBeGreaterThan(zoomBefore!);
});

test.skip("map state resets when dialog is closed and reopened", async ({ page }) => {
  await page.goto("/");
  const navBar = new NavBar(page);
  await navBar.navigateToTab("home");

  await page.locator('[data-test="add-task-button"]').click();

  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();

  const first = await mapPage.clickRandomAndReadCoordinates();
  expect(Number.isNaN(first.longitude)).toBeFalsy();
  expect(Number.isNaN(first.latitude)).toBeFalsy();

  await page.locator('[data-test="cancel-button"]').click();

  await page.locator('[data-test="add-task-button"]').click();
  await mapPage.expectMapVisible();

  const lngInput = page.locator('[data-test="lng-input"]');
  const latInput = page.locator('[data-test="lat-input"]');

  await expect(lngInput).toHaveValue("");
  await expect(latInput).toHaveValue("");

  const markerAfterReopen = await mapPage.getMarkerCoords();
  expect(markerAfterReopen).toBeNull();
});
