import { test, expect } from '@playwright/test';
import { ShopTestHomePage } from '../../../shared/pages/shoptest-home.page';

const MAX_LOAD_TIME_MS = Number(process.env.MAX_LOAD_TIME_MS ?? 5000);
const SHOPTEST_VERSION = (Number(process.env.SHOPTEST_VERSION ?? 3) || 3) as 1 | 2 | 3;

test.describe('Performance - Navigation Timing', () => {
  test('home page loads within budget', async ({ page }) => {
    const homePage = new ShopTestHomePage(page);
    const start = Date.now();

    await homePage.goto(SHOPTEST_VERSION);
    await page.waitForLoadState('load');

    const loadTime = Date.now() - start;
    console.log(`ShopTest v${SHOPTEST_VERSION} home page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThanOrEqual(MAX_LOAD_TIME_MS);
  });

  test('navigation timing metrics are within budget', async ({ page }) => {
    const homePage = new ShopTestHomePage(page);

    await homePage.goto(SHOPTEST_VERSION);
    await page.waitForLoadState('load');

    const timing = await page.evaluate(() => {
      const entries = performance.getEntriesByType('navigation');
      const entry = entries[0] as PerformanceNavigationTiming | undefined;
      if (!entry) return null;
      return {
        domInteractive: entry.domInteractive,
        domComplete: entry.domComplete,
        loadEventEnd: entry.loadEventEnd,
      };
    });

    if (timing) {
      console.log(`DOM Interactive: ${timing.domInteractive.toFixed(0)}ms`);
      console.log(`DOM Complete: ${timing.domComplete.toFixed(0)}ms`);
      console.log(`Load Event End: ${timing.loadEventEnd.toFixed(0)}ms`);
      expect(timing.loadEventEnd).toBeLessThanOrEqual(MAX_LOAD_TIME_MS);
    }
  });
});
