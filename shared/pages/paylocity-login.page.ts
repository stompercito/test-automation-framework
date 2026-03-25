import { expect, Locator, Page } from '@playwright/test';
import { config } from '../config/config';
import { BasePage } from './base.page';

export class PaylocityLoginPage extends BasePage {
  readonly loginForm: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly loginErrorSummary: Locator;

  constructor(page: Page) {
    super(page);

    this.loginForm = page.locator('form').first();
    this.usernameInput = page.locator('input#Username, input[name="Username"], input#username').first();
    this.passwordInput = page.locator('input#Password, input[name="Password"], input#password').first();
    this.submitButton = page.getByRole('button', { name: /log in|login|sign in/i }).first();
    this.loginErrorSummary = page.locator('[data-valmsg-summary="true"], .validation-summary-errors').first();
  }

  async goto(): Promise<void> {
    // Use absolute configured login URL to avoid baseURL path resolution issues.
    await this.page.goto(config.baseUrl, { waitUntil: 'domcontentloaded' });
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
    await expect(this.submitButton).toBeVisible();
  }
}
