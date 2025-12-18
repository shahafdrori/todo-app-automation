// tests/specs/todo-dialog.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { AddTaskDialog } from "../pages/AddTaskDialog";
import { MapPage } from "../pages/MapPage";
import { NavBar } from "../components/navBar";
import { buildUniqueTask } from "../data/taskData";

test("user can fill the task form and cancel", async ({ page }) => {
  await page.goto("/");
  const navBar = new NavBar(page);
  await navBar.navigateToTab("home");

  await page.locator('[data-test="add-task-button"]').click();

  const dialog = new AddTaskDialog(page);
  await dialog.expectOpen();

  await dialog.fillBasicFields({
    name: "My task",
    priority: 3,
    subject: "OCP",
    date: "12/06/2025",
  });

  await dialog.cancel();
  await dialog.expectClosed();
});

test("user can fill the task form and click on the map with dialog open", async ({
  page,
}) => {
  await page.goto("/");
  const navBar = new NavBar(page);
  await navBar.navigateToTab("home");

  await page.locator('[data-test="add-task-button"]').click();

  const dialog = new AddTaskDialog(page);
  await dialog.expectOpen();

  await dialog.fillBasicFields({
    name: "Task with map",
    priority: 4,
    subject: "OCP",
    date: "12/06/2025",
  });

  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();

  // Just verify that clicking on the map works with the form open
  await mapPage.clickRandomAndReadCoordinates();

  await dialog.cancel();
  await dialog.expectClosed();
});

test("user can submit a task", async ({ page }) => {
  await page.goto("/");
  const navBar = new NavBar(page);
  await navBar.navigateToTab("home");

  await page.locator('[data-test="add-task-button"]').click();

  const dialog = new AddTaskDialog(page);
  await dialog.expectOpen();

  // Use unique task data so name collisions do not happen across projects
  const taskData = buildUniqueTask("Dialog task");
  await dialog.fillBasicFields(taskData);

  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();

  await mapPage.clickRandomAndReadCoordinates();

  await dialog.submit();
  await dialog.expectClosed();
});

test("user can fill the task form and set coordinates from the map", async ({
  page,
}) => {
  await page.goto("/");
  const navBar = new NavBar(page);
  await navBar.navigateToTab("home");

  await page.locator('[data-test="add-task-button"]').click();

  const dialog = new AddTaskDialog(page);
  await dialog.expectOpen();

  await dialog.fillBasicFields({
    name: "Task with map",
    priority: 4,
    subject: "OCP",
    date: "12/06/2025",
  });

  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();

  const { longitude, latitude } = await mapPage.clickRandomAndReadCoordinates();

  // Read coordinates back from the form and compare
  const { lng: lngFromForm, lat: latFromForm } = await dialog.readCoordinates();

  expect(lngFromForm).not.toBe("");
  expect(latFromForm).not.toBe("");

  expect(Number(lngFromForm)).toBeCloseTo(longitude, 5);
  expect(Number(latFromForm)).toBeCloseTo(latitude, 5);

  await dialog.cancel();
  await dialog.expectClosed();
});
