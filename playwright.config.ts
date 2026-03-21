import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright configuration file.
 * Defines projects for:
 *  - functional:ui  – browser-driven UI tests using Page Object Model
 *  - functional:api – lightweight API tests (no browser)
 *  - non-functional:accessibility – axe-based a11y audits
 */
export default defineConfig({
  // Root directory for test discovery
  testDir: './src',

  // Maximum time one test can run
  timeout: 60_000,

  // Retry failed tests once in CI
  retries: process.env.CI ? 1 : 0,

  // Parallel workers
  workers: process.env.CI ? 2 : undefined,

  // Reporter: always produce an HTML dashboard + a line reporter in the console
  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['list'],
    ['allure-playwright', { resultsDir: 'reports/allure-results' }],
  ],

  // Shared settings for all projects
  use: {
    baseURL: process.env.BASE_URL ?? 'https://example.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    // ── Functional › UI ──────────────────────────────────────────────────────
    {
      name: 'functional:ui',
      testDir: './src/functional/ui',
      testMatch: '**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
    },

    // ── Functional › API ─────────────────────────────────────────────────────
    {
      name: 'functional:api',
      testDir: './src/functional/api',
      testMatch: '**/*.spec.ts',
      use: {
        // No browser needed for API tests
        baseURL: process.env.API_BASE_URL ?? 'https://jsonplaceholder.typicode.com',
      },
    },

    // ── Non-Functional › Accessibility ───────────────────────────────────────
    {
      name: 'non-functional:accessibility',
      testDir: './src/non-functional/accessibility',
      testMatch: '**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
    },

    // ── Non-Functional › Performance ─────────────────────────────────────────
    {
      name: 'non-functional:performance',
      testDir: './src/non-functional/performance',
      testMatch: '**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
    },
  ],
});
