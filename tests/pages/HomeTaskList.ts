// tests/pages/HomeTaskList.ts
import { expect, Locator, Page } from "@playwright/test";
import { TEST_IDS } from "../data/testIds";
import { TaskCard } from "../components/TaskCard";
import {
  extractPriorityFromText,
  extractSubjectFromText,
  extractTaskCoordsFromText,
} from "../helpers/list/homeTaskListText";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class HomeTaskList {
  readonly page: Page;
  readonly list: Locator;

  constructor(page: Page) {
    this.page = page;
    this.list = page.getByTestId(TEST_IDS.taskCard.list);
  }

  private cards(): Locator {
    return this.list.getByTestId(TEST_IDS.taskCard.root);
  }

  getTaskCard(name: string): TaskCard {
    const exactName = new RegExp(`^${escapeRegExp(name)}$`);
    const nameEl = this.page
      .getByTestId(TEST_IDS.taskCard.name)
      .filter({ hasText: exactName })
      .first();

    const root = this.cards().filter({ has: nameEl }).first();
    return new TaskCard(this.page, root);
  }

  async expectTaskCount(n: number, timeoutMs = 10_000): Promise<void> {
    await expect.poll(async () => await this.cards().count(), { timeout: timeoutMs }).toBe(n);
  }

  async waitForTaskVisible(name: string, timeoutMs = 15_000): Promise<void> {
    const card = this.getTaskCard(name);
    await expect
      .poll(async () => await card.root.isVisible().catch(() => false), { timeout: timeoutMs })
      .toBe(true);
    await card.expectVisible();
  }

  async waitForTaskGone(name: string, timeoutMs = 15_000): Promise<void> {
    const card = this.getTaskCard(name);
    await expect
      .poll(async () => await card.root.isVisible().catch(() => false), { timeout: timeoutMs })
      .toBe(false);
  }

  async expectTaskCompleted(name: string, completed: boolean): Promise<void> {
    await this.getTaskCard(name).expectNameColor(completed ? "green" : "red");
  }

  async toggleTaskCompleted(name: string): Promise<void> {
    await this.getTaskCard(name).toggleCompleted();
  }

  async expectTaskActionsVisible(name: string): Promise<void> {
    await this.getTaskCard(name).expectActionsVisible();
  }

  async clickDelete(name: string): Promise<void> {
    await this.getTaskCard(name).clickDelete();
  }

  async clickEdit(name: string): Promise<void> {
    await this.getTaskCard(name).clickEdit();
  }

  async clickLocation(name: string): Promise<void> {
    await this.getTaskCard(name).clickLocation();
  }

  async readCoords(name: string): Promise<{ longitude: number; latitude: number } | null> {
    const text = await this.getTaskCard(name).readMetaText();
    return extractTaskCoordsFromText(text);
  }

  async readSubject(name: string): Promise<string | null> {
    const text = await this.getTaskCard(name).readMetaText();
    return extractSubjectFromText(text);
  }

  async readPriority(name: string): Promise<number | null> {
    const text = await this.getTaskCard(name).readMetaText();
    return extractPriorityFromText(text);
  }
}
