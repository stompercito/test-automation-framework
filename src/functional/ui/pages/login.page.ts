import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * LoginPage – Page Object for the login/sign-in screen.
 *
 * Encapsulates all selectors and interactions related to authentication
 * so that test scenarios stay readable and maintainable.
 */
export class LoginPage extends BasePage {
  // ── Locators ─────────────────────────────────────────────────────────────────
  readonly usernameInput: Locator = this.page.getByLabel('Username');
  readonly passwordInput: Locator = this.page.getByLabel('Password');
  readonly submitButton: Locator = this.page.getByRole('button', { name: /sign in/i });
  readonly errorMessage: Locator = this.page.getByRole('alert');

  constructor(page: Page) {
    super(page);
  }

  /** Navigate to the login page. */
  async goto(): Promise<void> {
    await this.navigate('/login');
    await this.waitForLoad();
  }

  /** Fill credentials and submit the login form. */
  async loginWith(username: string, password: string): Promise<void> {
    await this.fill(this.usernameInput, username);
    await this.fill(this.passwordInput, password);
    await this.click(this.submitButton);
  }

  /** Return the current error message text (if visible). */
  async getError(): Promise<string> {
    return this.getText(this.errorMessage);
  }
}
