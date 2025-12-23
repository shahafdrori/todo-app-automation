// tests/specs/admin-table.spec.ts
import type { Page } from "@playwright/test";
import { test, expect } from "../fixtures/test-fixtures";
import { NavBar } from "../components/navBar";
import { AddTaskDialog } from "../pages/AddTaskDialog";
import { MapPage } from "../pages/MapPage";
import { AdminTablePage } from "../pages/AdminTablePage";
import { buildUniqueTask } from "../data/taskData";

async function clearAllTasksViaHome(page: Page) {
  const navBar = new NavBar(page);
  await navBar.navigateToTab("home");

  const clearAllButton = page.locator('[data-test="clear-all-button"]');

  if (!(await clearAllButton.isVisible())) {
    return;
  }

  page.once("dialog", (dialog) => dialog.accept());

  await clearAllButton.click();
  await page.waitForTimeout(500);
}

test(
  "task created from home appears in admin table with all fields correct",
  async ({ page }, testInfo) => {
    testInfo.setTimeout(90_000);

    await page.goto("/");
    await clearAllTasksViaHome(page);

    const navBar = new NavBar(page);
    const adminPage = new AdminTablePage(page);

    await navBar.navigateToTab("home");
    await page.locator('[data-test="add-task-button"]').click();

    const dialog = new AddTaskDialog(page);
    await dialog.expectOpen();

    const taskData = buildUniqueTask("Home task");
    await dialog.fillBasicFields(taskData);

    const mapPage = new MapPage(page);
    await mapPage.expectMapVisible();
    const { longitude, latitude } = await mapPage.clickRandomAndReadCoordinates();

    const { status } = await dialog.submitAndWaitForCreate();
    expect(status).toBe(200);

    await dialog.ensureClosed();

    await adminPage.goto(navBar);

    await adminPage.expectFullTaskRow({
      ...taskData,
      longitude,
      latitude,
    });
  }
);

test(
  "task created from admin appears in admin table with all fields correct",
  async ({ page }, testInfo) => {
    testInfo.setTimeout(90_000);

    await page.goto("/");
    await clearAllTasksViaHome(page);

    const navBar = new NavBar(page);
    const adminPage = new AdminTablePage(page);

    await navBar.navigateToTab("admin");
    await adminPage.expectLoaded();

    await page.locator('[data-test="add-task-button"]').click();

    const dialog = new AddTaskDialog(page);
    await dialog.expectOpen();

    const taskData = buildUniqueTask("Admin task");
    await dialog.fillBasicFields(taskData);

    const mapPage = new MapPage(page);
    await mapPage.expectMapVisible();
    const { longitude, latitude } = await mapPage.clickRandomAndReadCoordinates();

    const { status } = await dialog.submitAndWaitForCreate();
    expect(status).toBe(200);

    await dialog.ensureClosed();

    await adminPage.expectFullTaskRow({
      ...taskData,
      longitude,
      latitude,
    });
  }
);