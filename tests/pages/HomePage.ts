// tests/pages/HomePage.ts
import { Page, expect } from "@playwright/test";
import { Buttons } from "../helpers/Buttons";
import { TEST_IDS } from "../data/testIds";
import { NavBar } from "../components/navBar";
import { API_ROUTES, urlIncludesAny } from "../data/apiRoutes";

export class HomePage {
  private readonly buttons: Buttons<{
    addTask: string;
    clearAll: string;
    showCompleted: string;
  }>;

  constructor(private readonly page: Page) {
    this.buttons = new Buttons(this.page, {
      addTask: TEST_IDS.buttons.addTask,
      clearAll: TEST_IDS.buttons.clearAll,
      showCompleted: TEST_IDS.buttons.showCompleted,
    });
  }

  async goto(navBar: NavBar): Promise<void> {
    await navBar.navigateToTab("home");
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    const add = this.buttons.get("addTask");
    await expect(add).toBeVisible();
    await expect(add).toBeEnabled();
    const clear = this.buttons.get("clearAll");
    await expect(clear).toBeVisible();
    await expect(clear).toBeEnabled();
    
    await expect(this.page.getByTestId(TEST_IDS.inputs.search)).toBeVisible();
    await expect(this.buttons.get("showCompleted")).toBeVisible();
  }

  async openAddTaskDialogFromHome(navBar: NavBar): Promise<void> {
    await this.goto(navBar);

    const add = this.buttons.get("addTask");
    await expect(add).toBeVisible();
    await expect(add).toBeEnabled();
    await add.scrollIntoViewIfNeeded();
    await add.click();
  }

  async clearAllTasksFromHome(
    navBar: NavBar,
    timeoutMs = 30_000
  ): Promise<void> {
    await this.goto(navBar);

    const btn = this.buttons.get("clearAll");
    if (!(await btn.isVisible())) return;

    await expect(btn).toBeEnabled();
    this.page.once("dialog", (d) => d.accept());

    const isDeleteAll = (r: any) => {
      const url = r.url();
      const m = r.request().method().toUpperCase();
      return m === "DELETE" && urlIncludesAny(url, API_ROUTES.tasks.deleteAll);
    };

    await Promise.all([
      this.page.waitForResponse(isDeleteAll, { timeout: timeoutMs }).catch(() => {}),
      btn.click(),
    ]);

    await this.page.waitForTimeout(150);
  }

  async search(text: string): Promise<void> {
    const input = this.page.getByTestId(TEST_IDS.inputs.search);
    await expect(input).toBeVisible();
    await input.fill(text);
  }

  async clearSearch(): Promise<void> {
    const input = this.page.getByTestId(TEST_IDS.inputs.search);
    await expect(input).toBeVisible();
    await input.fill("");
  }

  async toggleShowCompleted(): Promise<void> {
    await this.buttons.click("showCompleted");
  }
}
