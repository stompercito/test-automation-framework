import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../../../shared/fixtures/world';
import { ShopTestHomePage } from '../../../../shared/pages/shoptest-home.page';
import { ShopTestCartPage } from '../../../../shared/pages/shoptest-cart.page';

Given('the shopper is on the ShopTest home page', async function (this: CustomWorld) {
  const homePage = new ShopTestHomePage(this.page);
  const selectedVersion = (this.data['shoptestVersion'] as 1 | 2 | 3 | undefined) ?? 3;
  await homePage.goto(selectedVersion);
});

When('the shopper searches for {string}', async function (this: CustomWorld, term: string) {
  const homePage = new ShopTestHomePage(this.page);
  await homePage.search(term);
});

When(
  'the shopper opens the details for {string}',
  async function (this: CustomWorld, productName: string) {
    const homePage = new ShopTestHomePage(this.page);
    await homePage.detailsLink(productName).click();
  },
);

Then(
  'the shopper should see the {string} product detail page',
  async function (this: CustomWorld, productName: string) {
    await expect(this.page.getByRole('heading', { name: productName })).toBeVisible();
  },
);

When(
  'the shopper adds {string} to the cart from the catalog',
  async function (this: CustomWorld, productName: string) {
    const homePage = new ShopTestHomePage(this.page);
    await homePage.addToCartButton(productName).click();
  },
);

When('the shopper opens the cart', async function (this: CustomWorld) {
  const homePage = new ShopTestHomePage(this.page);
  await homePage.cartButton.click();
});

Then('the cart should contain {string}', async function (this: CustomWorld, productName: string) {
  const cartPage = new ShopTestCartPage(this.page);
  await expect(cartPage.cartItem(productName)).toBeVisible();
});

Then('checkout should be available', async function (this: CustomWorld) {
  const cartPage = new ShopTestCartPage(this.page);
  await expect(cartPage.checkoutLink).toBeVisible();
});
