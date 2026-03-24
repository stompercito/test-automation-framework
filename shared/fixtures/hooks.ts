import { After, Before } from '@cucumber/cucumber';
import { chromium, request } from '@playwright/test';
import { config } from '../config/config';
import { CustomWorld } from './world';
import { EmployeesClient } from '../clients/employees.client';
import { buildEmployeePayload } from '../test-data/employee.builder';

let performanceWarningShown = false;

Before(async function (this: CustomWorld) {
  this.apiContext = await request.newContext({
    baseURL: config.apiBaseUrl,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
});

Before({ tags: '@ui' }, async function (this: CustomWorld) {
  this.browser = await chromium.launch({
    headless: config.browser.headless,
    slowMo: config.browser.slowMo,
  });

  this.context = await this.browser.newContext({
    baseURL: config.baseUrl,
    ignoreHTTPSErrors: true,
  });

  this.page = await this.context.newPage();
});

Before({ tags: '@requiresEmployee' }, async function (this: CustomWorld, { pickle }) {
  if (this.data['selectedEmployeeId']) {
    return;
  }

  const scenarioTags = (pickle?.tags ?? []).map((tag: { name: string }) => tag.name);
  const dependantsTag = scenarioTags.find((tag: string) => tag.startsWith('@seedDependants_'));
  const firstNameTag = scenarioTags.find((tag: string) => tag.startsWith('@seedFirst_'));
  const lastNameTag = scenarioTags.find((tag: string) => tag.startsWith('@seedLast_'));

  const dependants =
    dependantsTag ? Number(dependantsTag.replace('@seedDependants_', '')) : 1;
  const firstName = firstNameTag ? firstNameTag.replace('@seedFirst_', '') : undefined;
  const lastName = lastNameTag ? lastNameTag.replace('@seedLast_', '') : undefined;

  const client = new EmployeesClient(this.apiContext);
  const payload = buildEmployeePayload({
    dependants: Number.isFinite(dependants) ? dependants : 1,
    ...(firstName ? { firstName } : {}),
    ...(lastName ? { lastName } : {}),
  });
  const response = await client.create(payload);

  if (response.status !== 200) {
    throw new Error(`Failed to seed employee prerequisite. Status: ${response.status}`);
  }

  this.trackEmployeeId(response.body.id);
  this.data['selectedEmployeeId'] = response.body.id;
  this.data['selectedEmployeePayload'] = payload;
});

Before({ tags: '@performance' }, async function () {
  if (performanceWarningShown) {
    return;
  }

  console.warn(
    '[Cucumber Warning] Performance thresholds are environment-sensitive. Validate baseline before treating failures as regressions.',
  );
  performanceWarningShown = true;
});

After({ tags: '@ui' }, async function (this: CustomWorld, scenario) {
  if (scenario.result?.status === 'FAILED' && this.page) {
    const screenshot = await this.page.screenshot({ fullPage: true });
    await this.attach(screenshot, 'image/png');
  }

  await this.page?.close();
  await this.context?.close();
  await this.browser?.close();
});

After(async function (this: CustomWorld) {
  if (this.apiContext && this.createdEmployeeIds.length > 0) {
    const employeesClient = new EmployeesClient(this.apiContext);
    for (const id of this.createdEmployeeIds) {
      try {
        await employeesClient.deleteById(id);
      } catch {
        // Best-effort cleanup to avoid masking test failures.
      }
    }
  }

  await this.apiContext?.dispose();

  this.data = {};
  this.createdEmployeeIds = [];
});
