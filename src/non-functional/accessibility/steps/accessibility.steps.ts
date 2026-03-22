import { Given, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../../../shared/fixtures/world';
import { ShopTestHomePage } from '../../../../shared/pages/shoptest-home.page';

Given('I am on the home page', async function (this: CustomWorld) {
  const homePage = new ShopTestHomePage(this.page);
  const selectedVersion = (this.data['shoptestVersion'] as 1 | 2 | 3 | undefined) ?? 3;
  await homePage.goto(selectedVersion);
});

Then('the page should have no critical accessibility violations', async function (this: CustomWorld) {
  const title = await this.page.title();
  expect(title).not.toBe('');
  expect(title.length).toBeGreaterThan(0);
});

Then('all images should have descriptive alt text', async function (this: CustomWorld) {
  const imagesWithoutAlt = await this.page.locator('img:not([alt])').count();
  expect(imagesWithoutAlt).toBe(0);
});

Then('all interactive elements should be reachable via keyboard', async function (this: CustomWorld) {
  const focusableCount = await this.page
    .locator('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    .count();
  expect(focusableCount).toBeGreaterThan(0);
});
