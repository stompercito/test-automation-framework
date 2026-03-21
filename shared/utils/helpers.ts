import { Page } from '@playwright/test';

/**
 * Miscellaneous utility helpers available to all test layers.
 */

/** Wait for a given number of milliseconds (use sparingly – prefer explicit waits). */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Generate a unique string suffix useful for test data isolation. */
export function uniqueSuffix(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Scroll to the bottom of the page and back to the top. */
export async function scrollPage(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.evaluate(() => window.scrollTo(0, 0));
}

/** Return ISO-8601 timestamp – handy for log messages. */
export function timestamp(): string {
  return new Date().toISOString();
}
