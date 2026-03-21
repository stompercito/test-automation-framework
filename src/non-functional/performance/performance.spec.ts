import { test, expect } from '@playwright/test';

/**
 * Non-Functional › Performance tests – Playwright native spec.
 *
 * Uses the browser's Navigation Timing API to measure load times.
 * All thresholds are configurable via environment variables.
 *
 * Run with: npm run test:performance
 */

const MAX_LOAD_TIME_MS = Number(process.env.MAX_LOAD_TIME_MS ?? 5000);
const MAX_LCP_MS = Number(process.env.MAX_LCP_MS ?? 2500);

test.describe('Performance – Navigation Timing', () => {
  test('home page loads within budget', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('load');
    const loadTime = Date.now() - start;

    console.log(`Home page load time: ${loadTime}ms (budget: ${MAX_LOAD_TIME_MS}ms)`);
    expect(loadTime).toBeLessThanOrEqual(MAX_LOAD_TIME_MS);
  });

  test('navigation timing metrics are within budget', async ({ page }) => {
    await page.goto('/');
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
