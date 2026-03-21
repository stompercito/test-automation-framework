import { Page, Locator } from '@playwright/test';

/**
 * BasePage – the root of the Page Object Model hierarchy.
 *
 * Every page-specific class extends BasePage and inherits:
 *  - navigate()  – go to the page's relative URL
 *  - waitForLoad() – wait until the page is ready
 *  - Common helper methods (fill, click, getText, …)
 *
 * Why POM? ISTQB TM specifies that abstractions reduce maintenance cost
 * and coupling between tests and the UI implementation.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Navigate to a relative URL (resolved against baseURL). */
  async navigate(path: string = '/'): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  /** Wait until the network is idle and the page title is available. */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Fill a text field by its locator. */
  async fill(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.fill(value);
  }

  /** Click an element. */
  async click(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.click();
  }

  /** Return the trimmed text content of an element. */
  async getText(locator: Locator): Promise<string> {
    return (await locator.textContent()) ?? '';
  }

  /** Return true when the element is visible. */
  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }
}
