//tests/specs/task-card-location.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { NavBar } from "../components/navBar";
import { HomePage } from "../pages/HomePage";
import { HomeTaskList } from "../pages/HomeTaskList";
import { TaskLocationDialog } from "../pages/TaskLocationDialog";
import { buildUniqueTask } from "../data/taskData";
import { createTaskFromHome } from "../helpers/flows/taskFlows";

const isMock = () => String(process.env.MOCK_API).toLowerCase() === "true";

test("task card location opens map dialog and marker matches task coords (filtered + close) (mock + real)", async (
  { page, mockTasks },
  testInfo
) => {
  testInfo.setTimeout(120_000);

  await page.goto("/");

  const navBar = new NavBar(page);
  const home = new HomePage(page);
  const list = new HomeTaskList(page);

  const task = buildUniqueTask("LocMe");
  let coords = { longitude: 34.78, latitude: 32.08 };

  if (isMock()) {
    mockTasks.reset([
      {
        _id: "l1",
        name: task.name,
        subject: task.subject,
        priority: task.priority,
        date: task.date,
        completed: false,
        coordinates: { longitude: coords.longitude, latitude: coords.latitude },
      },
    ]);
  } else {
    coords = await createTaskFromHome(page, navBar, task);
  }

  await home.goto(navBar);
  await list.waitForTaskVisible(task.name);

  // Variation: open from filtered view
  await home.search(task.name.slice(0, 6));
  await list.waitForTaskVisible(task.name);

  await list.clickLocation(task.name);

  const dialog = new TaskLocationDialog(page);
  await dialog.expectOpen();
  await dialog.expectMarkerCloseTo(coords.longitude, coords.latitude, 4, 20_000);
  await dialog.closeWithEscape();

  await home.clearSearch();
  await list.waitForTaskVisible(task.name);
});
