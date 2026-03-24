import { test, expect } from '@playwright/test';
import { ShopTestHomePage } from '../../../shared/pages/shoptest-home.page';

const SHOPTEST_VERSION = (Number(process.env.SHOPTEST_VERSION ?? 3) || 3) as 1 | 2 | 3;

test.describe('Template Accessibility', () => {
  test('page has a title', async ({ page }) => {
    const homePage = new ShopTestHomePage(page);
    await homePage.goto(SHOPTEST_VERSION);

    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test.skip('example: add accessibility engine checks', async () => {
    // Template only:
    // Integrate axe or your preferred tooling.
    // Assert on violations by severity.
  });
});
