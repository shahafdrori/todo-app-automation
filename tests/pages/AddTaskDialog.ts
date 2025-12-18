// tests/pages/AddTaskDialog.ts
import { Page, Locator, expect } from "@playwright/test";
import { FormFields } from "../helpers/FormFields";

export type TaskFormFields = {
  name: string;
  priority: string;
  subject: string;
  date: string;
  "coordinates.longitude": string;
  "coordinates.latitude": string;
  submit: string;
  cancel: string;
};

type BasicTaskData = {
  name: string;
  priority: number;
  subject: string;
  date: string;
};

export class AddTaskDialog {
  readonly page: Page;
  readonly root: Locator;
  readonly form: FormFields<TaskFormFields>;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByRole("dialog");
    this.form = new FormFields<TaskFormFields>(page, this.root);
  }

  async expectOpen(): Promise<void> {
    await expect(this.root).toBeVisible();
  }
  
  async expectClosed(): Promise<void> {
  // Wait for the SAME dialog we opened to disappear
    await expect(this.root).toBeHidden({ timeout: 10000 });
  }


  /**
   * Fill the basic non-map fields in the dialog:
   * name, priority (1–5), subject (dropdown), date.
   */
  async fillBasicFields(data: BasicTaskData): Promise<void> {
    const { name, priority, subject, date } = data;

    await this.form.fillTextField("name", name);
    await this.form.setPriority("priority", priority);

    await this.form.selectOption("subject", subject);

    // date input behaves like a normal text field in your DatePicker
    await this.form.fillTextFieldAndEnter("date", date);
  }


  async setCoordinatesManually(lng: string, lat: string): Promise<void> {
    await this.form.fillTextField("coordinates.longitude", lng);
    await this.form.fillTextField("coordinates.latitude", lat);
  }

  async readCoordinates(): Promise<{ lng: string; lat: string }> {
    const lngField = await this.form.getFieldByPath("coordinates.longitude");
    const latField = await this.form.getFieldByPath("coordinates.latitude");

    const lng = await lngField.inputValue();
    const lat = await latField.inputValue();

    return { lng, lat };
  }

  async submit(): Promise<void> {
    await this.page.locator('[data-test="submit-button"]').click();
  }

  async cancel(): Promise<void> {
    await this.page.locator('[data-test="cancel-button"]').click();
  }
}