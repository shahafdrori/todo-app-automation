//tests/pages/AdminTablePage.ts
import { expect, Page } from "@playwright/test";
import { TableHelper } from "../helpers/TableHelper";
import { NavBar } from "../components/navBar";

export class AdminTablePage {
  readonly page: Page;
  readonly table: TableHelper;

  constructor(page: Page) {
    this.page = page;
    const tableLocator = page.getByRole("table"); // only table on admin page
    this.table = new TableHelper(page, tableLocator);
  }

  /**
   * Navigate to the admin tab using the shared NavBar.
   */
  async goto(navBar: NavBar): Promise<void> {
    await navBar.navigateToTab("admin");
    await this.expectLoaded();
  }

  /**
   * Basic "page is loaded" checks.
   */
  async expectLoaded(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: /Task List/i })
    ).toBeVisible();
    await expect(this.page.getByRole("table")).toBeVisible();

    // Use the actual visible header texts (uppercase from CSS)
    await this.table.expectHeaders([
      "NAME",
      "PRIORITY",
      "SUBJECT",
      "DATE",
      "LONGITUDE",
      "LATITUDE",
    ]);
  }

  /**
   * Helper to get current number of task rows.
   */
  async getTaskRowCount(): Promise<number> {
    return await this.table.getRowCount();
  }

  /**
   * Assert that a specific task exists in the table
   * with correct basic fields (NAME, SUBJECT, PRIORITY).
   */
  async expectTaskInTable(task: {
    name: string;
    subject: string;
    priority: number;
  }): Promise<void> {
    const row = await this.table.expectRowExists("NAME", task.name);

    await this.table.expectRowValues(row, {
      NAME: task.name,
      SUBJECT: task.subject,
      PRIORITY: String(task.priority),
    });
  }

  /**
   * Assert that a task has Longitude/Latitude close to given numbers.
   */
  async expectTaskCoordinatesClose(
    taskName: string,
    expectedLng: number,
    expectedLat: number,
    digits: number = 4
  ): Promise<void> {
    const row = await this.table.expectRowExists("NAME", taskName);

    const lngText = await this.table.getCellText(row, "LONGITUDE");
    const latText = await this.table.getCellText(row, "LATITUDE");

    const lng = Number(lngText);
    const lat = Number(latText);

    expect(Number.isFinite(lng)).toBe(true);
    expect(Number.isFinite(lat)).toBe(true);

    expect(lng).toBeCloseTo(expectedLng, digits);
    expect(lat).toBeCloseTo(expectedLat, digits);
  }

  /**
   * Assert ALL visible fields for a task row:
   * NAME, SUBJECT, PRIORITY, DATE (non-empty & formatted), LONGITUDE, LATITUDE.
   */
  async expectFullTaskRow(task: {
    name: string;
    subject: string;
    priority: number;
    date: string; // raw date you filled in the dialog (used only for presence check)
    longitude: number;
    latitude: number;
  }): Promise<void> {
    const row = await this.table.expectRowExists("NAME", task.name);

    // 1) Check basic text columns
    await this.table.expectRowValues(row, {
      NAME: task.name,
      SUBJECT: task.subject,
      PRIORITY: String(task.priority),
    });

    // 2) Date: make sure it's not empty and looks like "DD MMM YYYY"
    const dateText = await this.table.getCellText(row, "DATE");
    expect(dateText).not.toBe("");
    expect(
      dateText,
      `Date cell should look like "DD MMM YYYY", got "${dateText}"`
    ).toMatch(/^\d{2}\s+\w{3}\s+\d{4}$/);

    // 3) Coordinates: numeric & close to the chosen ones
    const lngText = await this.table.getCellText(row, "LONGITUDE");
    const latText = await this.table.getCellText(row, "LATITUDE");

    const lng = Number(lngText);
    const lat = Number(latText);

    expect(Number.isFinite(lng)).toBe(true);
    expect(Number.isFinite(lat)).toBe(true);

    expect(lng).toBeCloseTo(task.longitude, 4);
    expect(lat).toBeCloseTo(task.latitude, 4);
  }

    async reload(): Promise<void> {
    await this.page.reload();
    await this.expectLoaded();
  }

}


