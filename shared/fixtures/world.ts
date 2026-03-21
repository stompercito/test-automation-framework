import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, APIRequestContext, chromium, request } from '@playwright/test';
import { config } from '../config/config';

/**
 * CustomWorld is the shared context object injected into every step definition.
 *
 * It exposes:
 *  - Playwright Browser / BrowserContext / Page for UI steps
 *  - Playwright APIRequestContext for lightweight API calls in hooks / steps
 *  - A generic `data` bag for sharing state between steps within a scenario
 *
 * This satisfies ISTQB FL requirement for a common test execution environment
 * and avoids global state between scenarios.
 */
export class CustomWorld extends World {
  // ── UI surfaces ─────────────────────────────────────────────────────────────
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  // ── API surface ──────────────────────────────────────────────────────────────
  apiContext!: APIRequestContext;

  // ── Shared data bag (scenario-scoped) ────────────────────────────────────────
  data: Record<string, unknown> = {};

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(CustomWorld);
