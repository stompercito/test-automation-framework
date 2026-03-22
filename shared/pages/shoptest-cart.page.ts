import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Shared page object for the ShopTest cart page.
 */
export class ShopTestCartPage extends BasePage {
  readonly heading: Locator = this.page.getByRole('heading', { name: /shopping cart/i });
  readonly checkoutLink: Locator = this.page.getByRole('link', { name: /proceed to checkout/i });
  readonly emptyState: Locator = this.page.getByText(/your cart is empty/i);

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate('/cart');
    await this.waitForLoad();
  }

  cartItem(name: string): Locator {
    return this.page.locator('.cart-item').filter({ has: this.page.getByRole('heading', { name }) });
  }
}
