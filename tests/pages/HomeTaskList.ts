//tests/pages/HomeTaskList.ts
import { expect, Locator, Page } from "@playwright/test";
import {
  extractPriorityFromText,
  extractSubjectFromText,
  extractTaskCoordsFromText,
} from "../helpers/list/homeTaskListText";

export class HomeTaskList {
  readonly page: Page;
  readonly list: Locator;

  constructor(page: Page) {
    this.page = page;
    this.list = page.getByRole("list").first();
  }

  private items(): Locator {
    return this.list.getByRole("listitem");
  }

  itemByName(name: string): Locator {
    return this.items().filter({ hasText: name }).first();
  }

  private checkboxInItem(item: Locator): Locator {
    return item.locator('input[type="checkbox"]').first();
  }

  private deleteButtonInItem(item: Locator): Locator {
    return item.getByRole("button", { name: "delete" }).first();
  }

  private editButtonInItem(item: Locator): Locator {
    return item.getByRole("button", { name: "edit" }).first();
  }

  private locationButtonInItem(item: Locator): Locator {
    return item.getByRole("button", { name: "location" }).first();
  }

  async waitForTaskVisible(name: string, timeoutMs = 15_000): Promise<void> {
    const item = this.itemByName(name);
    await expect
      .poll(async () => await item.isVisible().catch(() => false), {
        timeout: timeoutMs,
      })
      .toBe(true);
    await expect(item).toBeVisible();
  }

  async waitForTaskGone(name: string, timeoutMs = 15_000): Promise<void> {
    const item = this.itemByName(name);
    await expect
      .poll(async () => await item.isVisible().catch(() => false), {
        timeout: timeoutMs,
      })
      .toBe(false);
  }

  async expectTaskActionsVisible(name: string): Promise<void> {
    const item = this.itemByName(name);
    await expect(item).toBeVisible();

    await expect(this.checkboxInItem(item)).toBeVisible();
    await expect(this.deleteButtonInItem(item)).toBeVisible();
    await expect(this.editButtonInItem(item)).toBeVisible();
    await expect(this.locationButtonInItem(item)).toBeVisible();
  }

  async toggleComplete(name: string): Promise<void> {
    const item = this.itemByName(name);
    await expect(item).toBeVisible();

    const cb = this.checkboxInItem(item);
    await cb.click({ force: true });
  }

  async expectTaskNameColor(name: string, expected: "red" | "green") {
    const item = this.itemByName(name);
    await expect(item).toBeVisible();

    const nameEl = item.getByText(name, { exact: true }).first();

    const color = await nameEl.evaluate((el) => getComputedStyle(el).color);

    const redRe = /rgb(a)?\(\s*255\s*,\s*0\s*,\s*0/i;
    const greenRe = /rgb(a)?\(\s*0\s*,\s*128\s*,\s*0/i;

    if (expected === "red") {
      expect(color).toMatch(redRe);
    } else {
      expect(color).toMatch(greenRe);
    }
  }

  async clickDelete(name: string): Promise<void> {
    const item = this.itemByName(name);
    await expect(item).toBeVisible();
    await this.deleteButtonInItem(item).click();
  }

  async clickEdit(name: string): Promise<void> {
    const item = this.itemByName(name);
    await expect(item).toBeVisible();
    await this.editButtonInItem(item).click();
  }

  async clickLocation(name: string): Promise<void> {
    const item = this.itemByName(name);
    await expect(item).toBeVisible();
    await this.locationButtonInItem(item).click();
  }

  async readItemText(name: string): Promise<string> {
    const item = this.itemByName(name);
    await expect(item).toBeVisible();
    return (await item.innerText()).replace(/\s+/g, " ").trim();
  }

  async readCoords(name: string): Promise<{ longitude: number; latitude: number } | null> {
    const text = await this.readItemText(name);
    return extractTaskCoordsFromText(text);
  }

  async readSubject(name: string): Promise<string | null> {
    const text = await this.readItemText(name);
    return extractSubjectFromText(text);
  }

  async readPriority(name: string): Promise<number | null> {
    const text = await this.readItemText(name);
    return extractPriorityFromText(text);
  }
}
