import { Given, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../fixtures/world';
import { EmployeesClient } from '../../clients/employees.client';
import { buildEmployeePayload, EmployeePayload } from '../../test-data/employee.builder';
import { calculateCompensation, parseCurrencyLikeValue } from '../../utils/payroll';
import { getDashboard, requireSelectedEmployeeId, requireSelectedEmployeePayload } from './ui-step-utils';

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
      await this.page.reload();
      await dashboard.assertLoaded();
    }
  }
});

Then(
  'payroll columns Gross Pay, Benefits Cost, and Net Pay should match expected business-rule values for that employee',
  async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const employeeId = requireSelectedEmployeeId(this);
  const payload = requireSelectedEmployeePayload(this);

  await expect
    .poll(async () => dashboard.findStructuredRowById(employeeId))
    .toBeDefined();

  const row = await dashboard.findStructuredRowById(employeeId);
  expect(row).toBeDefined();

  const expected = calculateCompensation(payload.dependants);
  const actualGross = parseCurrencyLikeValue(row!.gross);
  const actualBenefits = parseCurrencyLikeValue(row!.benefitsCost);
  const actualNet = parseCurrencyLikeValue(row!.net);

  const debugPayload = {
    employeeId,
    dependants: payload.dependants,
    columns: {
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

