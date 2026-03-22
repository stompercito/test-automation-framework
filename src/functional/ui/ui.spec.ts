import { test, expect } from '@playwright/test';
import { ShopTestHomePage } from '../../../shared/pages/shoptest-home.page';
import { ShopTestCartPage } from '../../../shared/pages/shoptest-cart.page';

/**
 * Functional > UI tests aligned to the ShopTest demo application.
 * Version can be overridden by setting SHOPTEST_VERSION.
 */

const SHOPTEST_VERSION = (Number(process.env.SHOPTEST_VERSION ?? 3) || 3) as 1 | 2 | 3;

test.describe('ShopTest catalog', () => {
  let homePage: ShopTestHomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new ShopTestHomePage(page);
    await homePage.goto(SHOPTEST_VERSION);
  });

  test('shows the catalog landing experience', async () => {
    await expect(homePage.heroHeading).toBeVisible();
    await expect(homePage.searchInput).toBeVisible();
    await expect(homePage.resultCount).toContainText('8 products found');
  });

  test('filters products by search term', async () => {
    await homePage.search('Headphones');

    await expect(homePage.resultCount).toContainText('1 product found');
    await expect(homePage.productCard('Wireless Headphones')).toBeVisible();
  });
});

test.describe('ShopTest cart flow', () => {
  test('adds a product to the cart from the catalog', async ({ page }) => {
    const homePage = new ShopTestHomePage(page);
    const cartPage = new ShopTestCartPage(page);

    await homePage.goto(SHOPTEST_VERSION);
    await homePage.addToCartButton('Wireless Headphones').click();

    await expect(homePage.cartBadge).toHaveText('1');
    await homePage.cartButton.click();

    await expect(cartPage.heading).toBeVisible();
    await expect(cartPage.cartItem('Wireless Headphones')).toBeVisible();
    await expect(cartPage.checkoutLink).toBeVisible();
  });

  test('opens the product details page', async ({ page }) => {
    const homePage = new ShopTestHomePage(page);

    await homePage.goto(SHOPTEST_VERSION);
    await homePage.detailsLink('Wireless Headphones').click();

    await expect(page.getByRole('heading', { name: 'Wireless Headphones' })).toBeVisible();
    await expect(page.getByText(/premium wireless headphones/i)).toBeVisible();
  });
});
