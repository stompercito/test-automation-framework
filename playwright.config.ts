import { defineConfig, devices } from '@playwright/test';
import {
  HAS_LOCAL_SHOPTEST_REPO,
  LOCAL_SHOPTEST_REPO_PATH,
  LOCAL_SHOPTEST_URL,
} from './shared/utils/shoptest-target';

const isHeadless = process.env.HEADLESS !== 'false';
const videoMode =
  process.env.PW_VIDEO_MODE === 'on' ||
  process.env.PW_VIDEO_MODE === 'off' ||
  process.env.PW_VIDEO_MODE === 'retain-on-failure' ||
  process.env.PW_VIDEO_MODE === 'on-first-retry'
    ? process.env.PW_VIDEO_MODE
    : 'on-first-retry';

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
    baseURL: process.env.BASE_URL ?? LOCAL_SHOPTEST_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: videoMode,
    headless: isHeadless,
  },
  webServer:
    !process.env.BASE_URL && HAS_LOCAL_SHOPTEST_REPO
      ? {
          command: 'npm run dev -- --host 127.0.0.1 --port 4173',
          cwd: LOCAL_SHOPTEST_REPO_PATH,
          url: LOCAL_SHOPTEST_URL,
          reuseExistingServer: true,
          timeout: 120_000,
        }
      : undefined,
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
