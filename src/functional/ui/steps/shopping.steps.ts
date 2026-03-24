import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { config } from '../../../../shared/config/config';
import { CustomWorld } from '../../../../shared/fixtures/world';
import { BenefitsDashboardPage } from '../../../../shared/pages/benefits-dashboard.page';
import { PaylocityLoginPage } from '../../../../shared/pages/paylocity-login.page';

Given('I am on the Paylocity login page', async function (this: CustomWorld) {
  const loginPage = new PaylocityLoginPage(this.page);
  await loginPage.goto();
  await loginPage.assertReady();
});

When('I login with configured credentials', async function (this: CustomWorld) {
  const loginPage = new PaylocityLoginPage(this.page);
  await loginPage.login(config.credentials.username, config.credentials.password);
});

Then('I should see the benefits dashboard', async function (this: CustomWorld) {
  const dashboard = new BenefitsDashboardPage(this.page);
  await dashboard.assertLoaded();
  expect(await dashboard.table.isVisible()).toBeTruthy();
});
