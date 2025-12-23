// tests/fixtures/test-fixtures.ts
import { test as base, expect as baseExpect } from "@playwright/test";
import { installTaskApiMock, type Task } from "../mocks/tasksApiMock";

type Fixtures = {
  mockTasks: {
    reset: (tasks?: Task[]) => void;
  };
};

export const test = base.extend<Fixtures>({
  mockTasks: [
    async ({ context }, use) => {
      const mock = await installTaskApiMock(context, { initialTasks: [] });
      await use(mock);
    },
    { auto: true },
  ],
});

export const expect = baseExpect;
