import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../../../shared/fixtures/world';
import { ShopTestHomePage } from '../../../../shared/pages/shoptest-home.page';

Given('the user is on the application home page', async function (this: CustomWorld) {
  const homePage = new ShopTestHomePage(this.page);
  const selectedVersion = (this.data['shoptestVersion'] as 1 | 2 | 3 | undefined) ?? 3;
  await homePage.goto(selectedVersion);
});

When('the user searches for {string}', async function (this: CustomWorld, term: string) {
  const homePage = new ShopTestHomePage(this.page);
  await homePage.search(term);
});

Then('the result area should be visible', async function (this: CustomWorld) {
  const homePage = new ShopTestHomePage(this.page);
  await expect(homePage.resultCount).toBeVisible();
});
