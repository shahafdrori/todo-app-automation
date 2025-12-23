// tests/components/navBar.ts
import { Page, expect } from "@playwright/test";
import { Buttons } from "../helpers/Buttons";

export const NAV_TABS = {
  home: {
    selector: '[data-test="nav-home"]',
    path: "/",
  },
  admin: {
    selector: '[data-test="nav-admin"]',
    path: "/admin-page",
  },
  map: {
    selector: '[data-test="nav-map"]',
    path: "/tasks-map",
  },
} as const;

export type NavTab = keyof typeof NAV_TABS;

const NAV_BUTTON_SELECTORS: Record<NavTab, string> = {
  home: NAV_TABS.home.selector,
  admin: NAV_TABS.admin.selector,
  map: NAV_TABS.map.selector,
};

export class NavBar {
  private buttons: Buttons<typeof NAV_BUTTON_SELECTORS>;

  constructor(private page: Page) {
    this.buttons = new Buttons(page, NAV_BUTTON_SELECTORS);
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
