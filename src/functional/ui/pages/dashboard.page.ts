import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * DashboardPage – Page Object for the main dashboard/home screen reached
 * after a successful login.
 */
export class DashboardPage extends BasePage {
  // ── Locators ─────────────────────────────────────────────────────────────────
  readonly welcomeHeading: Locator = this.page.getByRole('heading', { level: 1 });
  readonly logoutButton: Locator = this.page.getByRole('button', { name: /logout|sign out/i });
  readonly navigationMenu: Locator = this.page.getByRole('navigation');

  constructor(page: Page) {
    super(page);
  }

  /** Navigate directly to the dashboard (only works if already authenticated). */
  async goto(): Promise<void> {
    await this.navigate('/dashboard');
    await this.waitForLoad();
  }

  /** Click the logout button. */
  async logout(): Promise<void> {
    await this.click(this.logoutButton);
  }

  /** Return the welcome heading text. */
  async getWelcomeText(): Promise<string> {
    return this.getText(this.welcomeHeading);
  }
}
