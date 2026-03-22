import { After, AfterAll, Before, BeforeAll } from '@cucumber/cucumber';
import { chromium, request } from '@playwright/test';
import { config } from '../config/config';
import { CustomWorld } from './world';

BeforeAll(async function () {
  // Scenario-scoped resources are enough for this framework.
});

AfterAll(async function () {
  // Nothing global to tear down.
});

Before(async function (this: CustomWorld) {
  this.browser = await chromium.launch({
    headless: config.browser.headless,
    slowMo: config.browser.slowMo,
  });

  this.context = await this.browser.newContext({
    baseURL: config.baseUrl,
    ignoreHTTPSErrors: true,
  });

  this.page = await this.context.newPage();
  this.apiContext = await request.newContext({
    baseURL: config.apiBaseUrl === 'mock:shoptest' ? undefined : config.apiBaseUrl,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
});

After(async function (this: CustomWorld, scenario) {
  if (scenario.result?.status === 'FAILED' && this.page) {
    const screenshot = await this.page.screenshot({ fullPage: true });
    await this.attach(screenshot, 'image/png');
  }

  await this.page?.close();
  await this.context?.close();
  await this.browser?.close();
  await this.apiContext?.dispose();

  this.data = {};
});
