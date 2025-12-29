// tests/helpers/Buttons.ts
import type { Locator, Page } from "@playwright/test";

type Root = Page | Locator;

function isPage(root: Root): root is Page {
  return typeof (root as Page).url === "function";
}

export class Buttons<T extends Record<string, string>> {
  constructor(private readonly root: Root, private readonly ids: T) {}

  get(key: keyof T): Locator {
    const id = this.ids[key];

    if (isPage(this.root)) {
      return this.root.getByTestId(id);
    }

    return this.root.getByTestId(id);
  }

  async click(key: keyof T, timeout = 10_000): Promise<void> {
    const btn = this.get(key);
    await btn.waitFor({ state: "visible", timeout });
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
  }
}
