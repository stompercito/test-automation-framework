import { expect, test } from '@playwright/test';
import { PaylocityLoginPage } from '../../../shared/pages/paylocity-login.page';

const MAX_LOAD_TIME_MS = Number(process.env.MAX_LOAD_TIME_MS ?? 5000);

test.describe('Performance smoke scaffold', () => {
  test('login page loads within budget', async ({ page }) => {
    const login = new PaylocityLoginPage(page);
    const start = Date.now();

    await login.goto();
    await page.waitForLoadState('load');

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThanOrEqual(MAX_LOAD_TIME_MS);
  });

  test('TODO: API performance wrapper', async () => {
    // TODO: implement tagged perf API smoke with p95 budgets.
  });
});
