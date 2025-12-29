// tests/helpers/FormFields.ts
import { Locator, Page, expect } from "@playwright/test";

export class FormFields<T extends Record<string, string>> {
  readonly page: Page;
  readonly root: Page | Locator;

  constructor(page: Page, root?: Locator) {
    this.page = page;
    this.root = root ?? page;
  }

  private getBaseLocator(fieldName: keyof T): Locator {
    const name = String(fieldName);

    return this.root.locator(
      `[data-test="${name}"], [name="${name}"], [id="${name}"], [aria-label="${name}"]`
    );
  }

  async getFieldByPath(fieldName: keyof T): Promise<Locator> {
    const base = this.getBaseLocator(fieldName);

    await base.waitFor({ state: "visible" });

    const inputs = base.locator("input, textarea, select");
    const count = await inputs.count();

    if (count === 1) {
      return inputs.first();
    }

    return base;
  }

  async checkField(fieldName: keyof T): Promise<void> {
    const checkBoxField = await this.getFieldByPath(fieldName);
    await checkBoxField.check();
  }

  async uncheckField(fieldName: keyof T): Promise<void> {
    const checkBoxField = await this.getFieldByPath(fieldName);
    await checkBoxField.uncheck();
  }

  async fillTextField(fieldName: keyof T, value: string): Promise<void> {
    const field = await this.getFieldByPath(fieldName);

    await field.click();
    await field.fill(value);

    await expect(field).toHaveValue(value);
  }

  async clearField(fieldName: keyof T): Promise<void> {
    const field = await this.getFieldByPath(fieldName);
    await field.clear();
  }

  async fillTextFieldAndEnter(
    fieldName: keyof T,
    value: string
  ): Promise<void> {
    const field = await this.getFieldByPath(fieldName);

    await field.click();
    await field.fill(value);
    await expect(field).toHaveValue(value);
    await this.page.keyboard.press("Enter");
  }

  async selectOption(fieldName: keyof T, value: string): Promise<void> {
    const field = await this.getFieldByPath(fieldName);

    const tagName = await field.evaluate((el) =>
      (el as HTMLElement).tagName.toLowerCase()
    );

    if (tagName === "select") {
      await field.selectOption({ label: value });
      return;
    }

    let clickTarget: Locator = field;

    const hasMuiSelectClass = await field.evaluate((el) => {
      const cls = (el as HTMLElement).className || "";
      return cls.toString().includes("MuiSelect-nativeInput");
    });

    if (hasMuiSelectClass) {
      const combo = field.locator(
        'xpath=../*[@role="combobox" or @role="button" or @aria-haspopup="listbox"]'
      );
      if (await combo.count()) {
        clickTarget = combo.first();
      }
    }

    await clickTarget.click();

    const option = this.page.getByRole("option", { name: value }).first();
    await expect(option).toBeVisible();
    await option.click();
  }

  async clickButtonOnForm(fieldName: keyof T): Promise<void> {
    const field = await this.getFieldByPath(fieldName);
    await field.click();
  }

  async setPriority(fieldName: keyof T, value: string | number): Promise<void> {
    const strValue = String(value).trim();
    const numValue = Number(strValue);

    const isNumeric = !Number.isNaN(numValue);
    const inRange = isNumeric && numValue >= 1 && numValue <= 5;

    if (!inRange) {
      console.warn(
        `[setPriority] Invalid priority "${value}". Expected a number between 1 and 5.`
      );
    }

    const field = await this.getFieldByPath(fieldName);

    await field.click();
    await field.fill("");
    await field.type(strValue);

    if (inRange) {
      await expect(field).toHaveValue(numValue.toString(), { timeout: 30_000 });
    }
  }
}
