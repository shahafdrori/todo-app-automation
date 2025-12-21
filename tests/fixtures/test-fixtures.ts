import { test as base } from "@playwright/test";
import { attachTasksApiMock } from "../mocks/tasksApiMock";

export const test = base.extend({
  page: async ({ page }, use) => {
    const shouldMock = process.env.MOCK_API === "true";
    if (shouldMock) {
      await attachTasksApiMock(page);
    }
    await use(page);
  },
});

export { expect } from "@playwright/test";
