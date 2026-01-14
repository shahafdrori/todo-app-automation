// tests/pages/TaskLocationDialog.ts
import { expect, Page, Locator } from "@playwright/test";
import { TEST_IDS } from "../data/testIds";
import { getMarkerLonLat } from "../helpers/map/mapHelpers";

export class TaskLocationDialog {
  private readonly map: Locator;

  constructor(private readonly page: Page) {
    this.map = this.page.getByTestId(TEST_IDS.map.taskMap);
  }

  async expectOpen(): Promise<void> {
    const dialog = this.page
      .getByRole("dialog")
      .filter({ has: this.map })
      .first();

    await expect(dialog).toBeVisible();
    await expect(this.map).toBeVisible();
  }

  async expectMarkerCloseTo(
    expectedLng: number,
    expectedLat: number,
    digits: number = 4,
    timeoutMs: number = 15_000
  ): Promise<void> {
    await expect
      .poll(async () => await getMarkerLonLat(this.page), { timeout: timeoutMs })
      .not.toBeNull();

    const coords = await getMarkerLonLat(this.page);
    expect(coords).not.toBeNull();

    const [lng, lat] = coords!;
    expect(lng).toBeCloseTo(expectedLng, digits);
    expect(lat).toBeCloseTo(expectedLat, digits);
  }

  async closeWithEscape(): Promise<void> {
    await this.page.keyboard.press("Escape");

    const dialog = this.page
      .getByRole("dialog")
      .filter({ has: this.map })
      .first();

    await expect(dialog).toBeHidden({ timeout: 10_000 });
  }
}
