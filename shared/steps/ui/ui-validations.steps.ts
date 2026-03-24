import { Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../fixtures/world';
import { EmployeePayload } from '../../test-data/employee.builder';
import { calculateCompensation, parseCurrencyLikeValue } from '../../utils/payroll';
import { getDashboard, requireSelectedEmployeeId, requireSelectedEmployeePayload } from './ui-step-utils';

Then('payroll columns should match business rules for that employee', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const employeeId = requireSelectedEmployeeId(this);
  const payload = requireSelectedEmployeePayload(this);

  const row = await dashboard.findStructuredRowById(employeeId);
  expect(row).toBeDefined();

  const expected = calculateCompensation(payload.dependants);
  expect(parseCurrencyLikeValue(row!.gross)).toBeCloseTo(expected.grossPerPaycheck, 2);
  expect(parseCurrencyLikeValue(row!.benefitsCost)).toBeCloseTo(expected.benefitsCostPerPaycheck, 2);
  expect(parseCurrencyLikeValue(row!.net)).toBeCloseTo(expected.netPerPaycheck, 2);
});

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

