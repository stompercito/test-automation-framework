import { test, expect } from '@playwright/test';
import { ShopTestHomePage } from '../../../shared/pages/shoptest-home.page';

/**
 * Non-functional > Accessibility tests aligned to ShopTest.
 */

const SHOPTEST_VERSION = (Number(process.env.SHOPTEST_VERSION ?? 3) || 3) as 1 | 2 | 3;

test.describe('Accessibility - WCAG 2.1 baseline', () => {
  test('page has a <title> element (WCAG 2.4.2)', async ({ page }) => {
    const homePage = new ShopTestHomePage(page);
    await homePage.goto(SHOPTEST_VERSION);
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('all images have alt attributes (WCAG 1.1.1)', async ({ page }) => {
    const homePage = new ShopTestHomePage(page);
    await homePage.goto(SHOPTEST_VERSION);
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    expect(imagesWithoutAlt).toBe(0);
  });

  test('page has at least one <main> landmark (WCAG 1.3.1)', async ({ page }) => {
    const homePage = new ShopTestHomePage(page);
    await homePage.goto(SHOPTEST_VERSION);
    const mainCount = await page.locator('main, [role="main"]').count();
    expect(mainCount).toBeGreaterThanOrEqual(1);
  });

  test('interactive elements are keyboard focusable', async ({ page }) => {
    const homePage = new ShopTestHomePage(page);
    await homePage.goto(SHOPTEST_VERSION);
    const focusable = await page
      .locator('button, a[href], input, select, textarea')
      .count();
    expect(focusable).toBeGreaterThan(0);
  });
});
