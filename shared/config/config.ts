import 'dotenv/config';
import { LOCAL_SHOPTEST_URL, PUBLISHED_SHOPTEST_URL } from '../utils/shoptest-target';

/**
 * Generic framework configuration.
 * App-specific behavior should stay outside this file.
 */
export const config = {
  baseUrl: process.env.BASE_URL ?? LOCAL_SHOPTEST_URL,
  publishedBaseUrl: PUBLISHED_SHOPTEST_URL,
  apiBaseUrl: process.env.API_BASE_URL ?? 'mock:shoptest',

  credentials: {
    username: process.env.TEST_USERNAME ?? 'test_user',
    password: process.env.TEST_PASSWORD ?? 'test_password',
  },

  environment: (process.env.ENVIRONMENT ?? 'local') as 'local' | 'staging' | 'production',

  timeouts: {
    default: Number(process.env.DEFAULT_TIMEOUT ?? 30_000),
    navigation: Number(process.env.NAVIGATION_TIMEOUT ?? 60_000),
  },

  browser: {
    headless: process.env.HEADLESS !== 'false',
    slowMo: Number(process.env.SLOW_MO ?? 0),
  },
} as const;
