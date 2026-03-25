import { setDefaultTimeout, setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { APIRequestContext, Browser, BrowserContext, Page } from '@playwright/test';
import { config } from '../config/config';

export class CustomWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  apiContext!: APIRequestContext;

  data: Record<string, unknown> = {};
  createdEmployeeIds: string[] = [];

  constructor(options: IWorldOptions) {
    super(options);
  }

  trackEmployeeId(id: string): void {
    if (!this.createdEmployeeIds.includes(id)) {
      this.createdEmployeeIds.push(id);
    }
  }
}

setWorldConstructor(CustomWorld);

// Ensure Cucumber step timeout is aligned with framework configuration.
setDefaultTimeout(config.timeouts.navigation);
