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

  private readonly submitBtn: Locator;
  private readonly cancelBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByRole("dialog");
    this.form = new FormFields<TaskFormFields>(page, this.root);

    this.submitBtn = this.root.locator('[data-test="submit-button"]');
    this.cancelBtn = this.root.locator('[data-test="cancel-button"]');
  }

  async expectOpen(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async expectClosed(): Promise<void> {
    await expect(this.root).toBeHidden({ timeout: 10000 });
  }

  async fillBasicFields(data: BasicTaskData): Promise<void> {
    const { name, priority, subject, date } = data;

    await this.form.fillTextField("name", name);
    await this.form.setPriority("priority", priority);
    await this.form.selectOption("subject", subject);

    await this.form.fillTextFieldAndEnter("date", date);

    const dateField = await this.form.getFieldByPath("date");
    await dateField.blur();

    await expect(dateField).not.toHaveValue("", { timeout: 5000 });
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
    await expect(this.submitBtn).toBeVisible();
    await expect(this.submitBtn).toBeEnabled();
    await this.submitBtn.scrollIntoViewIfNeeded();
    await this.submitBtn.click();
  }

  async submitAndWaitForCreate(
    timeoutMs: number = 45_000
  ): Promise<{ status: number; created?: unknown; all?: unknown; url?: string }> {
    await expect(this.submitBtn).toBeVisible();
    await expect(this.submitBtn).toBeEnabled();
    await this.submitBtn.scrollIntoViewIfNeeded();

    const isCreateTaskRequest = (url: string, method: string) => {
      return method.toUpperCase() === "POST" && url.includes("/tasks");
    };

    const isTasksAllResponse = (r: any) =>
      r.url().includes("/tasks/all") && r.request().method() === "GET";

    const [req, allRes] = await Promise.all([
      this.page.waitForRequest((r) => isCreateTaskRequest(r.url(), r.method()), {
        timeout: timeoutMs,
      }),
      this.page.waitForResponse(isTasksAllResponse, { timeout: timeoutMs }),
      this.submitBtn.click(),
    ]);

    const res = await req.response();
    const status = res?.status() ?? 0;

    let created: unknown;
    try {
      const ct = res?.headers()?.["content-type"] || "";
      if (ct.includes("application/json")) created = await res!.json();
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

    return { status, created, all, url: req.url() };
  }

  async submitAndEnsureClosed(): Promise<void> {
    await this.submit();
    await this.ensureClosed();
  }

  async ensureClosed(timeoutMs: number = 10_000): Promise<void> {
    try {
      await this.root.waitFor({ state: "hidden", timeout: 1500 });
      return;
    } catch {
      // still open
    }

    try {
      await this.cancelBtn.click({ timeout: 5000 });
    } catch {
      // ignore
    }

    await this.root.waitFor({ state: "hidden", timeout: timeoutMs });
  }

  async cancel(): Promise<void> {
    await this.cancelBtn.click();
  }
}
