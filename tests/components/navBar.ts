// tests/components/navBar.ts
import { Page, expect } from "@playwright/test";
import { Buttons } from "../helpers/Buttons";
import { TEST_IDS } from "../data/testIds";

export const NAV_TABS = {
  home: {
    testId: TEST_IDS.nav.home,
    path: "/",
  },
  admin: {
    testId: TEST_IDS.nav.admin,
    path: "/admin-page",
  },
  map: {
    testId: TEST_IDS.nav.map,
    path: "/tasks-map",
  },
} as const;

export type NavTab = keyof typeof NAV_TABS;

export class NavBar {
  private readonly buttons: Buttons<Record<NavTab, string>>;

  constructor(private readonly page: Page) {
    const ids = {
      home: NAV_TABS.home.testId,
      admin: NAV_TABS.admin.testId,
      map: NAV_TABS.map.testId,
    } as Record<NavTab, string>;

    this.buttons = new Buttons(this.page, ids);
  }

  async navigateToTab(tab: NavTab): Promise<void> {
    const targetPath = NAV_TABS[tab].path;

    const currentUrl = new URL(this.page.url());
    if (currentUrl.pathname === targetPath) {
      return;
    }

    await this.buttons.click(tab);
    await expect(this.page).toHaveURL(new RegExp(`${targetPath}$`));
  }

  async expectTabVisible(tab: NavTab): Promise<void> {
    await expect(this.buttons.get(tab)).toBeVisible();
  }
}
