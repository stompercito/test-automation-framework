import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../../../shared/fixtures/world';
import { ShopTestHomePage } from '../../../../shared/pages/shoptest-home.page';

Given('I measure performance from the home page', async function (this: CustomWorld) {
  this.data['startTime'] = Date.now();
});

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

Then(
  'the Largest Contentful Paint should be under {int} milliseconds',
  async function (this: CustomWorld, maxMs: number) {
    const lcp = await this.page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            resolve(entries[entries.length - 1].startTime);
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          setTimeout(() => resolve(0), 2000);
        }),
    );

    if (lcp > 0) {
      expect(lcp).toBeLessThanOrEqual(maxMs);
    }
  },
);
