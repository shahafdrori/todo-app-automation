import { Locator, Page, expect } from "@playwright/test";

export class Fields<T extends Record<string, string>> {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async getFieldByPath(fieldName: keyof T): Promise<Locator> {
    const base = this.page.locator(
      `[name="${String(fieldName)}"], [id="${String(fieldName)}"], input[value="${String(fieldName)}"]`
    );

    await base.waitFor({ state: "visible" });

    const fieldsType = "input, textarea";
    const inputs = base.locator(fieldsType);
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
    await field.waitFor({ state: "visible" });

    await expect(field).toHaveValue(value, { timeout: 30000 });
  }

  async clearField(fieldName: keyof T): Promise<void> {
    const field = await this.getFieldByPath(fieldName);
    await field.clear();
  }

  async fillAndSelectTextField(
    fieldName: keyof T,
    value: string
  ): Promise<void> {
    const field = await this.getFieldByPath(fieldName);

    await field.waitFor({ state: "visible" });
    await field.fill(value);

    const option = this.page.getByRole("option", { name: value }).first();
    await option.click();
  }

  async fillTextFieldAndEnter(
    fieldName: keyof T,
    value: string
  ): Promise<void> {
    const field = await this.getFieldByPath(fieldName);

    await field.waitFor({ state: "visible" });
    await field.click();
    await field.fill(value);
    await expect(field).toHaveValue(value);
    await this.page.keyboard.press("Enter");
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
      await expect(field).toHaveValue(numValue.toString(), { timeout: 30000 });
    }
  }
}



