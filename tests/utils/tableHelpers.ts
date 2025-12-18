//tests/utils/tableHelpers.ts
import { expect, Locator, Page } from "@playwright/test";

/**
 * Generic helper for HTML tables (like your AdminTask table).
 *
 * Assumes a standard structure:
 *   <table>
 *     <thead>... <th>...</th> ...</thead>
 *     <tbody>... <tr><td>...</td>...</tr> ...</tbody>
 *   </table>
 */
export class TableHelper {
  readonly page: Page;
  readonly root: Locator;

  constructor(page: Page, root: Locator) {
    this.page = page;
    this.root = root;
  }

  /**
   * Factory for your Admin table: there is only one table on the page.
   */
  static fromAdminTable(page: Page): TableHelper {
    const table = page.getByRole("table");
    return new TableHelper(page, table);
  }

  /**
   * <thead> locator.
   */
  getHeader(): Locator {
    return this.root.locator("thead");
  }

  /**
   * <tbody> locator.
   */
  getBody(): Locator {
    return this.root.locator("tbody");
  }

  /**
   * All header cells (<th> / <td> in thead).
   * (More robust than relying on role="columnheader" with MUI / styled cells.)
   */
  getHeaderCells(): Locator {
    return this.getHeader().locator("th, td");
  }

  /**
   * All data rows (<tr> inside <tbody>).
   */
  getBodyRows(): Locator {
    return this.getBody().locator("tr");
  }

  /**
   * Count of data rows, with a basic sanity check.
   */
  async getRowCount(): Promise<number> {
    const rows = this.getBodyRows();
    try {
      await rows.first().waitFor({ state: "visible", timeout: 1000 });
    } catch {
      // no visible rows yet, that's ok
    }
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
    return count;
  }

  /**
   * Make sure all expected headers are visible (by text).
   */
  async expectHeaders(expectedHeaders: string[]): Promise<void> {
    const headers = this.getHeaderCells();
    const count = await headers.count();

    const headerTexts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await headers.nth(i).innerText()).trim();
      if (text) {
        headerTexts.push(text);
      }
    }

    for (const expected of expectedHeaders) {
      expect(
        headerTexts,
        `Header "${expected}" should exist in table headers: [${headerTexts.join(
          ", "
        )}]`
      ).toContain(expected);
    }
  }

  /**
   * Find index of a header by its visible text.
   */
  async getColumnIndexByHeader(headerText: string): Promise<number> {
    const headers = this.getHeaderCells();
    const count = await headers.count();

    for (let i = 0; i < count; i++) {
      const text = (await headers.nth(i).innerText()).trim();
      if (text === headerText) {
        return i;
      }
    }

    throw new Error(`Header "${headerText}" not found in table`);
  }

  /**
   * Given a row and a header name, return the corresponding cell locator.
   */
  async getCellInRowByHeader(
    row: Locator,
    headerText: string
  ): Promise<Locator> {
    const colIndex = await this.getColumnIndexByHeader(headerText);
    const cells = row.locator("td, th");
    const cellCount = await cells.count();

    expect(
      cellCount,
      `Row has only ${cellCount} cells, cannot read index ${colIndex}`
    ).toBeGreaterThan(colIndex);

    const cell = cells.nth(colIndex);
    await expect(cell).toBeVisible();
    return cell;
  }

  /**
   * Read trimmed text from a specific cell in a specific row, by header name.
   */
  async getCellText(row: Locator, headerText: string): Promise<string> {
    const cell = await this.getCellInRowByHeader(row, headerText);
    const text = (await cell.innerText()).trim();
    return text;
  }

  /**
   * Find the first row whose given column has a matching value.
   * Match is exact string or RegExp test.
   */
  async findRowByColumnValue(
    headerText: string,
    expected: string | RegExp
  ): Promise<Locator | null> {
    const rows = this.getBodyRows();
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const value = await this.getCellText(row, headerText);

      if (typeof expected === "string") {
        if (value === expected) {
          return row;
        }
      } else {
        if (expected.test(value)) {
          return row;
        }
      }
    }

    return null;
  }

  /**
   * Assert that at least one row exists with the given column value.
   * Returns the row for further checks.
   *
   * Simple polling loop (TS-safe), waits up to timeoutMs.
   */
  async expectRowExists(
    headerText: string,
    expected: string | RegExp,
    timeoutMs: number = 10000,
    pollIntervalMs: number = 200
  ): Promise<Locator> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const row = await this.findRowByColumnValue(headerText, expected);
      if (row) {
        return row;
      }

      await this.page.waitForTimeout(pollIntervalMs);
    }

    throw new Error(
      `Expected a row where "${headerText}" is "${expected.toString()}" within ${timeoutMs}ms, but none was found.`
    );
  }

  /**
   * Given a row, assert that several columns have specific expected values.
   *
   * Example:
   *   await table.expectRowValues(row, {
   *     NAME: "My Task",
   *     SUBJECT: "OCP",
   *   });
   */
  async expectRowValues(
    row: Locator,
    expectations: Record<string, string | RegExp>
  ): Promise<void> {
    for (const [headerText, expected] of Object.entries(expectations)) {
      const actual = await this.getCellText(row, headerText);

      if (typeof expected === "string") {
        expect(
          actual,
          `Column "${headerText}" expected "${expected}", got "${actual}"`
        ).toBe(expected);
      } else {
        expect(
          expected.test(actual),
          `Column "${headerText}" expected to match ${expected}, got "${actual}"`
        ).toBe(true);
      }
    }
  }
}
