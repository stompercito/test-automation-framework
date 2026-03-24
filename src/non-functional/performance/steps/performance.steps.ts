import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../../../shared/fixtures/world';
import { ShopTestHomePage } from '../../../../shared/pages/shoptest-home.page';

When('I navigate to the home page', async function (this: CustomWorld) {
  const homePage = new ShopTestHomePage(this.page);
  const selectedVersion = (this.data['shoptestVersion'] as 1 | 2 | 3 | undefined) ?? 3;

  const start = Date.now();
  await homePage.goto(selectedVersion);
  await this.page.waitForLoadState('load');
  this.data['loadTime'] = Date.now() - start;
});

Then('the page should load within {int} milliseconds', async function (this: CustomWorld, maxMs: number) {
  const loadTime = this.data['loadTime'] as number;
  expect(loadTime).toBeLessThanOrEqual(maxMs);
});
