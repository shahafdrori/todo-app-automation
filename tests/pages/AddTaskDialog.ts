// tests/pages/AddTaskDialog.ts
import { Page, Locator, expect } from "@playwright/test";
import { FormFields } from "../helpers/FormFields";
import { Buttons } from "../helpers/Buttons";
import { TEST_IDS } from "../data/testIds";
import { API_ROUTES, urlIncludesAny } from "../data/apiRoutes";

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

  private readonly buttons: Buttons<{
    submit: string;
    cancel: string;
  }>;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByRole("dialog");
    this.form = new FormFields<TaskFormFields>(page, this.root);

    this.buttons = new Buttons(this.root, {
      submit: TEST_IDS.buttons.submit,
      cancel: TEST_IDS.buttons.cancel,
    });
  }

  async expectOpen(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async expectClosed(): Promise<void> {
    await expect(this.root).toBeHidden({ timeout: 10_000 });
  }

  async fillBasicFields(data: BasicTaskData): Promise<void> {
    const { name, priority, subject, date } = data;

    await this.form.fillTextField("name", name);
    await this.form.setPriority("priority", priority);
    await this.form.selectOption("subject", subject);

    await this.form.fillTextFieldAndEnter("date", date);

    const dateField = await this.form.getFieldByPath("date");
    await dateField.blur();

    await expect(dateField).not.toHaveValue("", { timeout: 5_000 });
  }

  async setCoordinatesManually(lng: string, lat: string): Promise<void> {
    await this.form.fillTextField("coordinates.longitude", lng);
    await this.form.fillTextField("coordinates.latitude", lat);
  }

  async readCoordinates(): Promise<{ lng: string; lat: string }> {
    const lngField = await this.form.getFieldByPath("coordinates.longitude");
    const latField = await this.form.getFieldByPath("coordinates.latitude");

    return {
      lng: await lngField.inputValue(),
      lat: await latField.inputValue(),
    };
  }

  async submit(): Promise<void> {
    const btn = this.buttons.get("submit");
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
  }

  async submitAndWaitForCreate(
    timeoutMs: number = 45_000
  ): Promise<{ status: number; created?: unknown; all?: unknown; url?: string }> {
    const submitBtn = this.buttons.get("submit");
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();
    await submitBtn.scrollIntoViewIfNeeded();

    const isCreateTaskResponse = (r: any) => {
      const url = r.url();
      const m = r.request().method().toUpperCase();
      return m === "POST" && urlIncludesAny(url, API_ROUTES.tasks.add);
    };

    const isTasksAllResponse = (r: any) => {
      const url = r.url();
      const m = r.request().method().toUpperCase();
      return m === "GET" && urlIncludesAny(url, API_ROUTES.tasks.all);
    };

    const [createRes, allRes] = await Promise.all([
      this.page.waitForResponse(isCreateTaskResponse, { timeout: timeoutMs }),
      this.page.waitForResponse(isTasksAllResponse, { timeout: timeoutMs }),
      submitBtn.click(),
    ]);

    const status = createRes.status();
    const url = createRes.url();

    let created: unknown;
    try {
      const ct = createRes.headers()?.["content-type"] || "";
      if (ct.includes("application/json")) created = await createRes.json();
    } catch {
      // ignore
    }

    let all: unknown;
    try {
      const ct = allRes.headers()?.["content-type"] || "";
      if (ct.includes("application/json")) all = await allRes.json();
    } catch {
      // ignore
    }

    return { status, created, all, url };
  }

  async submitAndEnsureClosed(): Promise<void> {
    await this.submit();
    await this.ensureClosed();
  }

  async ensureClosed(timeoutMs: number = 10_000): Promise<void> {
    try {
      await this.root.waitFor({ state: "hidden", timeout: 1_500 });
      return;
    } catch {
      // still open
    }

    try {
      await this.buttons.click("cancel", 5_000);
    } catch {
      // ignore
    }

    await this.root.waitFor({ state: "hidden", timeout: timeoutMs });
  }

  async cancel(): Promise<void> {
    await this.buttons.click("cancel");
  }
}
