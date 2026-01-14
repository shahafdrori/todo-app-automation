
//tests/specs/task-card-delete.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { NavBar } from "../components/navBar";
import { HomePage } from "../pages/HomePage";
import { AdminTablePage } from "../pages/AdminTablePage";
import { HomeTaskList } from "../pages/HomeTaskList";
import { AddTaskDialog } from "../pages/AddTaskDialog";
import { MapPage } from "../pages/MapPage";
import { buildUniqueTask } from "../data/taskData";
import { API_ROUTES, urlIncludesAny } from "../data/apiRoutes";
import { createTaskFromHome } from "../helpers/flows/taskFlows";

const isMock = () => String(process.env.MOCK_API).toLowerCase() === "true";

test("task card delete removes task from home + admin (filtered + reload) (mock + real)", async (
  { page, mockTasks },
  testInfo
) => {
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
    const taskData = buildUniqueTask("DeleteMe");
    taskName = taskData.name;
    await createTaskFromHome(page, navBar, taskData);
  }

  await home.goto(navBar);
  await list.waitForTaskVisible(taskName);

  // filter, then delete from filtered view
  await home.search(taskName.slice(0, 6));
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

  // Home asserts (still filtered)
  await list.waitForTaskGone(taskName);

  // clear filter and ensure still gone
  await home.clearSearch();
  await list.waitForTaskGone(taskName);

  // Admin asserts
  await admin.goto(navBar);
  await admin.waitForTaskNotInTable(taskName, 20_000);

  // Reload variation
  await home.goto(navBar);
  await page.reload();
  await home.expectLoaded();
  await list.waitForTaskGone(taskName);

  await admin.goto(navBar);
  await admin.waitForTaskNotInTable(taskName, 20_000);
});
