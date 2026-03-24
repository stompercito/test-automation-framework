import { After, Before } from '@cucumber/cucumber';
import { chromium } from '@playwright/test';
import { config } from '../../../../shared/config/config';
import { CustomWorld } from '../../../../shared/fixtures/world';

Before({ tags: '@ui' }, async function (this: CustomWorld) {
  this.browser = await chromium.launch({
    headless: config.browser.headless,
    slowMo: config.browser.slowMo,
  });

  this.context = await this.browser.newContext({
    baseURL: config.baseUrl,
    ignoreHTTPSErrors: true,
  });

  this.page = await this.context.newPage();
});

After({ tags: '@ui' }, async function (this: CustomWorld, scenario) {
  if (scenario.result?.status === 'FAILED' && this.page) {
    const screenshot = await this.page.screenshot({ fullPage: true });
    await this.attach(screenshot, 'image/png');
  }

  await this.page?.close();
  await this.context?.close();
  await this.browser?.close();
});
