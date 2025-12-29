// tests/specs/admin-table.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { NavBar } from "../components/navBar";
import { AddTaskDialog } from "../pages/AddTaskDialog";
import { MapPage } from "../pages/MapPage";
import { AdminTablePage } from "../pages/AdminTablePage";
import { HomePage } from "../pages/HomePage";
import { buildUniqueTask } from "../data/taskData";

test(
  "task created from home appears in admin table with all fields correct",
  async ({ page }, testInfo) => {
    testInfo.setTimeout(90_000);

    await page.goto("/");

    const navBar = new NavBar(page);
    const adminPage = new AdminTablePage(page);
    const home = new HomePage(page);

    await home.openAddTaskDialogFromHome(navBar);

    const dialog = new AddTaskDialog(page);
    await dialog.expectOpen();

    const taskData = buildUniqueTask("Home task");
    await dialog.fillBasicFields(taskData);

    const mapPage = new MapPage(page);
    await mapPage.expectMapVisible();
    const { longitude, latitude } = await mapPage.clickRandomAndReadCoordinates();

    const { status } = await dialog.submitAndWaitForCreate();
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(300);

    await dialog.ensureClosed();

    await adminPage.goto(navBar);

    await adminPage.expectFullTaskRow({
      ...taskData,
      longitude,
      latitude,
      strictDate: true,
    });
  }
);

test(
  "task created from admin appears in admin table with all fields correct",
  async ({ page }, testInfo) => {
    testInfo.setTimeout(90_000);

    await page.goto("/");

    const navBar = new NavBar(page);
    const adminPage = new AdminTablePage(page);

    await adminPage.openAddTaskDialogFromAdmin(navBar);

    const dialog = new AddTaskDialog(page);
    await dialog.expectOpen();

    const taskData = buildUniqueTask("Admin task");
    await dialog.fillBasicFields(taskData);

    const mapPage = new MapPage(page);
    await mapPage.expectMapVisible();
    const { longitude, latitude } = await mapPage.clickRandomAndReadCoordinates();

    const { status } = await dialog.submitAndWaitForCreate();
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(300);

    await dialog.ensureClosed();

    await adminPage.expectFullTaskRow({
      ...taskData,
      longitude,
      latitude,
      strictDate: true,
    });
  }
);
