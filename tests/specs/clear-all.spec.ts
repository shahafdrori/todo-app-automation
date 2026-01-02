// tests/specs/clear-all.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { NavBar } from "../components/navBar";
import { HomePage } from "../pages/HomePage";
import { AdminTablePage } from "../pages/AdminTablePage";
import { buildUniqueTask } from "../data/taskData";
import { createTaskFromHome } from "../helpers/flows/taskFlows";
import { attachApiLogs } from "../helpers/debug/apiLogs";

const isMock = () => String(process.env.MOCK_API).toLowerCase() === "true";

test("clear all removes tasks (strict in mock + real)", async (
  { page, mockTasks },
  testInfo
) => {
  testInfo.setTimeout(120_000);
  attachApiLogs(page);

  const navBar = new NavBar(page);
  const home = new HomePage(page);
  const admin = new AdminTablePage(page);

  if (isMock()) {
    mockTasks.reset([
      {
        _id: "a1",
        name: "ClearAll task A",
        subject: "OCP",
        priority: 3,
        date: "01/07/2026",
        completed: false,
        coordinates: { longitude: 34.78, latitude: 32.08 },
      },
      {
        _id: "a2",
        name: "ClearAll task B",
        subject: "OCP",
        priority: 2,
        date: "01/07/2026",
        completed: false,
        coordinates: { longitude: 34.79, latitude: 32.09 },
      },
    ]);
  }

  await page.goto("/");
  await home.goto(navBar);

  if (!isMock()) {
    await createTaskFromHome(page, navBar, buildUniqueTask("ClearAll A"));
    await createTaskFromHome(page, navBar, buildUniqueTask("ClearAll B"));
    await home.goto(navBar);
  }

  await admin.goto(navBar);
  expect(await admin.getTaskRowCount()).toBeGreaterThan(0);

  await home.clearAllTasksFromHome(navBar, 45_000);

  const list = page.getByRole("list");

  await expect
    .poll(async () => {
      await home.goto(navBar);
      return await list.getByRole("listitem").count();
    }, { timeout: 15_000 })
    .toBe(0);

  await expect
    .poll(async () => {
      await admin.goto(navBar);
      return await admin.getTaskRowCount();
    }, { timeout: 15_000 })
    .toBe(0);

  await home.goto(navBar);       
  await page.reload();          
  await home.expectLoaded();     

  const listAfterReload = page.getByRole("list");
  await expect
    .poll(async () => await listAfterReload.getByRole("listitem").count(), { timeout: 15_000 })
    .toBe(0);

});
