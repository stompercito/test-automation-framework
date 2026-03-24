import { test, expect } from '@playwright/test';
import { ShopTestHomePage } from '../../../shared/pages/shoptest-home.page';

const SHOPTEST_VERSION = (Number(process.env.SHOPTEST_VERSION ?? 3) || 3) as 1 | 2 | 3;

test.describe('Template UI', () => {
  test('home page loads and basic elements are visible', async ({ page }) => {
    const homePage = new ShopTestHomePage(page);

    await homePage.goto(SHOPTEST_VERSION);

    await expect(homePage.heroHeading).toBeVisible();
    await expect(homePage.searchInput).toBeVisible();
  });

  test.skip('example: custom user flow', async () => {
    // Template only:
    // 1) Navigate to your page.
    // 2) Perform your business actions.
    // 3) Assert expected UI behavior.
  });
});
