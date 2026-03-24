import { test, expect } from '@playwright/test';
import { ShopTestHomePage } from '../../../shared/pages/shoptest-home.page';

const MAX_LOAD_TIME_MS = Number(process.env.MAX_LOAD_TIME_MS ?? 5000);
const SHOPTEST_VERSION = (Number(process.env.SHOPTEST_VERSION ?? 3) || 3) as 1 | 2 | 3;

test.describe('Template Performance', () => {
  test('home page loads within budget', async ({ page }) => {
    const homePage = new ShopTestHomePage(page);
    const start = Date.now();

    await homePage.goto(SHOPTEST_VERSION);
    await page.waitForLoadState('load');

    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThanOrEqual(MAX_LOAD_TIME_MS);
  });

  test.skip('example: add custom web-vital thresholds', async () => {
    // Template only:
    // Capture LCP, CLS, INP and compare with your SLO values.
  });
});
