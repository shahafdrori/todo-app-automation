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
  }>;

  constructor(private readonly page: Page) {
    this.buttons = new Buttons(this.page, {
      addTask: TEST_IDS.buttons.addTask,
      clearAll: TEST_IDS.buttons.clearAll,
    });
  }

  async goto(navBar: NavBar): Promise<void> {
    await navBar.navigateToTab("home");
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    // Home tab always has the Add Task button
    const add = this.buttons.get("addTask");
    await expect(add).toBeVisible();
    await expect(add).toBeEnabled();
  }

  async openAddTaskDialogFromHome(navBar: NavBar): Promise<void> {
    await this.goto(navBar);

    const add = this.buttons.get("addTask");
    await expect(add).toBeVisible();
    await expect(add).toBeEnabled();
    await add.scrollIntoViewIfNeeded();
    await add.click();
  }

  async clearAllTasksFromHome(navBar: NavBar, timeoutMs = 30_000): Promise<void> {
    await this.goto(navBar);

    const btn = this.buttons.get("clearAll");
    if (!(await btn.isVisible())) return;

    await expect(btn).toBeEnabled();

    // If an app dialog ever appears, accept it, but don't rely on it.
    this.page.once("dialog", (d) => d.accept());

    const isDeleteAll = (r: any) => {
      const url = r.url();
      const m = r.request().method().toUpperCase();
      return m === "DELETE" && urlIncludesAny(url, API_ROUTES.tasks.deleteAll);
    };

    await Promise.all([
      this.page.waitForResponse(isDeleteAll, { timeout: timeoutMs }).catch(() => {
        // Some builds might not return JSON / might not fire (rare). We still proceed.
      }),
      btn.click(),
    ]);

    // Small stabilization for UI re-render (kept minimal)
    await this.page.waitForTimeout(150);
  }
}
