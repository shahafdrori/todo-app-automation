//tests/components/navBar.ts
import { Page, expect } from "@playwright/test";
import { Buttons } from "../utils/buttonsActions";

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

// map just selectors for the generic Buttons helper
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

  /**
   * Navigate to a tab by key: "home" | "admin" | "map".
   * - Skips click if already on that tab.
   * - Waits for button to be visible (via Buttons.clickButton).
   * - Verifies URL after navigation.
   */
  async navigateToTab(tab: NavTab): Promise<void> {
    const targetPath = NAV_TABS[tab].path;

    const currentUrl = this.page.url();
    if (currentUrl.endsWith(targetPath)) {
      console.log(
        `[NavBar] Already on "${tab}" (${currentUrl}), skipping click`
      );
      return;
    }

    await this.buttons.clickButton(tab);
    await expect(this.page).toHaveURL(targetPath);
  }

  /**
   * checks that the tab button exists and is visible.
   */
  async expectButtonTabVisible(tab: NavTab): Promise<void> {
    const locator = this.buttons.getButton(tab);
    await expect(locator).toBeVisible();
  }
}
