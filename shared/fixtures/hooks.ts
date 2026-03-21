import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { chromium, request } from '@playwright/test';
import { CustomWorld } from './world';
import { config } from '../config/config';

/**
 * Global lifecycle hooks shared across all BDD scenarios.
 *
 * Before each scenario  → launch browser + open a fresh context/page + API ctx
 * After each scenario   → capture screenshot on failure, close browser + API ctx
 */

BeforeAll(async function () {
  // Nothing global needed – each scenario manages its own browser instance
});

AfterAll(async function () {
  // Nothing global needed
});

Before(async function (this: CustomWorld) {
  // Launch browser for UI scenarios; API-only scenarios still get a browser
  // but never navigate, so the overhead is minimal.
  this.browser = await chromium.launch({
    headless: config.browser.headless,
    slowMo: config.browser.slowMo,
  });

  this.context = await this.browser.newContext({
    baseURL: config.baseUrl,
    ignoreHTTPSErrors: true,
  });

  this.page = await this.context.newPage();

  // Standalone API request context (no cookie jar shared with browser)
  this.apiContext = await request.newContext({
    baseURL: config.apiBaseUrl,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
});

After(async function (this: CustomWorld, scenario) {
  // Attach a screenshot to the Cucumber report on failure
  if (scenario.result?.status === 'FAILED') {
    const screenshot = await this.page.screenshot({ fullPage: true });
    await this.attach(screenshot, 'image/png');
  }

  await this.page?.close();
  await this.context?.close();
  await this.browser?.close();
  await this.apiContext?.dispose();

  // Reset data bag
  this.data = {};
});
