import { Given, Then, When } from '@cucumber/cucumber';
import { config } from '../../config/config';
import { CustomWorld } from '../../fixtures/world';
import { BenefitsDashboardPage } from '../../pages/benefits-dashboard.page';
import { PaylocityLoginPage } from '../../pages/paylocity-login.page';

function getDashboard(world: CustomWorld): BenefitsDashboardPage {
  let dashboard = world.data['dashboardPage'] as BenefitsDashboardPage | undefined;
  if (!dashboard) {
    dashboard = new BenefitsDashboardPage(world.page);
    world.data['dashboardPage'] = dashboard;
  }
  return dashboard;
}

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
  const dashboard = getDashboard(this);
  await dashboard.assertLoaded();
});

Given('I am authenticated on the benefits dashboard', async function (this: CustomWorld) {
  const loginPage = new PaylocityLoginPage(this.page);
  const dashboard = getDashboard(this);

  await loginPage.goto();
  await loginPage.login(config.credentials.username, config.credentials.password);
  await dashboard.assertLoaded();
});
