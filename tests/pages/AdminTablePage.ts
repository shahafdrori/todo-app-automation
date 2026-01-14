// tests/pages/AdminTablePage.ts
import { expect, Page } from "@playwright/test";
import { TableHelper } from "../helpers/TableHelper";
import { NavBar } from "../components/navBar";
import { Buttons } from "../helpers/Buttons";
import { TEST_IDS } from "../data/testIds";
import { expectTaskPresent, waitForTaskAbsent } from "../helpers/table/taskTableAsserts";

export class AdminTablePage {
  readonly page: Page;
  readonly table: TableHelper;

  private readonly buttons: Buttons<{
    addTask: string;
  }>;

  constructor(page: Page) {
    this.page = page;
    const tableLocator = page.getByRole("table");
    this.table = new TableHelper(page, tableLocator);

    this.buttons = new Buttons(this.page, {
      addTask: TEST_IDS.buttons.addTask,
    });
  }

  async goto(navBar: NavBar): Promise<void> {
    await navBar.navigateToTab("admin");
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: /Task List/i })).toBeVisible();
    await expect(this.page.getByRole("table")).toBeVisible();

    await this.table.expectHeaders([
      "NAME",
      "PRIORITY",
      "SUBJECT",
      "DATE",
      "LONGITUDE",
      "LATITUDE",
    ]);
  }

  async openAddTaskDialogFromAdmin(navBar: NavBar): Promise<void> {
    await this.goto(navBar);

    const btn = this.buttons.get("addTask");
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
  }

  async getTaskRowCount(): Promise<number> {
    return await this.table.getRowCount();
  }

  async expectTaskInTable(task: { name: string; subject: string; priority: number }): Promise<void> {
    await expectTaskPresent(this.table, {
      name: task.name,
      subject: task.subject,
      priority: task.priority,
    });
  }

  async waitForTaskNotInTable(taskName: string, timeoutMs: number = 15_000): Promise<void> {
    await waitForTaskAbsent(this.page, this.table, taskName, timeoutMs);
  }

  async expectTaskCoordinatesClose(
    taskName: string,
    expectedLng: number,
    expectedLat: number,
    digits: number = 4
  ): Promise<void> {
    await expectTaskPresent(this.table, {
      name: taskName,
      longitude: expectedLng,
      latitude: expectedLat,
    }, { coordDigits: digits });
  }

  async expectFullTaskRow(task: {
    name: string;
    subject: string;
    priority: number;
    date: string; // "MM/DD/YYYY"
    longitude: number;
    latitude: number;
    strictDate?: boolean;
  }): Promise<void> {
    await expectTaskPresent(this.table, {
      name: task.name,
      subject: task.subject,
      priority: task.priority,
      dateMDY: task.date,
      longitude: task.longitude,
      latitude: task.latitude,
    }, { strictDate: task.strictDate ?? true, coordDigits: 4 });
  }

  async reload(): Promise<void> {
    await this.page.reload();
    await this.expectLoaded();
  }
}
