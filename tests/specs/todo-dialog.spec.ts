// tests/specs/todo-dialog.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { Fields } from "../utils/fieldsActions";
import { MapPage } from "../pages/MapPage";


type TaskFormFields = {
  name: string;
  priority: string;
  subject: string;
  date: string;
  "coordinates.longitude": string;
  "coordinates.latitude": string;
  submit: string;
  cancel: string;
};

test("user can fill the task form and cancel", async ({ page }) => {
  // 1) Open the dialog
  await page.locator('[data-test="add-task-button"]').click();

  // 2) Create the Fields helper bound to this page
  const fields = new Fields<TaskFormFields>(page);

  // 3) Fill all the fields
  await fields.fillTextField("name", "My task");
  await fields.setPriority("priority", 3);
  await fields.fillAndSelectTextField("subject", "OCP");
  await fields.fillTextFieldAndEnter("date", "12/06/2025");
  await fields.fillTextField("coordinates.longitude", "34.78");
  await fields.fillTextField("coordinates.latitude", "32.07");

  // 4) Click Cancel
  // await fields.clickButtonOnForm("cancel");
  await page.locator('[data-test="cancel-button"]').click();

  // 5) Assert the dialog is closed
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("user can fill the task form and set coordinates from the map1", async ({ page }) => {
  // 1) Open the dialog
  await page.locator('[data-test="add-task-button"]').click();

  // 2) Helpers
  const fields = new Fields<TaskFormFields>(page);
  const mapPage = new MapPage(page);

  // 3) Fill non-map fields
  await fields.fillTextField("name", "Task with map");
  await fields.setPriority("priority", 4);
  await fields.fillAndSelectTextField("subject", "OCP");
  await fields.fillTextFieldAndEnter("date", "12/06/2025");

  // 4) Use the map to set coordinates
  await mapPage.expectMapVisible();
  await mapPage.clickRandomAndReadCoordinates();



  // 6) Cancel so we don't actually create the task
  await page.locator('[data-test="cancel-button"]').click();
});

test("user can fill the task form and set coordinates from the map", async ({ page }) => {
  // 1) Open the dialog
  await page.locator('[data-test="add-task-button"]').click();

  // 2) Helpers
  const fields = new Fields<TaskFormFields>(page);
  const mapPage = new MapPage(page);

  // 3) Fill non-map fields
  await fields.fillTextField("name", "Task with map");
  await fields.setPriority("priority", 4);
  await fields.fillAndSelectTextField("subject", "OCP");
  await fields.fillTextFieldAndEnter("date", "12/06/2025");

  // 4) Use the map to set coordinates
  await mapPage.expectMapVisible();
  const { longitude, latitude } = await mapPage.clickRandomAndReadCoordinates();

  // 5) Verify the form fields see the same values
  const lngField = await fields.getFieldByPath("coordinates.longitude");
  const latField = await fields.getFieldByPath("coordinates.latitude");

  const lngFromForm = await lngField.inputValue();
  const latFromForm = await latField.inputValue();

  expect(lngFromForm).not.toBe("");
  expect(latFromForm).not.toBe("");

  expect(Number(lngFromForm)).toBeCloseTo(longitude, 5);
  expect(Number(latFromForm)).toBeCloseTo(latitude, 5);

  // 6) Cancel so we don't actually create the task
  await page.locator('[data-test="cancel-button"]').click();
});