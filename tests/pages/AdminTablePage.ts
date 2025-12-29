// tests/pages/AdminTablePage.ts
import { expect, Page } from "@playwright/test";
import { TableHelper } from "../helpers/TableHelper";
import { NavBar } from "../components/navBar";
import { Buttons } from "../helpers/Buttons";
import { TEST_IDS } from "../data/testIds";

function parseMDY(mdy: string): Date | null {
  // expects "MM/DD/YYYY"
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(mdy.trim());
  if (!m) return null;

  const mm = Number(m[1]);
  const dd = Number(m[2]);
  const yyyy = Number(m[3]);

  if (!(mm >= 1 && mm <= 12)) return null;
  if (!(dd >= 1 && dd <= 31)) return null;
  if (!(yyyy >= 1900 && yyyy <= 2100)) return null;

  // Use midday to reduce timezone-edge surprises
  const d = new Date(yyyy, mm - 1, dd, 12, 0, 0, 0);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function formatUiDate(d: Date): string {
  // UI expectation: "DD MMM YYYY" (e.g., "07 Jan 2026")
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).formatToParts(d);

  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const year = parts.find((p) => p.type === "year")?.value ?? "";

  return `${day} ${month} ${year}`.replace(/\s+/g, " ").trim();
}

export class AdminTablePage {
  readonly page: Page;
  readonly table: TableHelper;

  private readonly buttons: Buttons<{
    addTask: string;
  }>;

  constructor(page: Page) {
    this.page = page;
    const tableLocator = page.getByRole("table"); // only table on admin page
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
    await expect(
      this.page.getByRole("heading", { name: /Task List/i })
    ).toBeVisible();
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

  async expectTaskInTable(task: {
    name: string;
    subject: string;
    priority: number;
  }): Promise<void> {
    const row = await this.table.expectRowExists("NAME", task.name, 30_000);

    await this.table.expectRowValues(row, {
      NAME: task.name,
      SUBJECT: task.subject,
      PRIORITY: String(task.priority),
    });
  }

  async expectTaskCoordinatesClose(
    taskName: string,
    expectedLng: number,
    expectedLat: number,
    digits: number = 4
  ): Promise<void> {
    const row = await this.table.expectRowExists("NAME", taskName, 30_000);

    const lngText = await this.table.getCellText(row, "LONGITUDE");
    const latText = await this.table.getCellText(row, "LATITUDE");

    const lng = Number(lngText);
    const lat = Number(latText);

    expect(Number.isFinite(lng)).toBe(true);
    expect(Number.isFinite(lat)).toBe(true);

    expect(lng).toBeCloseTo(expectedLng, digits);
    expect(lat).toBeCloseTo(expectedLat, digits);
  }

  async expectFullTaskRow(task: {
    name: string;
    subject: string;
    priority: number;
    date: string; // input: "MM/DD/YYYY"
    longitude: number;
    latitude: number;
    strictDate?: boolean; // default true
  }): Promise<void> {
    const row = await this.table.expectRowExists("NAME", task.name, 30_000);

    await this.table.expectRowValues(row, {
      NAME: task.name,
      SUBJECT: task.subject,
      PRIORITY: String(task.priority),
    });

    const dateTextRaw = await this.table.getCellText(row, "DATE");
    const dateText = dateTextRaw.replace(/\s+/g, " ").trim();

    expect(dateText).not.toBe("");
    expect(
      dateText,
      `Date cell should look like "DD MMM YYYY", got "${dateText}"`
    ).toMatch(/^\d{2}\s+\w{3}\s+\d{4}$/);

    const strictDate = task.strictDate ?? true;
    if (strictDate) {
      const parsed = parseMDY(task.date);
      expect(
        parsed,
        `Task input date must be "MM/DD/YYYY". Got "${task.date}".`
      ).not.toBeNull();

      const expectedUi = formatUiDate(parsed!);

      expect(
        dateText,
        `Date mismatch. UI shows "${dateText}" but input was "${task.date}" (expected "${expectedUi}").`
      ).toBe(expectedUi);
    }

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
