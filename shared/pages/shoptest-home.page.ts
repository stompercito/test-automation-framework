import { Locator, Page } from '@playwright/test';
import { applyShopTestVersion, ShopTestVersion } from '../applications/shoptest/version';
import { BasePage } from './base.page';

/**
 * Page object specific to the ShopTest demo app.
 * Version handling belongs here because it is app-specific behavior.
 */
export class ShopTestHomePage extends BasePage {
  readonly heroHeading: Locator = this.page.getByRole('heading', { name: /welcome to shoptest/i });
  readonly searchInput: Locator = this.page.locator('.search-input');
  readonly resultCount: Locator = this.page.locator('.result-count');
  readonly cartBadge: Locator = this.page.locator('.cart-badge');
  readonly cartButton: Locator = this.page.locator('.cart-btn');

  constructor(page: Page) {
    super(page);
  }

  async goto(version?: ShopTestVersion): Promise<void> {
    if (version) {
      await applyShopTestVersion(this.page, version);
    }
    await this.navigate('/');
    await this.waitForLoad();
  }

  async search(term: string): Promise<void> {
    await this.fill(this.searchInput, term);
    await this.page.waitForTimeout(600);
  }

  productCard(name: string): Locator {
    return this.page.locator('.product-card').filter({ has: this.page.getByRole('heading', { name }) });
  }

  detailsLink(name: string): Locator {
    return this.productCard(name).getByRole('link', { name: /details/i });
  }

  addToCartButton(name: string): Locator {
    return this.productCard(name).getByRole('button', { name: /add to cart|added/i });
  }
}
