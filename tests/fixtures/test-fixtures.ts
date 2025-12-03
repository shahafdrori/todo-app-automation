import { test as base, expect } from '@playwright/test';

// you can extend fixtures here later if needed
const test = base.extend({});

// this runs before **every** test that uses this "test"
test.beforeEach(async ({ page }) => {
  // because baseURL is set in playwright.config.ts, '/' == 'http://localhost:5173/'
  await page.goto('/');
});

export { test, expect };
