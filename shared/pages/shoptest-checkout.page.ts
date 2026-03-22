import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Shared page object for the ShopTest checkout page.
 */
export class ShopTestCheckoutPage extends BasePage {
  readonly heading: Locator = this.page.getByRole('heading', { name: /^checkout$/i });
  readonly nameInput: Locator = this.page.getByPlaceholder('John Doe');
  readonly emailInput: Locator = this.page.getByPlaceholder('john@example.com');
  readonly addressInput: Locator = this.page.getByPlaceholder('123 Main St');
  readonly cityInput: Locator = this.page.getByPlaceholder('New York');
  readonly zipInput: Locator = this.page.getByPlaceholder('10001');
  readonly cardInput: Locator = this.page.getByPlaceholder('4242 4242 4242 4242');
  readonly placeOrderButton: Locator = this.page.getByRole('button', { name: /place order/i });

  constructor(page: Page) {
    super(page);
  }

  async fillRequiredCheckoutData(): Promise<void> {
    await this.fill(this.nameInput, 'QA Automation');
    await this.fill(this.emailInput, 'qa@example.com');
    await this.fill(this.addressInput, '123 Test St');
    await this.fill(this.cityInput, 'Test City');
    await this.fill(this.zipInput, '12345');
    await this.fill(this.cardInput, '4242 4242 4242 4242');
  }
}

