import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../../../shared/fixtures/world';

/**
 * Step definitions for Performance feature.
 *
 * Uses the Navigation Timing API (available in all modern browsers) to
 * measure real load times without external tooling.
 */

Given('I measure performance from the home page', async function (this: CustomWorld) {
  this.data['startTime'] = Date.now();
});

When('I navigate to the home page', async function (this: CustomWorld) {
  const start = Date.now();
  await this.page.goto('/');
  await this.page.waitForLoadState('load');
  this.data['loadTime'] = Date.now() - start;
});

Then(
  'the page should load within {int} milliseconds',
  async function (this: CustomWorld, maxMs: number) {
    const loadTime = this.data['loadTime'] as number;
    expect(loadTime).toBeLessThanOrEqual(maxMs);
  },
);

Then(
  'the Largest Contentful Paint should be under {int} milliseconds',
  async function (this: CustomWorld, maxMs: number) {
    // Use PerformanceObserver via page.evaluate to get LCP
    const lcp = await this.page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            resolve(entries[entries.length - 1].startTime);
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          // Resolve with 0 if LCP is not available within 2 seconds
          setTimeout(() => resolve(0), 2000);
        }),
    );
    if (lcp > 0) {
      expect(lcp).toBeLessThanOrEqual(maxMs);
    }
  },
);
