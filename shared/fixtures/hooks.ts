import { After, AfterStep, Before } from '@cucumber/cucumber';
import { chromium, request } from '@playwright/test';
import { config } from '../config/config';
import { CustomWorld } from './world';
import { EmployeesClient } from '../clients/employees.client';
import { buildEmployeePayload } from '../test-data/employee.builder';

let performanceWarningShown = false;

async function attachFailureScreenshot(world: CustomWorld): Promise<void> {
  const alreadyAttached = world.data['failureScreenshotAttached'] === true;
  if (alreadyAttached || !world.page || world.page.isClosed()) {
    return;
  }

  const screenshot = await world.page.screenshot({ fullPage: true });
  await world.attach(screenshot, 'image/png');
  world.data['failureScreenshotAttached'] = true;
}

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
  const launchOptions = {
    headless: config.browser.headless,
    slowMo: config.browser.slowMo,
    ...(config.browser.channel ? { channel: config.browser.channel as 'chrome' | 'msedge' } : {}),
  };

  try {
    this.browser = await chromium.launch(launchOptions);
  } catch (error) {
    if (config.browser.channel) {
      throw error;
    }

    // Fallback for environments where bundled headless shell is blocked by OS/security policy.
    try {
      this.browser = await chromium.launch({ ...launchOptions, channel: 'msedge' });
    } catch {
      this.browser = await chromium.launch({ ...launchOptions, channel: 'chrome' });
    }
  }

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

After({ tags: '@ui' }, async function (this: CustomWorld) {
  await this.page?.close();
  await this.context?.close();
  await this.browser?.close();
});

AfterStep({ tags: '@ui' }, async function (this: CustomWorld, { result }) {
  if (result?.status === 'FAILED') {
    await attachFailureScreenshot(this);
  }
});

After(async function (this: CustomWorld) {
  if (this.apiContext) {
    const employeesClient = new EmployeesClient(this.apiContext);
    const idsToDelete = new Set<string>(this.createdEmployeeIds);

    // Global cleanup: keep scenarios isolated by removing any remaining employees.
    try {
      const allEmployeesResponse = await employeesClient.getAll();
      if (allEmployeesResponse.status === 200 && Array.isArray(allEmployeesResponse.body)) {
        for (const employee of allEmployeesResponse.body) {
          if (employee?.id) {
            idsToDelete.add(employee.id);
          }
        }
      }
    } catch {
      // Best-effort cleanup only.
    }

    for (const id of idsToDelete) {
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
