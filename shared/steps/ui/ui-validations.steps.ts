import { Given, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../fixtures/world';
import { EmployeesClient } from '../../clients/employees.client';
import { buildEmployeePayload, EmployeePayload } from '../../test-data/employee.builder';
import { calculateCompensation, parseCurrencyLikeValue } from '../../utils/payroll';
import { getDashboard, requireSelectedEmployeeId, requireSelectedEmployeePayload } from './ui-step-utils';

const dashboardLookupTimeoutMs = 15_000;
const apiLookupTimeoutMs = 10_000;
const retryIntervalMs = 750;
const reloadIntervalMs = 4_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findPersistedEmployeeByPayload(
  employees: Array<{ id?: string; username?: string; firstName?: string; lastName?: string }>,
  payload: EmployeePayload,
) {
  const firstName = payload.firstName.trim();
  const lastName = payload.lastName.trim();

  return employees.find((employee) => {
    if (payload.username && employee.username === payload.username) {
      return true;
    }

    return employee.firstName === firstName && employee.lastName === lastName;
  });
}

async function reloadDashboard(world: CustomWorld) {
  if (!world.page || world.page.isClosed()) {
    return;
  }

  const dashboard = getDashboard(world);
  await world.page.reload();
  await dashboard.assertLoaded();
}

async function waitForDefinedWithRefresh<T>(
  world: CustomWorld,
  resolver: () => Promise<T | undefined>,
  message: string,
  timeout = dashboardLookupTimeoutMs,
): Promise<T> {
  const startedAt = Date.now();
  let lastReloadAt = startedAt;

  while (Date.now() - startedAt < timeout) {
    const resolved = await resolver();
    if (resolved !== undefined) {
      return resolved;
    }

    if (world.page && !world.page.isClosed() && Date.now() - lastReloadAt >= reloadIntervalMs) {
      await reloadDashboard(world);
      lastReloadAt = Date.now();
      continue;
    }

    await sleep(retryIntervalMs);
  }

  throw new Error(message);
}

async function waitForEmployeeIdByPayload(
  world: CustomWorld,
  employeesClient: EmployeesClient,
  payload: EmployeePayload,
): Promise<string | undefined> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < apiLookupTimeoutMs) {
    const response = await employeesClient.getAll();
    if (response.status === 200 && Array.isArray(response.body)) {
      const matchedEmployee = findPersistedEmployeeByPayload(response.body, payload);
      if (matchedEmployee?.id) {
        world.data['selectedEmployeeId'] = matchedEmployee.id;
        world.data['selectedEmployeePayload'] = payload;
        return matchedEmployee.id;
      }
    }

    await sleep(retryIntervalMs);
  }

  return undefined;
}

async function resolveEmployeeRowContext(world: CustomWorld) {
  const dashboard = getDashboard(world);
  const employeesClient = new EmployeesClient(world.apiContext);
  const payload =
    (world.data['selectedEmployeePayload'] as EmployeePayload | undefined) ??
    (world.data['uiCreatedPayload'] as EmployeePayload | undefined) ??
    requireSelectedEmployeePayload(world);

  let employeeId = world.data['selectedEmployeeId'] as string | undefined;

  if (!employeeId) {
    employeeId = await waitForEmployeeIdByPayload(world, employeesClient, payload);
  }

  if (!employeeId) {
    const matchedByName = await waitForDefinedWithRefresh(
      world,
      async () =>
        (await dashboard.findStructuredRowByFullName(payload.firstName, payload.lastName)) ??
        (await dashboard.findStructuredRowContainingNames(payload.firstName, payload.lastName)),
      `Expected employee "${payload.firstName} ${payload.lastName}" to appear in the table so its row could be validated.`,
    );

    employeeId = matchedByName.id;
    world.data['selectedEmployeeId'] = employeeId;
    world.data['selectedEmployeePayload'] = payload;
  }

  const row = await waitForDefinedWithRefresh(
    world,
    async () => dashboard.findStructuredRowById(employeeId!),
    `Expected employee id "${employeeId}" to appear in the dashboard table for validation.`,
  );

  return {
    dashboard,
    employeeId,
    payload,
    row,
  };
}

function rowMatchesExpectedValues(
  row: {
    firstName: string;
    lastName: string;
    dependants: string;
    salary: string;
    gross: string;
    benefitsCost: string;
    net: string;
  } | undefined,
  payload: EmployeePayload,
) {
  if (!row) {
    return false;
  }

  const expected = calculateCompensation(payload.dependants);
  const displayedNames = [row.firstName, row.lastName];
  const actualSalary = parseCurrencyLikeValue(row.salary);
  const actualGross = parseCurrencyLikeValue(row.gross);
  const actualBenefits = parseCurrencyLikeValue(row.benefitsCost);
  const actualNet = parseCurrencyLikeValue(row.net);

  return Boolean(
    displayedNames.includes(payload.firstName) &&
    displayedNames.includes(payload.lastName) &&
    row.dependants === String(payload.dependants) &&
    Math.abs(actualSalary - expected.annualSalary) <= 0.01 &&
    Math.abs(actualGross - expected.grossPerPaycheck) <= 0.01 &&
    Math.abs(actualBenefits - expected.benefitsCostPerPaycheck) <= 0.01 &&
    Math.abs(actualNet - expected.netPerPaycheck) <= 0.01,
  );
}

Given('an employee exists with dependants {int} via API', async function (this: CustomWorld, dependants: number) {
  const client = new EmployeesClient(this.apiContext);
  const payload = buildEmployeePayload({ dependants });
  const response = await client.create(payload);

  expect(response.status).toBe(200);
  this.trackEmployeeId(response.body.id);
  this.data['selectedEmployeeId'] = response.body.id;
  this.data['selectedEmployeePayload'] = payload;

  // If the dashboard is already open, reload so the just-created employee is reflected in the table.
  if (this.page && !this.page.isClosed()) {
    const dashboard = getDashboard(this);
    const currentUrl = this.page.url().toLowerCase();
    if (currentUrl.includes('/benefits')) {
      await reloadDashboard(this);
      await waitForDefinedWithRefresh(
        this,
        async () => dashboard.findStructuredRowById(response.body.id),
        `Expected seeded employee id "${response.body.id}" to appear in the dashboard after API creation.`,
      );
    }
  }
});

Given('there are no employees in the system', async function (this: CustomWorld) {
  const client = new EmployeesClient(this.apiContext);
  const allEmployeesResponse = await client.getAll();

  if (allEmployeesResponse.status === 200 && Array.isArray(allEmployeesResponse.body)) {
    for (const employee of allEmployeesResponse.body) {
      if (employee?.id) {
        await client.deleteById(employee.id);
      }
    }
  }

  delete this.data['selectedEmployeeId'];
  delete this.data['selectedEmployeePayload'];
  delete this.data['uiCreatedPayload'];

  if (this.page && !this.page.isClosed() && this.page.url().toLowerCase().includes('/benefits')) {
    await reloadDashboard(this);
  }
});

Given('multiple employees exist via API', async function (this: CustomWorld) {
  const client = new EmployeesClient(this.apiContext);
  const seededPayloads = [
    buildEmployeePayload({ dependants: 0 }),
    buildEmployeePayload({ dependants: 1 }),
    buildEmployeePayload({ dependants: 2 }),
  ];
  const seededEmployees: Array<{ id: string; payload: EmployeePayload }> = [];

  for (const payload of seededPayloads) {
    const response = await client.create(payload);
    expect(response.status).toBe(200);
    this.trackEmployeeId(response.body.id);
    seededEmployees.push({ id: response.body.id, payload });
  }

  const [selectedEmployee, ...remainingEmployees] = seededEmployees;
  this.data['selectedEmployeeId'] = selectedEmployee.id;
  this.data['selectedEmployeePayload'] = selectedEmployee.payload;
  this.data['remainingSeededEmployeeIds'] = remainingEmployees.map((employee) => employee.id);
  this.data['remainingSeededEmployeePayloads'] = remainingEmployees.map((employee) => employee.payload);

  if (this.page && !this.page.isClosed() && this.page.url().toLowerCase().includes('/benefits')) {
    await reloadDashboard(this);
    await waitForDefinedWithRefresh(
      this,
      async () => getDashboard(this).findStructuredRowById(selectedEmployee.id),
      `Expected selected seeded employee id "${selectedEmployee.id}" to appear in the dashboard after API creation.`,
    );

    for (const employee of remainingEmployees) {
      await waitForDefinedWithRefresh(
        this,
        async () => getDashboard(this).findStructuredRowById(employee.id),
        `Expected remaining seeded employee id "${employee.id}" to appear in the dashboard after API creation.`,
      );
    }
  }
});

Then(
  'the employee row should appear in the table with the expected values and business-rule calculations',
  async function (this: CustomWorld) {
  const { dashboard, employeeId, payload } = await resolveEmployeeRowContext(this);

  const rowMatchesBeforeReload = await expect
    .poll(
      async () => rowMatchesExpectedValues(await dashboard.findStructuredRowById(employeeId), payload),
      { timeout: 5000 },
    )
    .toBeTruthy()
    .then(() => true)
    .catch(() => false);

  if (!rowMatchesBeforeReload && this.page && !this.page.isClosed()) {
    await this.page.reload();
    await dashboard.assertLoaded();
  }

  await expect
    .poll(
      async () => rowMatchesExpectedValues(await dashboard.findStructuredRowById(employeeId), payload),
      {
        message: `Expected employee id "${employeeId}" to show the expected values and calculations in the dashboard row.`,
        timeout: 15000,
      },
    )
    .toBeTruthy();

  const row = await dashboard.findStructuredRowById(employeeId);
  expect(row).toBeDefined();

  const expected = calculateCompensation(payload.dependants);
  const actualSalary = parseCurrencyLikeValue(row!.salary);
  const actualGross = parseCurrencyLikeValue(row!.gross);
  const actualBenefits = parseCurrencyLikeValue(row!.benefitsCost);
  const actualNet = parseCurrencyLikeValue(row!.net);

  const debugPayload = {
    employeeId,
    employee: {
      id: {
        expected: employeeId,
        actual: row!.id,
      },
      firstName: {
        expected: payload.firstName,
        actual: row!.firstName,
      },
      lastName: {
        expected: payload.lastName,
        actual: row!.lastName,
      },
      dependants: {
        expected: String(payload.dependants),
        actual: row!.dependants,
      },
    },
    columns: {
      salary: {
        expected: Number(expected.annualSalary.toFixed(2)),
        actual: Number(actualSalary.toFixed(2)),
        rawUiValue: row!.salary,
      },
      grossPay: {
        expected: Number(expected.grossPerPaycheck.toFixed(2)),
        actual: Number(actualGross.toFixed(2)),
        rawUiValue: row!.gross,
      },
      benefitsCost: {
        expected: Number(expected.benefitsCostPerPaycheck.toFixed(2)),
        actual: Number(actualBenefits.toFixed(2)),
        rawUiValue: row!.benefitsCost,
      },
      netPay: {
        expected: Number(expected.netPerPaycheck.toFixed(2)),
        actual: Number(actualNet.toFixed(2)),
        rawUiValue: row!.net,
      },
    },
  };

  await this.attach(JSON.stringify(debugPayload, null, 2), 'application/json');

  expect(row!.id, `Id mismatch. Expected ${employeeId}, got ${row!.id}.`).toBe(employeeId);
  const displayedNames = [row!.firstName, row!.lastName];
  expect(
    displayedNames.includes(payload.firstName),
    `Expected employee first name "${payload.firstName}" to be present in the row values ${displayedNames.join(' / ')}, regardless of current column order.`,
  ).toBeTruthy();
  expect(
    displayedNames.includes(payload.lastName),
    `Expected employee last name "${payload.lastName}" to be present in the row values ${displayedNames.join(' / ')}, regardless of current column order.`,
  ).toBeTruthy();
  expect(
    row!.dependants,
    `Dependants mismatch. Expected ${payload.dependants}, got ${row!.dependants}.`,
  ).toBe(String(payload.dependants));
  expect(
    Math.abs(actualSalary - expected.annualSalary) <= 0.01,
    `Salary mismatch. Expected ${expected.annualSalary.toFixed(2)}, got ${actualSalary.toFixed(2)}.`,
  ).toBeTruthy();
  expect(
    Math.abs(actualGross - expected.grossPerPaycheck) <= 0.01,
    `Gross Pay mismatch. Expected ${expected.grossPerPaycheck.toFixed(2)}, got ${actualGross.toFixed(2)}.`,
  ).toBeTruthy();
  expect(
    Math.abs(actualBenefits - expected.benefitsCostPerPaycheck) <= 0.01,
    `Benefits Cost mismatch. Expected ${expected.benefitsCostPerPaycheck.toFixed(2)}, got ${actualBenefits.toFixed(2)}.`,
  ).toBeTruthy();
  expect(
    Math.abs(actualNet - expected.netPerPaycheck) <= 0.01,
    `Net Pay mismatch. Expected ${expected.netPerPaycheck.toFixed(2)}, got ${actualNet.toFixed(2)}.`,
  ).toBeTruthy();
},
);

Then(
  'payroll columns Gross Pay, Benefits Cost, and Net Pay should match expected business-rule values for that employee',
  async function (this: CustomWorld) {
  const { employeeId, payload, row } = await resolveEmployeeRowContext(this);
  const expected = calculateCompensation(payload.dependants);
  const actualSalary = parseCurrencyLikeValue(row.salary);
  const actualGross = parseCurrencyLikeValue(row.gross);
  const actualBenefits = parseCurrencyLikeValue(row.benefitsCost);
  const actualNet = parseCurrencyLikeValue(row.net);

  await this.attach(
    JSON.stringify(
      {
        employeeId,
        dependants: payload.dependants,
        columns: {
          salary: {
            expected: Number(expected.annualSalary.toFixed(2)),
            actual: Number(actualSalary.toFixed(2)),
            rawUiValue: row.salary,
          },
          grossPay: {
            expected: Number(expected.grossPerPaycheck.toFixed(2)),
            actual: Number(actualGross.toFixed(2)),
            rawUiValue: row.gross,
          },
          benefitsCost: {
            expected: Number(expected.benefitsCostPerPaycheck.toFixed(2)),
            actual: Number(actualBenefits.toFixed(2)),
            rawUiValue: row.benefitsCost,
          },
          netPay: {
            expected: Number(expected.netPerPaycheck.toFixed(2)),
            actual: Number(actualNet.toFixed(2)),
            rawUiValue: row.net,
          },
        },
      },
      null,
      2,
    ),
    'application/json',
  );

  expect(
    Math.abs(actualSalary - expected.annualSalary) <= 0.01,
    `Salary mismatch. Expected ${expected.annualSalary.toFixed(2)}, got ${actualSalary.toFixed(2)}.`,
  ).toBeTruthy();
  expect(
    Math.abs(actualGross - expected.grossPerPaycheck) <= 0.01,
    `Gross Pay mismatch. Expected ${expected.grossPerPaycheck.toFixed(2)}, got ${actualGross.toFixed(2)}.`,
  ).toBeTruthy();
  expect(
    Math.abs(actualBenefits - expected.benefitsCostPerPaycheck) <= 0.01,
    `Benefits Cost mismatch. Expected ${expected.benefitsCostPerPaycheck.toFixed(2)}, got ${actualBenefits.toFixed(2)}.`,
  ).toBeTruthy();
  expect(
    Math.abs(actualNet - expected.netPerPaycheck) <= 0.01,
    `Net Pay mismatch. Expected ${expected.netPerPaycheck.toFixed(2)}, got ${actualNet.toFixed(2)}.`,
  ).toBeTruthy();
},
);

Then('first and last name columns should map correctly for that employee', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const employeeId = requireSelectedEmployeeId(this);
  const payload = requireSelectedEmployeePayload(this);

  const headers = await dashboard.readHeaderLabels();
  expect(headers.map((h) => h.trim())).toEqual([
    'Id',
    'Last Name',
    'First Name',
    'Dependents',
    'Salary',
    'Gross Pay',
    'Benefits Cost',
    'Net Pay',
    'Actions',
  ]);

  const row = await dashboard.findRowById(employeeId);
  const cells = await row.locator('td').allTextContents();

  expect(cells[1]?.trim()).toBe(payload.lastName);
  expect(cells[2]?.trim()).toBe(payload.firstName);
});

Then('only the selected employee should be removed while other seeded employees remain visible', async function (
  this: CustomWorld,
) {
  const dashboard = getDashboard(this);
  const deletedEmployeeId = requireSelectedEmployeeId(this);
  const remainingEmployeeIds = (this.data['remainingSeededEmployeeIds'] as string[] | undefined) ?? [];

  await expect
    .poll(async () => dashboard.findStructuredRowById(deletedEmployeeId), {
      message: `Expected deleted employee id "${deletedEmployeeId}" to be removed from the table.`,
      timeout: 15000,
    })
    .toBeUndefined();

  for (const remainingEmployeeId of remainingEmployeeIds) {
    await expect
      .poll(async () => dashboard.findStructuredRowById(remainingEmployeeId), {
        message: `Expected remaining employee id "${remainingEmployeeId}" to stay visible after deleting another row.`,
        timeout: 15000,
      })
      .toBeDefined();
  }
});

