// tests/specs/todo.spec.ts
import { test } from '../fixtures/test-fixtures';

test.describe('Todo app - happy path', () => {
  test('user can log in and see the main page', async ({ todoPage }) => {
    await todoPage.goto();
    await todoPage.login();
    await todoPage.expectOnDashboard();
  });
});
