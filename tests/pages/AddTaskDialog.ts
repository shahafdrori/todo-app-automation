// tests/pages/AddTaskDialog.ts
import { Page, Locator, expect, APIResponse } from "@playwright/test";
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

  // keep buttons scoped to the dialog (not the whole page)
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
    // Only use this after you explicitly close (cancel/X),
    // NOT after submit unless the product is supposed to auto-close.
    await expect(this.root).toBeHidden({ timeout: 10000 });
  }

  async fillBasicFields(data: BasicTaskData): Promise<void> {
    const { name, priority, subject, date } = data;

    await this.form.fillTextField("name", name);
    await this.form.setPriority("priority", priority);
    await this.form.selectOption("subject", subject);
    await this.form.fillTextFieldAndEnter("date", date);
    const dateField = await this.form.getFieldByPath("date");
    await dateField.blur(); // or: await this.page.keyboard.press("Tab");


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
  await this.submitBtn.click();
}


  // 1) Click submit + wait for the POST /tasks/add response (this answers “was it sent?”)
  async submitAndWaitForCreate(): Promise<{ status: number; json?: unknown }> {
    const [res] = await Promise.all([
      this.page.waitForResponse((r) => {
        const req = r.request();
        return req.method() === "POST" && r.url().includes("/tasks/add");
      }),
      this.submitBtn.click(),
    ]);

    const status = res.status();
    let json: unknown;
    try {
      json = await res.json();
    } catch {
      // ignore non-JSON
    }

    return { status, json };
  }

  async submitAndEnsureClosed(): Promise<void> {
    await this.submit();
    await this.ensureClosed();
  }



  async ensureClosed(timeoutMs: number = 10_000): Promise<void> {
    // If dialog auto-closes after submit, this will pass fast
    try {
      await this.root.waitFor({ state: "hidden", timeout: 1500 });
      return;
    } catch {
      // still open, try closing explicitly
    }

    // Try click cancel, but tolerate the dialog detaching while clicking
    try {
      await this.cancelBtn.click({ timeout: 5000 });
    } catch {
      // ignore if it was already closing/detached
    }

    await this.root.waitFor({ state: "hidden", timeout: timeoutMs });
  }



  // 2) If you want to close the dialog, do it explicitly
  async cancel(): Promise<void> {
    await this.cancelBtn.click();
  }
}

