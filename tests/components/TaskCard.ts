// tests/components/TaskCard.ts
import { expect, Locator, Page } from "@playwright/test";
import { TEST_IDS } from "../data/testIds";
import { Buttons } from "../helpers/Buttons";

export class TaskCard {
  private readonly buttons: Buttons<{
    delete: string;
    edit: string;
    location: string;
  }>;

  constructor(
    private readonly page: Page,
    readonly root: Locator
  ) {
    this.buttons = new Buttons(this.root, {
      delete: TEST_IDS.taskCard.delete,
      edit: TEST_IDS.taskCard.edit,
      location: TEST_IDS.taskCard.location,
    });
  }

  private checkbox(): Locator {
    return this.root.getByTestId(TEST_IDS.taskCard.checkbox);
  }

  private nameEl(): Locator {
    return this.root.getByTestId(TEST_IDS.taskCard.name);
  }

  private metaEl(): Locator {
    return this.root.getByTestId(TEST_IDS.taskCard.meta);
  }

  async expectVisible(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async expectActionsVisible(): Promise<void> {
    await this.expectVisible();
    await expect(this.checkbox()).toBeVisible();
    await expect(this.buttons.get("delete")).toBeVisible();
    await expect(this.buttons.get("edit")).toBeVisible();
    await expect(this.buttons.get("location")).toBeVisible();
  }

  async toggleCompleted(): Promise<void> {
    await this.expectVisible();
    await this.checkbox().click({ force: true });
  }

  async expectNameColor(expected: "red" | "green"): Promise<void> {
    await this.expectVisible();

    const el = this.nameEl();
    await expect(el).toBeVisible();

    const color = await el.evaluate((node) => getComputedStyle(node).color);

    const redRe = /rgb(a)?\(\s*255\s*,\s*0\s*,\s*0/i;
    const greenRe = /rgb(a)?\(\s*0\s*,\s*128\s*,\s*0/i;

    if (expected === "red") expect(color).toMatch(redRe);
    else expect(color).toMatch(greenRe);
  }

  async clickDelete(): Promise<void> {
    await this.expectVisible();
    await this.buttons.click("delete");
  }

  async clickEdit(): Promise<void> {
    await this.expectVisible();
    await this.buttons.click("edit");
  }

  async clickLocation(): Promise<void> {
    await this.expectVisible();
    await this.buttons.click("location");
  }

  async readRawText(): Promise<string> {
    await this.expectVisible();
    return (await this.root.innerText()).replace(/\s+/g, " ").trim();
  }

  async readMetaText(): Promise<string> {
    await this.expectVisible();
    return (await this.metaEl().innerText()).replace(/\s+/g, " ").trim();
  }
}
