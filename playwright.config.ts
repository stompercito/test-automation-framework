import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';
import { config } from './shared/config/config';

const isHeadless = config.browser.headless;
const videoMode =
  process.env.PW_VIDEO_MODE === 'on' ||
  process.env.PW_VIDEO_MODE === 'off' ||
  process.env.PW_VIDEO_MODE === 'retain-on-failure' ||
  process.env.PW_VIDEO_MODE === 'on-first-retry'
    ? process.env.PW_VIDEO_MODE
    : 'retain-on-failure';

export default defineConfig({
  testDir: './src',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { outputFolder: 'reports/playwright-html', open: 'never' }],
    ['list'],
    ['allure-playwright', { resultsDir: 'reports/allure-results' }],
  ],
  use: {
    baseURL: config.baseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: videoMode,
    headless: isHeadless,
  },
  projects: [
    {
      name: 'functional:ui',
      testDir: './src/functional/ui',
      testMatch: '**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'functional:api',
      testDir: './src/functional/api',
      testMatch: '**/*.spec.ts',
    },
    {
      name: 'non-functional:accessibility',
      testDir: './src/non-functional/accessibility',
      testMatch: '**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'non-functional:performance',
      testDir: './src/non-functional/performance',
      testMatch: '**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
