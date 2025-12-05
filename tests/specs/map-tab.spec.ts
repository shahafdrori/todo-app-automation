// tests/specs/map-tab.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { NavBar } from "../components/navBar";
import { MapPage } from "../pages/MapPage";

test("user can pan and zoom on the map tab", async ({ page }) => {
  const navBar = new NavBar(page);
  const navMap = page.locator('[data-test="nav-map"]');
  console.log("nav-map count:", await navMap.count());

  await navBar.navigateToTab("map");

  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();

  await mapPage.zoomOutWithWheel(4);
  await mapPage.panRight(400);
  await mapPage.panDown(250);
});

test("map tab wheel zoom changes map view zoom", async ({ page }) => {
  const navBar = new NavBar(page);
  const navMap = page.locator('[data-test="nav-map"]');
  console.log("nav-map count:", await navMap.count());
  
  await navBar.navigateToTab("map");

  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();

  const zoomBefore = await mapPage.getZoom();
  expect(zoomBefore).not.toBeNull();

  await mapPage.zoomOutWithWheel(5);
  await page.waitForTimeout(300);

  const zoomAfterOut = await mapPage.getZoom();
  expect(zoomAfterOut).not.toBeNull();
  expect(zoomAfterOut).not.toBe(zoomBefore);

  await mapPage.zoomInWithWheel(5);
  await page.waitForTimeout(300);

  const zoomAfterIn = await mapPage.getZoom();
  expect(zoomAfterIn).not.toBeNull();
  expect(zoomAfterIn).not.toBe(zoomAfterOut);
});
