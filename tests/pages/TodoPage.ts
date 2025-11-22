// tests/page-objects/TodoPage.ts
import { Page, expect } from '@playwright/test';
import { defaultUser } from '../utils/test-data';

export class TodoPage {
  readonly page: Page;

  // later you can define locators here, for example:
  // readonly emailInput = this.page.getByTestId('email-input');

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    // baseURL will come from playwright.config.ts
    await this.page.goto('/');
  }

  async login(
    email: string = defaultUser.email,
    password: string = defaultUser.password,
  ) {
    // TODO: update selectors once you know them
    await this.page.getByTestId('email-input').fill(email);
    await this.page.getByTestId('password-input').fill(password);
    await this.page.getByTestId('login-submit').click();
  }

  async expectOnDashboard() {
    // TODO: update to something that exists on your main page
    await expect(this.page.getByTestId('todo-list')).toBeVisible();
  }
}
