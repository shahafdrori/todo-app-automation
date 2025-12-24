//tests/helpers/Buttons.ts
import { Page, Locator, expect } from "@playwright/test";

export class Buttons<T extends Record<string, string>> {
  private buttons: T;

  constructor(private page: Page, buttons: T) {
    this.buttons = buttons;
  }

  getButton(key: keyof T): Locator {
    return this.page.locator(this.buttons[key]);
  }

  async clickButton(key: keyof T) {
    const currentButton = await this.getButton(key);
    await currentButton.waitFor({ state: 'visible', timeout: 10000 });
    await currentButton.click();
  }
}
