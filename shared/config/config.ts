import 'dotenv/config';

/**
 * Generic framework configuration.
 * App-specific behavior should stay outside this file.
 */
export const config = {
  baseUrl:
    process.env.BASE_URL ?? 'https://wmxrwq14uc.execute-api.us-east-1.amazonaws.com/Prod/Account/Login',
  apiBaseUrl: process.env.API_BASE_URL ?? 'https://wmxrwq14uc.execute-api.us-east-1.amazonaws.com/Prod',

  credentials: {
    username: process.env.PAYLOCITY_USERNAME ?? process.env.TEST_USERNAME ?? 'test_user',
    password: process.env.PAYLOCITY_PASSWORD ?? process.env.TEST_PASSWORD ?? 'test_password',
  },

  apiAuth: {
    token: process.env.API_AUTH_TOKEN ?? '',
    username: process.env.API_AUTH_USERNAME ?? '',
    password: process.env.API_AUTH_PASSWORD ?? '',
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
