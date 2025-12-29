// tests/specs/home-filters.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { NavBar } from "../components/navBar";
import { HomePage } from "../pages/HomePage";
import { buildUniqueTask } from "../data/taskData";
import { createTaskFromHome } from "../helpers/flows/taskFlows";

const isMock = () => String(process.env.MOCK_API).toLowerCase() === "true";

test("home search filters tasks by name (works in mock + real)", async ({
  page,
  mockTasks,
}) => {
  const alphaTask = buildUniqueTask("Alpha task");
  const betaTask = buildUniqueTask("Beta task");

  const alpha = alphaTask.name;
  const beta = betaTask.name;

  if (isMock()) {
    mockTasks.reset([
      {
        _id: "t1",
        name: alpha,
        subject: "OCP",
        priority: 3,
        date: "01/07/2026",
        completed: false,
        coordinates: { longitude: 34.78, latitude: 32.08 },
      },
      {
        _id: "t2",
        name: beta,
        subject: "OCP",
        priority: 2,
        date: "01/07/2026",
        completed: false,
        coordinates: { longitude: 34.79, latitude: 32.09 },
      },
    ]);
  }

  await page.goto("/");

  const navBar = new NavBar(page);
  const home = new HomePage(page);
  await home.goto(navBar);

  if (!isMock()) {
    await createTaskFromHome(page, navBar, alphaTask);
    await createTaskFromHome(page, navBar, betaTask);
    await home.goto(navBar);
  }

  const list = page.getByRole("list");

  await expect(list.getByText(alpha)).toBeVisible();
  await expect(list.getByText(beta)).toBeVisible();

  await home.search("alp");

  await expect
    .poll(async () => await list.getByText(beta).isVisible().catch(() => false), {
      timeout: 5000,
    })
    .toBe(false);

  await expect(list.getByText(alpha)).toBeVisible();

  await home.clearSearch();

  await expect
    .poll(async () => await list.getByText(beta).isVisible().catch(() => false), {
      timeout: 5000,
    })
    .toBe(true);

  await expect(list.getByText(alpha)).toBeVisible();
});

test("show completed filters list (known bug)", async ({ page, mockTasks }) => {
  // In real DB mode this test is meaningless right now:
  // - showCompletedAtom doesn't filter TasksList
  // - checkbox completion isn't persisted to backend
  test.skip(!isMock(), "Skip in real mode (completion is not persisted, filter not implemented).");

  test.fail(true, "Known bug: showCompletedAtom is not used to filter TasksList yet.");

  mockTasks.reset([
    {
      _id: "c1",
      name: "Done task",
      subject: "OCP",
      priority: 1,
      date: "01/07/2026",
      completed: true,
      coordinates: { longitude: 34.78, latitude: 32.08 },
    },
    {
      _id: "c2",
      name: "Todo task",
      subject: "OCP",
      priority: 1,
      date: "01/07/2026",
      completed: false,
      coordinates: { longitude: 34.78, latitude: 32.08 },
    },
  ]);

  await page.goto("/");

  const navBar = new NavBar(page);
  const home = new HomePage(page);
  await home.goto(navBar);

  const list = page.getByRole("list");
  await expect(list.getByText("Done task")).toBeVisible();
  await expect(list.getByText("Todo task")).toBeVisible();

  await home.toggleShowCompleted();

  // expected future behavior:
  await expect(list.getByText("Done task")).toBeVisible();
  await expect(list.getByText("Todo task")).toBeHidden();
});
