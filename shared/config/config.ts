import 'dotenv/config';

/**
 * Central configuration object built from environment variables.
 * All test code reads configuration from this object – never directly
 * from process.env – so there is one single place to change or extend settings.
 */
export const config = {
  /** Base URL for the web application under test */
  baseUrl: process.env.BASE_URL ?? 'https://example.com',

  /** Base URL for the API under test */
  apiBaseUrl: process.env.API_BASE_URL ?? 'https://jsonplaceholder.typicode.com',

  /** Test credentials */
  credentials: {
    username: process.env.TEST_USERNAME ?? 'test_user',
    password: process.env.TEST_PASSWORD ?? 'test_password',
  },

  /** Current environment */
  environment: (process.env.ENVIRONMENT ?? 'local') as 'local' | 'staging' | 'production',

  /** Timeout values (ms) */
  timeouts: {
    default: Number(process.env.DEFAULT_TIMEOUT ?? 30_000),
    navigation: Number(process.env.NAVIGATION_TIMEOUT ?? 60_000),
  },

  /** Playwright launch options */
  browser: {
    headless: process.env.HEADLESS !== 'false',
    slowMo: Number(process.env.SLOW_MO ?? 0),
  },
} as const;
