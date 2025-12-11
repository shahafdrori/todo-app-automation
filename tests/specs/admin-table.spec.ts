import type { Page } from "@playwright/test";
import { test, expect } from "../fixtures/test-fixtures";
import { NavBar } from "../components/navBar";
import { AddTaskDialog } from "../pages/AddTaskDialog";
import { MapPage } from "../pages/MapPage";
import { AdminTablePage } from "../pages/AdminTablePage";

type BasicTaskData = {
  name: string;
  priority: number;
  subject: string;
  date: string;
};

/**
 * Utility: create a unique task payload so tests don't clash.
 */
function buildUniqueTask(prefix: string): BasicTaskData {
  const now = Date.now();
  return {
    name: `${prefix} ${now}`,
    priority: 4,
    subject: "OCP",
    date: "12/06/2025", // same format you already use in other tests
  };
}

/**
 * Wait for the real "create task" API call.
 * Backend sends POST <VITE_API_KEY>/tasks/add
 */
async function waitForCreateTaskRequest(page: Page) {
  await page.waitForResponse(
    (resp) =>
      resp.url().includes("/tasks/add") &&
      resp.request().method() === "POST"
  );
}

test("task created from home appears in admin table with all fields correct", async ({
  page,
}) => {
  await page.goto("/");
  const navBar = new NavBar(page);

  // 1. Go to home and open dialog
  await navBar.navigateToTab("home");

  const taskData = buildUniqueTask("Home task");
  await page.locator('[data-test="add-task-button"]').click();

  const dialog = new AddTaskDialog(page);
  await dialog.expectOpen();
  await dialog.fillBasicFields(taskData);

  // 2. Choose location on map and store the coordinates
  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();
  const { longitude, latitude } = await mapPage.clickRandomAndReadCoordinates();

  // 3. Submit task and wait for create API call to finish
  await Promise.all([waitForCreateTaskRequest(page), dialog.submit()]);

  await dialog.expectClosed();

  // 4. Go to admin tab and check table
  const adminPage = new AdminTablePage(page);
  await adminPage.goto(navBar);

  await adminPage.expectFullTaskRow({
    ...taskData,
    longitude,
    latitude,
  });
});

test("task created from admin appears in admin table with all fields correct", async ({
  page,
}) => {
  await page.goto("/");
  const navBar = new NavBar(page);
  const adminPage = new AdminTablePage(page);

  // 1. Go to admin page
  await navBar.navigateToTab("admin");
  await adminPage.expectLoaded();

  // 2. Open dialog from admin page
  const taskData = buildUniqueTask("Admin task");
  await page.locator('[data-test="add-task-button"]').click();

  const dialog = new AddTaskDialog(page);
  await dialog.expectOpen();
  await dialog.fillBasicFields(taskData);

  // 3. Choose coordinates from map and keep them for comparison
  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();
  const { longitude, latitude } = await mapPage.clickRandomAndReadCoordinates();

  // 4. Submit and wait for create API call
  await Promise.all([waitForCreateTaskRequest(page), dialog.submit()]);

  await dialog.expectClosed();

  // 5. Check all fields for the created task in the same admin table
  await adminPage.expectFullTaskRow({
    ...taskData,
    longitude,
    latitude,
  });
});
