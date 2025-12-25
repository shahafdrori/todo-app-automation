// tests/pages/MapPage.ts
import { Page, expect } from "@playwright/test";
import {
  MAP_TEST_ID,
  clickRandomOnMapAndValidateInputs,
  pan,
  zoomWithButtons,
  zoomWithWheel,
  getZoom,
  getMarkerCoords,
  LngLat,
} from "../helpers/map/mapHelpers";

export class MapPage {
  constructor(private page: Page) {}

  async expectMapVisible() {
    await expect(this.page.getByTestId(MAP_TEST_ID)).toBeVisible();
  }

  async clickRandomAndReadCoordinates(): Promise<LngLat> {
    return await clickRandomOnMapAndValidateInputs(this.page);
  }

  async panLeft(pixels = 300) {
    await pan(this.page, -pixels, 0);
  }

  async panRight(pixels = 300) {
    await pan(this.page, pixels, 0);
  }

  async panUp(pixels = 200) {
    await pan(this.page, 0, -pixels);
  }

  async panDown(pixels = 200) {
    await pan(this.page, 0, pixels);
  }

  async zoomInDialog(steps = 2) {
    await zoomWithButtons(this.page, "in", steps);
  }

  async zoomOutDialog(steps = 2) {
    await zoomWithButtons(this.page, "out", steps);
  }

  async zoomInWithWheel(steps = 5) {
    await zoomWithWheel(this.page, -120, steps);
  }

  async zoomOutWithWheel(steps = 5) {
    await zoomWithWheel(this.page, 120, steps);
  }

  async getZoom() {
    return await getZoom(this.page);
  }

  async getMarkerCoords() {
    return await getMarkerCoords(this.page);
  }

  async goToWesternHemisphere() {
    await this.zoomOutDialog(3);
    for (let i = 0; i < 5; i++) {
      await this.panLeft(350);
    }
  }
}