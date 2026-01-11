//tests/specs/home-task-list.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { NavBar } from "../components/navBar";
import { HomePage } from "../pages/HomePage";
import { AdminTablePage } from "../pages/AdminTablePage";
import { AddTaskDialog } from "../pages/AddTaskDialog";
import { MapPage } from "../pages/MapPage";
import { HomeTaskList } from "../pages/HomeTaskList";
import { buildUniqueTask } from "../data/taskData";
import { API_ROUTES, urlIncludesAny } from "../data/apiRoutes";
import { TEST_IDS } from "../data/testIds";

const isMock = () => String(process.env.MOCK_API).toLowerCase() === "true";

test("task created from home appears in the home list (name, details, actions, toggle, edit, map)", async ({ page }, testInfo) => {
  testInfo.setTimeout(120_000);

  await page.goto("/");

  const navBar = new NavBar(page);
  const home = new HomePage(page);
  const list = new HomeTaskList(page);

  await home.openAddTaskDialogFromHome(navBar);

  const dialog = new AddTaskDialog(page);
  await dialog.expectOpen();

  const taskData = buildUniqueTask("HomeList task");
  await dialog.fillBasicFields(taskData);

  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();
  const { longitude, latitude } = await mapPage.clickRandomAndReadCoordinates();

  const { status } = await dialog.submitAndWaitForCreate(60_000);
  expect(status).toBeGreaterThanOrEqual(200);
  expect(status).toBeLessThan(300);

  await dialog.ensureClosed();

  await home.goto(navBar);

  await list.waitForTaskVisible(taskData.name);
  await list.expectTaskActionsVisible(taskData.name);

  const subject = await list.readSubject(taskData.name);
  const priority = await list.readPriority(taskData.name);
  expect(subject).toBe(taskData.subject);
  expect(priority).toBe(taskData.priority);

  const coords = await list.readCoords(taskData.name);
  expect(coords).not.toBeNull();
  expect(coords!.longitude).toBeCloseTo(longitude, 4);
  expect(coords!.latitude).toBeCloseTo(latitude, 4);

  await list.expectTaskNameColor(taskData.name, "red");
  await list.toggleComplete(taskData.name);
  await list.expectTaskNameColor(taskData.name, "green");
  await list.toggleComplete(taskData.name);
  await list.expectTaskNameColor(taskData.name, "red");

  await list.clickLocation(taskData.name);

  const map = page.getByTestId(TEST_IDS.map.taskMap);
  const mapDialog = page.getByRole("dialog").filter({ has: map }).first();
  await expect(mapDialog).toBeVisible();
  await expect(map).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(mapDialog).toBeHidden({ timeout: 10_000 });

  await list.clickEdit(taskData.name);

  const editDialog = new AddTaskDialog(page);
  await editDialog.expectOpen();

  const nameInput = await editDialog.form.getFieldByPath("name");
  await expect(nameInput).toHaveValue(taskData.name);

  const priorityInput = await editDialog.form.getFieldByPath("priority");
  await expect(priorityInput).toHaveValue(String(taskData.priority));

  const { lng, lat } = await editDialog.readCoordinates();
  expect(Number(lng)).toBeCloseTo(longitude, 4);
  expect(Number(lat)).toBeCloseTo(latitude, 4);

  await editDialog.cancel();
  await editDialog.expectClosed();
});

test("task created from admin appears in the home list", async ({ page }, testInfo) => {
  testInfo.setTimeout(120_000);

  await page.goto("/");

  const navBar = new NavBar(page);
  const admin = new AdminTablePage(page);
  const home = new HomePage(page);
  const list = new HomeTaskList(page);

  await admin.openAddTaskDialogFromAdmin(navBar);

  const dialog = new AddTaskDialog(page);
  await dialog.expectOpen();

  const taskData = buildUniqueTask("AdminToHome task");
  await dialog.fillBasicFields(taskData);

  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();
  const { longitude, latitude } = await mapPage.clickRandomAndReadCoordinates();

  const { status } = await dialog.submitAndWaitForCreate(60_000);
  expect(status).toBeGreaterThanOrEqual(200);
  expect(status).toBeLessThan(300);
  await dialog.ensureClosed();

  await home.goto(navBar);

  await list.waitForTaskVisible(taskData.name);

  const coords = await list.readCoords(taskData.name);
  expect(coords).not.toBeNull();
  expect(coords!.longitude).toBeCloseTo(longitude, 4);
  expect(coords!.latitude).toBeCloseTo(latitude, 4);

  await list.expectTaskActionsVisible(taskData.name);
});

test("delete from home list removes the task from home and admin (mock + real)", async ({ page, mockTasks }, testInfo) => {
  testInfo.setTimeout(120_000);

  await page.goto("/");

  const navBar = new NavBar(page);
  const home = new HomePage(page);
  const admin = new AdminTablePage(page);
  const list = new HomeTaskList(page);

  let taskName = "DeleteMe task";

  if (isMock()) {
    mockTasks.reset([
      {
        _id: "d1",
        name: taskName,
        subject: "OCP",
        priority: 3,
        date: "01/07/2026",
        completed: false,
        coordinates: { longitude: 34.78, latitude: 32.08 },
      },
    ]);
  } else {
    await home.openAddTaskDialogFromHome(navBar);

    const dialog = new AddTaskDialog(page);
    await dialog.expectOpen();

    const taskData = buildUniqueTask("DeleteMe");
    taskName = taskData.name;

    await dialog.fillBasicFields(taskData);

    const mapPage = new MapPage(page);
    await mapPage.expectMapVisible();
    await mapPage.clickRandomAndReadCoordinates();

    const { status } = await dialog.submitAndWaitForCreate(60_000);
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(300);

    await dialog.ensureClosed();
  }

  await home.goto(navBar);
  await list.waitForTaskVisible(taskName);

  const isDeleteOne = (r: any) => {
    const url = r.url();
    const m = r.request().method().toUpperCase();
    return m === "DELETE" && urlIncludesAny(url, API_ROUTES.tasks.deletePrefix);
  };

  const [delRes] = await Promise.all([
    page.waitForResponse(isDeleteOne, { timeout: 60_000 }),
    list.clickDelete(taskName),
  ]);

  expect(delRes.status()).toBeGreaterThanOrEqual(200);
  expect(delRes.status()).toBeLessThan(300);

  await list.waitForTaskGone(taskName);

  await admin.goto(navBar);

  await expect
    .poll(async () => {
      const row = await admin.table.findRowByColumnValue("NAME", taskName);
      return row ? 1 : 0;
    }, { timeout: 15_000 })
    .toBe(0);
});
