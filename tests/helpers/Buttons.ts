// tests/helpers/Buttons.ts
import type { Locator } from "@playwright/test";

export class Buttons<T extends Record<string, Locator>> {
  constructor(private readonly buttons: T) {}

  getButton(key: keyof T): Locator {
    return this.buttons[key];
  }

  async clickButton(key: keyof T): Promise<void> {
    const currentButton = this.getButton(key);
    await currentButton.waitFor({ state: "visible", timeout: 10_000 });
    await currentButton.click();
  }
}