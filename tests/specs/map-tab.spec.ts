// tests/specs/map-tab.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { NavBar } from "../components/navBar";
import { MapPage } from "../pages/MapPage";

test("user can pan and zoom on the map tab", async ({ page }) => {
  await page.goto("/");
  const navBar = new NavBar(page);

  await navBar.navigateToTab("map");

  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();

  await mapPage.zoomOutWithWheel(4);
  await mapPage.panRight(400);
  await mapPage.panDown(250);
});

test("map tab wheel zoom changes map view zoom", async ({ page }) => {
  await page.goto("/");
  const navBar = new NavBar(page);

  await navBar.navigateToTab("map");

  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();

  const zoomBefore = await mapPage.getZoom();
  expect(zoomBefore).not.toBeNull();

  await mapPage.zoomOutWithWheel(5);

  await expect
    .poll(async () => await mapPage.getZoom(), { timeout: 2000 })
    .toBeLessThan(zoomBefore!);

  const zoomAfterOut = await mapPage.getZoom();
  expect(zoomAfterOut).not.toBeNull();

  await mapPage.zoomInWithWheel(5);

  await expect
    .poll(async () => await mapPage.getZoom(), { timeout: 2000 })
    .toBeGreaterThan(zoomAfterOut!);
});
