import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../../../shared/fixtures/world';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';

/**
 * Step definitions for the User Authentication feature.
 *
 * Note: API hooks (Before steps) can call the API client to seed test data
 * instead of doing everything through the UI, keeping scenarios fast.
 */

Given('the user is on the login page', async function (this: CustomWorld) {
  const loginPage = new LoginPage(this.page);
  await loginPage.goto();
});

When(
  'the user enters username {string} and password {string}',
  async function (this: CustomWorld, username: string, password: string) {
    const loginPage = new LoginPage(this.page);
    await loginPage.fill(loginPage.usernameInput, username);
    await loginPage.fill(loginPage.passwordInput, password);
    // Store for later assertions
    this.data['username'] = username;
  },
);

When('the user clicks the sign-in button', async function (this: CustomWorld) {
  const loginPage = new LoginPage(this.page);
  await loginPage.click(loginPage.submitButton);
});

Then('the user should be redirected to the dashboard', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/dashboard/);
});

Then('the dashboard should display a welcome message', async function (this: CustomWorld) {
  const dashboard = new DashboardPage(this.page);
  const text = await dashboard.getWelcomeText();
  expect(text.length).toBeGreaterThan(0);
});

Then('an error message should be displayed', async function (this: CustomWorld) {
  const loginPage = new LoginPage(this.page);
  await expect(loginPage.errorMessage).toBeVisible();
});

Then('the user should remain on the login page', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/login/);
});

Then(
  'the login result should be {string}',
  async function (this: CustomWorld, result: string) {
    if (result === 'success') {
      await expect(this.page).toHaveURL(/dashboard/);
    } else {
      await expect(this.page).toHaveURL(/login/);
    }
  },
);
