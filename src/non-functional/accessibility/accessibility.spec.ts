import { expect, test } from '@playwright/test';
import { config } from '../../../shared/config/config';
import { PaylocityLoginPage } from '../../../shared/pages/paylocity-login.page';

test.describe('Accessibility smoke scaffold', () => {
  test('login page basic accessibility hook point', async ({ page }) => {
    const loginPage = new PaylocityLoginPage(page);
    await loginPage.goto();
    await loginPage.assertReady();

    const title = await page.title();
    expect(title).toBeTruthy();

    // TODO: integrate axe-core and enforce WCAG thresholds.
  });

  test('TODO: authenticated dashboard a11y scan', async () => {
    test.skip(!config.credentials.username || !config.credentials.password, 'Credentials required for login');
    // TODO: login + run component-level scan in dashboard and modals.
  });
});
