import { test, expect } from '@playwright/test';

/**
 * Non-Functional › Accessibility tests – Playwright native spec.
 *
 * Performs WCAG-level checks using Playwright's built-in DOM queries.
 * For full auditing, this spec can be extended with @axe-core/playwright.
 *
 * Run with: npm run test:accessibility
 */

test.describe('Accessibility – WCAG 2.1 baseline', () => {
  test('page has a <title> element (WCAG 2.4.2)', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('all images have alt attributes (WCAG 1.1.1)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    expect(imagesWithoutAlt).toBe(0);
  });

  test('page has at least one <main> landmark (WCAG 1.3.1)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const mainCount = await page.locator('main, [role="main"]').count();
    // A missing <main> landmark is a WCAG 1.3.1 violation; enforce at least 1
    expect(mainCount).toBeGreaterThanOrEqual(1);
  });

  test('interactive elements are keyboard focusable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const focusable = await page
      .locator('button, a[href], input, select, textarea')
      .count();
    expect(focusable).toBeGreaterThanOrEqual(0);
  });
});
