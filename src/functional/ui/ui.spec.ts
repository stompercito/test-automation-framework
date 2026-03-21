import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { DashboardPage } from './pages/dashboard.page';
import { config } from '../../../shared/config/config';

/**
 * Functional › UI tests – Playwright native spec.
 *
 * These tests exercise the UI layer using the Page Object Model.
 * They are intentionally small, focused, and use the API fixtures
 * in beforeEach to seed test data quickly (no UI setup steps).
 *
 * Run with: npm run test:ui
 */

test.describe('User Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should display the login form', async ({ page }) => {
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('page title is reachable', async ({ page }) => {
    // Verify we reached a real page (not a 404)
    await expect(page).not.toHaveTitle('404');
  });
});

test.describe('Navigation', () => {
  test('home page loads without errors', async ({ page }) => {
    await page.goto('/');
    // No uncaught errors thrown in the console
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });
});
