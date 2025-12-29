// tests/helpers/Buttons.ts
import type { Locator, Page } from "@playwright/test";

type Root = Page | Locator;

export class Buttons<T extends Record<string, string>> {
  constructor(private readonly root: Root, private readonly ids: T) {}

  get(key: keyof T): Locator {
    const id = this.ids[key];
    return (this.root as any).getByTestId(id) as Locator;
  }

  async click(key: keyof T, timeout = 10_000): Promise<void> {
    const btn = this.get(key);
    await btn.waitFor({ state: "visible", timeout });
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
  }
}
