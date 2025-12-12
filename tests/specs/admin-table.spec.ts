// tests/specs/admin-table.spec.ts
import type { Page } from "@playwright/test";
import { test } from "../fixtures/test-fixtures";
import { NavBar } from "../components/navBar";
import { AddTaskDialog } from "../pages/AddTaskDialog";
import { MapPage } from "../pages/MapPage";
import { AdminTablePage } from "../pages/AdminTablePage";
import { buildUniqueTask } from "../utils/taskData";

/**
 * Helper: start from a clean state so the new task
 * will definitely appear in the first page of results.
 */
async function clearAllTasksViaHome(page: Page) {
  const navBar = new NavBar(page);
  await navBar.navigateToTab("home");

  const clearAllButton = page.locator('[data-test="clear-all-button"]');

  if (!(await clearAllButton.isVisible())) {
    return;
  }

  // Handle possible window.confirm from the app
  page.once("dialog", (dialog) => dialog.accept());

  await clearAllButton.click();

  // Give the backend + UI a moment to update
  await page.waitForTimeout(500);
}

test("task created from home appears in admin table with all fields correct", async ({
  page,
}) => {
  await page.goto("/");
  await clearAllTasksViaHome(page);

  const navBar = new NavBar(page);
  const adminPage = new AdminTablePage(page);

  // 1. Stay on home and open dialog
  await navBar.navigateToTab("home");

  await page.locator('[data-test="add-task-button"]').click();

  const dialog = new AddTaskDialog(page);
  await dialog.expectOpen();

  const taskData = buildUniqueTask("Home task");
  await dialog.fillBasicFields(taskData);

  // 2. Choose location on map and store the coordinates
  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();
  const { longitude, latitude } = await mapPage.clickRandomAndReadCoordinates();

  // 3. Submit task
  await dialog.submit();
  await dialog.expectClosed();

  // 4. Go to admin tab and check table
  await adminPage.goto(navBar);

  await adminPage.expectFullTaskRow({
    ...taskData,
    longitude,
    latitude,
  });
});

// tests/specs/admin-table.spec.ts

test("task created from admin appears in admin table with all fields correct", async ({
  page,
}) => {
  await page.goto("/");
  await clearAllTasksViaHome(page);

  const navBar = new NavBar(page);
  const adminPage = new AdminTablePage(page);

  // 1. Go to admin page
  await navBar.navigateToTab("admin");
  await adminPage.expectLoaded();

  // 2. Open dialog from admin page
  await page.locator('[data-test="add-task-button"]').click();

  const dialog = new AddTaskDialog(page);
  await dialog.expectOpen();

  const taskData = buildUniqueTask("Admin task");
  await dialog.fillBasicFields(taskData);

  // 3. Choose coordinates from map and keep them for comparison
  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();
  const { longitude, latitude } = await mapPage.clickRandomAndReadCoordinates();

  // 4. Submit and wait for dialog to close
  await dialog.submit();
  await dialog.expectClosed();

  // 5. The AdminTable is already refreshed via onSuccess(loadData).
  //    Just assert the row, with full validation.
  await adminPage.expectFullTaskRow({
    ...taskData,
    longitude,
    latitude,
  });
});

