// tests/specs/todo-dialog.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { AddTaskDialog } from "../pages/AddTaskDialog";
import { MapPage } from "../pages/MapPage";
import { NavBar } from "../components/navBar";
import { HomePage } from "../pages/HomePage";
import { buildUniqueTask, futureDateMDY } from "../data/taskData";
import { attachApiLogs } from "../helpers/debug/apiLogs";

test("user can fill the task form and cancel", async ({ page }) => {
  await page.goto("/");
  const navBar = new NavBar(page);

  const home = new HomePage(page);
  await home.openAddTaskDialogFromHome(navBar);

  const dialog = new AddTaskDialog(page);
  await dialog.expectOpen();

  await dialog.fillBasicFields({
    name: "My task",
    priority: 3,
    subject: "OCP",
    date: futureDateMDY(2),
  });

  await dialog.cancel();
  await dialog.expectClosed();
});

test("user can fill the task form and click on the map with dialog open", async ({
  page,
}) => {
  await page.goto("/");
  const navBar = new NavBar(page);

  const home = new HomePage(page);
  await home.openAddTaskDialogFromHome(navBar);

  const dialog = new AddTaskDialog(page);
  await dialog.expectOpen();

  await dialog.fillBasicFields({
    name: "Task with map",
    priority: 4,
    subject: "OCP",
    date: futureDateMDY(2),
  });

  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();

  await mapPage.clickRandomAndReadCoordinates();

  await dialog.cancel();
  await dialog.expectClosed();
});

test("user can submit a task", async ({ page }, testInfo) => {
  testInfo.setTimeout(60_000);

  attachApiLogs(page);

  await page.goto("/");

  const navBar = new NavBar(page);
  const home = new HomePage(page);
  await home.openAddTaskDialogFromHome(navBar);

  const dialog = new AddTaskDialog(page);
  await dialog.expectOpen();

  const taskData = buildUniqueTask("Dialog task");
  await dialog.fillBasicFields(taskData);

  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();
  await mapPage.clickRandomAndReadCoordinates();

  const { status, all } = await dialog.submitAndWaitForCreate();
  expect(status).toBeGreaterThanOrEqual(200);
  expect(status).toBeLessThan(300);

  expect(Array.isArray(all)).toBeTruthy();
  expect((all as any[]).some((t) => t?.name === taskData.name)).toBeTruthy();

  await dialog.ensureClosed();
});

test("user can fill the task form and set coordinates from the map", async ({
  page,
}) => {
  await page.goto("/");
  const navBar = new NavBar(page);

  const home = new HomePage(page);
  await home.openAddTaskDialogFromHome(navBar);

  const dialog = new AddTaskDialog(page);
  await dialog.expectOpen();

  await dialog.fillBasicFields({
    name: "Task with map",
    priority: 4,
    subject: "OCP",
    date: futureDateMDY(2),
  });

  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();

  const { longitude, latitude } = await mapPage.clickRandomAndReadCoordinates();

  const { lng: lngFromForm, lat: latFromForm } = await dialog.readCoordinates();

  expect(lngFromForm).not.toBe("");
  expect(latFromForm).not.toBe("");

  expect(Number(lngFromForm)).toBeCloseTo(longitude, 5);
  expect(Number(latFromForm)).toBeCloseTo(latitude, 5);

  await dialog.cancel();
  await dialog.expectClosed();
});
