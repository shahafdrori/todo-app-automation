// tests/fixtures/test-fixtures.ts
import { test as base, expect } from "@playwright/test";

const test = base.extend({});

test.beforeEach(async ({ page }) => {
  await page.goto("/"); 
});

export { test, expect };
