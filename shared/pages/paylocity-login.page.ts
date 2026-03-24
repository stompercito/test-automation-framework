import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class PaylocityLoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);

    // TODO: replace fallback selectors if the login form markup changes.
    this.usernameInput =
      page.locator('input[name="username"], input[type="email"], #username').first();
    this.passwordInput = page.locator('input[type="password"], #password').first();
    this.submitButton =
      page.getByRole('button', { name: /log in|login|sign in/i }).first();
  }

  async goto(): Promise<void> {
    await this.navigate('/');
    await this.waitForLoad();
  }

  async login(username: string, password: string): Promise<void> {
    await this.fill(this.usernameInput, username);
    await this.fill(this.passwordInput, password);
    await this.click(this.submitButton);
  }

  async assertReady(): Promise<void> {
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
  }
}
