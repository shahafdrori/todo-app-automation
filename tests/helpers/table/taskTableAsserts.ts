//tests/helpers/table/taskTableAsserts.ts
import { expect, Locator, Page } from "@playwright/test";
import { TableHelper } from "../TableHelper";

export type TaskTableRow = {
  name: string;
  subject?: string;
  priority?: number;
  dateMDY?: string; // input: "MM/DD/YYYY"
  longitude?: number;
  latitude?: number;
};

function parseMDY(mdy: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(mdy.trim());
  if (!m) return null;

  const mm = Number(m[1]);
  const dd = Number(m[2]);
  const yyyy = Number(m[3]);

  if (!(mm >= 1 && mm <= 12)) return null;
  if (!(dd >= 1 && dd <= 31)) return null;
  if (!(yyyy >= 1900 && yyyy <= 2100)) return null;

  return new Date(yyyy, mm - 1, dd, 12, 0, 0, 0);
}

function formatUiDate(d: Date): string {
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

export async function expectTaskPresent(
  table: TableHelper,
  task: TaskTableRow,
  options?: { timeoutMs?: number; strictDate?: boolean; coordDigits?: number }
): Promise<Locator> {
  const timeoutMs = options?.timeoutMs ?? 30_000;

  const row = await table.expectRowExists("NAME", task.name, timeoutMs);

  if (task.subject !== undefined) {
    await table.expectRowValues(row, { SUBJECT: task.subject });
  }

  if (task.priority !== undefined) {
    await table.expectRowValues(row, { PRIORITY: String(task.priority) });
  }

  if (task.dateMDY) {
    const raw = await table.getCellText(row, "DATE");
    const dateText = raw.replace(/\s+/g, " ").trim();

    expect(dateText).toMatch(/^\d{2}\s+\w{3}\s+\d{4}$/);

    const strict = options?.strictDate ?? true;
    if (strict) {
      const parsed = parseMDY(task.dateMDY);
      expect(parsed).not.toBeNull();

      const expectedUi = formatUiDate(parsed!);
      expect(dateText).toBe(expectedUi);
    }
  }

  if (task.longitude !== undefined) {
    const lngText = await table.getCellText(row, "LONGITUDE");
    const lng = Number(lngText);
    expect(Number.isFinite(lng)).toBe(true);
    expect(lng).toBeCloseTo(task.longitude, options?.coordDigits ?? 4);
  }

  if (task.latitude !== undefined) {
    const latText = await table.getCellText(row, "LATITUDE");
    const lat = Number(latText);
    expect(Number.isFinite(lat)).toBe(true);
    expect(lat).toBeCloseTo(task.latitude, options?.coordDigits ?? 4);
  }

  return row;
}

export async function waitForTaskAbsent(
  page: Page,
  table: TableHelper,
  taskName: string,
  timeoutMs = 15_000
): Promise<void> {
  await expect
    .poll(
      async () => {
        const row = await table.findRowByColumnValue("NAME", taskName);
        return row ? 1 : 0;
      },
      { timeout: timeoutMs }
    )
    .toBe(0);
}

export async function expectRowCount(
  page: Page,
  table: TableHelper,
  expected: number,
  timeoutMs = 10_000
): Promise<void> {
  await expect
    .poll(async () => await table.getRowCount(), { timeout: timeoutMs })
    .toBe(expected);
}
