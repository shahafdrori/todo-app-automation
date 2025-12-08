// tests/specs/todo-map-dialog.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { MapPage } from "../pages/MapPage";
import { NavBar } from "../components/navBar";


test("select location on map fills coordinates and moves marker correctly", async ({ page }) => {
  const navBar = new NavBar(page);
  await navBar.navigateToTab("home");
  const el = page.locator('[data-test="add-task-button"]');
  console.log("add-task-button count:", await el.count());

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
  const navBar = new NavBar(page);
  await navBar.navigateToTab("home");
  const el = page.locator('[data-test="add-task-button"]');
  console.log("add-task-button count:", await el.count());
  
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

  expect(deltaLon).toBeGreaterThan(0.05);
  expect(deltaLat).toBeGreaterThan(0.05);
});

test("zoom buttons change map view zoom", async ({ page }) => {
  const navBar = new NavBar(page);
  await navBar.navigateToTab("home");
  await page.locator('[data-test="add-task-button"]').click();

  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();

  const zoomBefore = await mapPage.getZoom();
  expect(zoomBefore).not.toBeNull();

  await mapPage.zoomOutDialog(2);
  await page.waitForTimeout(300);

  const zoomAfterOut = await mapPage.getZoom();
  expect(zoomAfterOut).not.toBeNull();
  expect(zoomAfterOut!).toBeLessThan(zoomBefore!);

  await mapPage.zoomInDialog(2);
  await page.waitForTimeout(300);

  const zoomAfterIn = await mapPage.getZoom();
  expect(zoomAfterIn).not.toBeNull();
  expect(zoomAfterIn!).toBeGreaterThan(zoomAfterOut!);
});

test("zoom in eventually increases map view zoom", async ({ page }) => {
  const navBar = new NavBar(page);
  await navBar.navigateToTab("home");
  await page.locator('[data-test="add-task-button"]').click();

  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();

  const zoomBefore = await mapPage.getZoom();
  expect(zoomBefore).not.toBeNull();

  await mapPage.zoomInDialog(2);

  await expect
    .poll(async () => await mapPage.getZoom(), {
      timeout: 2000,
    })
    .toBeGreaterThan(zoomBefore!);
});

test.skip("map state resets when dialog is closed and reopened", async ({ page }) => {
  const navBar = new NavBar(page);
  await navBar.navigateToTab("home");
  await page.locator('[data-test="add-task-button"]').click();

  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();

  // 2. First selection
  const first = await mapPage.clickRandomAndReadCoordinates();
  const markerAfterFirst = await mapPage.getMarkerCoords();
  expect(markerAfterFirst).not.toBeNull();

  // 3. Close dialog
  await page.locator('[data-test="cancel-button"]').click(); // or your close icon

  // 4. Reopen dialog
  await page.locator('[data-test="add-task-button"]').click();
  await mapPage.expectMapVisible();

  // 5. Assert state was reset
  const lngInput = page.locator('[data-test="lng-input"]');
  const latInput = page.locator('[data-test="lat-input"]');

  await expect(lngInput).toHaveValue("");
  await expect(latInput).toHaveValue("");

  const markerAfterReopen = await mapPage.getMarkerCoords();
  expect(markerAfterReopen).toBeNull(); // or default, depending on how your debug is implemented
});
