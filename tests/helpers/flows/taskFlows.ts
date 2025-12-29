// tests/helpers/flows/taskFlows.ts
import { expect, type Page } from "@playwright/test";
import { NavBar } from "../../components/navBar";
import { HomePage } from "../../pages/HomePage";
import { AddTaskDialog } from "../../pages/AddTaskDialog";
import { MapPage } from "../../pages/MapPage";
import type { BasicTaskData } from "../../data/taskData";

/**
 * Creates a task via the UI from the Home tab:
 * Home -> open dialog -> fill form -> pick map coords -> submit -> wait for API -> ensure closed
 */
export async function createTaskFromHome(
  page: Page,
  navBar: NavBar,
  task: BasicTaskData,
  timeoutMs = 60_000
): Promise<{ longitude: number; latitude: number }> {
  const home = new HomePage(page);
  await home.openAddTaskDialogFromHome(navBar);

  const dialog = new AddTaskDialog(page);
  await dialog.expectOpen();
  await dialog.fillBasicFields(task);

  const mapPage = new MapPage(page);
  await mapPage.expectMapVisible();
  const { longitude, latitude } = await mapPage.clickRandomAndReadCoordinates();

  const { status } = await dialog.submitAndWaitForCreate(timeoutMs);
  expect(status).toBeGreaterThanOrEqual(200);
  expect(status).toBeLessThan(300);

  await dialog.ensureClosed();
  return { longitude, latitude };
}
