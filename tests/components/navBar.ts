// tests/components/navBar.ts
import { Page, expect, Locator } from "@playwright/test";
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
  private readonly buttons: Buttons<Record<NavTab, Locator>>;

  constructor(private readonly page: Page) {
    const navButtons: Record<NavTab, Locator> = {
      home: page.getByTestId(NAV_TABS.home.testId),
      admin: page.getByTestId(NAV_TABS.admin.testId),
      map: page.getByTestId(NAV_TABS.map.testId),
    };

    this.buttons = new Buttons(navButtons);
  }

  async navigateToTab(tab: NavTab): Promise<void> {
    const targetPath = NAV_TABS[tab].path;

    const currentUrl = new URL(this.page.url());
    if (currentUrl.pathname === targetPath) {
      return;
    }

    await this.buttons.clickButton(tab);
    await expect(this.page).toHaveURL(new RegExp(`${targetPath}$`));
  }

  async expectButtonTabVisible(tab: NavTab): Promise<void> {
    const locator = this.buttons.getButton(tab);
    await expect(locator).toBeVisible();
  }
}