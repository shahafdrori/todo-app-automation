// tests/specs/home-task-list.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { NavBar } from "../components/navBar";
import { HomePage } from "../pages/HomePage";
import { HomeTaskList } from "../pages/HomeTaskList";
import { buildUniqueTask } from "../data/taskData";
import { createTaskFromHome, createTaskFromAdmin } from "../helpers/flows/taskFlows";

test("task created from home appears in the home list (name, details, actions, toggle)", async ({ page }, testInfo) => {
  testInfo.setTimeout(120_000);

  await page.goto("/");

  const navBar = new NavBar(page);
  const home = new HomePage(page);
  const list = new HomeTaskList(page);

  const taskData = buildUniqueTask("HomeList task");
  const { longitude, latitude } = await createTaskFromHome(page, navBar, taskData, 60_000);

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

  await list.expectTaskCompleted(taskData.name, false);
  await list.toggleTaskCompleted(taskData.name);
  await list.expectTaskCompleted(taskData.name, true);
  await list.toggleTaskCompleted(taskData.name);
  await list.expectTaskCompleted(taskData.name, false);
});

test("task created from admin appears in the home list", async ({ page }, testInfo) => {
  testInfo.setTimeout(120_000);

  await page.goto("/");

  const navBar = new NavBar(page);
  const home = new HomePage(page);
  const list = new HomeTaskList(page);

  const taskData = buildUniqueTask("AdminToHome task");
  const { longitude, latitude } = await createTaskFromAdmin(page, navBar, taskData, 60_000);

  await home.goto(navBar);

  await list.waitForTaskVisible(taskData.name);

  const coords = await list.readCoords(taskData.name);
  expect(coords).not.toBeNull();
  expect(coords!.longitude).toBeCloseTo(longitude, 4);
  expect(coords!.latitude).toBeCloseTo(latitude, 4);

  await list.expectTaskActionsVisible(taskData.name);
});
