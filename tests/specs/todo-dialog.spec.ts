// tests/specs/todo-dialog.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { AddTaskDialog } from "../pages/AddTaskDialog";
import { MapPage } from "../pages/MapPage";
import { NavBar } from "../components/navBar";
import { buildUniqueTask } from "../data/taskData";

import type { Page, Request } from "@playwright/test";

function formatDateMDY(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${mm}/${dd}/${yyyy}`;
}

function futureDateMDY(daysAhead = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return formatDateMDY(d);
}

function attachApiLogs(page: Page) {
  const flag = "__apiLogsAttached__";
  if ((page as any)[flag]) return;
  (page as any)[flag] = true;

  const isRelevant = (url: string) =>
    url.includes("/tasks") || url.includes("todolisthafifa");

  page.on("request", (req: Request) => {
    const url = req.url();
    if (!isRelevant(url)) return;

    const method = req.method();
    console.log(`[REQ] ${method} ${url}`);

    if (method === "POST") {
      try {
        const json = req.postDataJSON();
        console.log("[REQ BODY]", JSON.stringify(json, null, 2));
      } catch {
        const raw = req.postData();
        if (raw) console.log("[REQ BODY RAW]", raw);
      }
    }
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (!isRelevant(url)) return;

    console.log(`[RES] ${res.status()} ${res.request().method()} ${url}`);

    try {
      const ct = res.headers()["content-type"] || "";
      if (ct.includes("application/json")) {
        const body = await res.json();
        console.log("[RES JSON]", JSON.stringify(body, null, 2));
      } else {
        const text = await res.text();
        console.log("[RES TEXT]", text.slice(0, 500));
      }
    } catch (e) {
      console.log("[RES READ ERROR]", String(e));
    }
  });

  page.on("requestfailed", (req) => {
    const url = req.url();
    if (!isRelevant(url)) return;

    console.log(
      `[REQ FAIL] ${req.method()} ${url} -> ${req.failure()?.errorText ?? "unknown"}`
    );
  });

  page.on("console", (msg) => {
    const txt = msg.text();
    if (txt.toLowerCase().includes("error")) {
      console.log(`[BROWSER CONSOLE] ${msg.type()}: ${txt}`);
    }
  });

  page.on("pageerror", (err) => {
    console.log("[PAGE ERROR]", err.message);
  });
}

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
  await navBar.navigateToTab("home");

  await page.locator('[data-test="add-task-button"]').click();

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
  await navBar.navigateToTab("home");

  await page.locator('[data-test="add-task-button"]').click();

  const dialog = new AddTaskDialog(page);
  await dialog.expectOpen();

  const taskData = buildUniqueTask("Dialog task");
  await dialog.fillBasicFields(taskData);

  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();
  await mapPage.clickRandomAndReadCoordinates();

  // ✅ WebKit-safe: confirm POST /tasks/add actually happened
  const { status } = await dialog.submitAndWaitForCreate();
  expect(status).toBe(200);

  // ✅ then confirm the list refresh happened
  const allRes = await page.waitForResponse(
    (r) => r.url().includes("/tasks/all") && r.request().method() === "GET",
    { timeout: 30_000 }
  );
  expect(allRes.ok()).toBeTruthy();

  const allJson = await allRes.json();
  expect((allJson as any[]).some((t) => t?.name === taskData.name)).toBeTruthy();

  await dialog.ensureClosed();
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
