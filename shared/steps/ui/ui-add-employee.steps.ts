import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../fixtures/world';
import { buildEmployeePayload, EmployeePayload } from '../../test-data/employee.builder';
import { calculateCompensation, parseCurrencyLikeValue } from '../../utils/payroll';
import { getDashboard } from './ui-step-utils';

When('I add a new employee through the UI modal', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const payload = buildEmployeePayload({ dependants: 2 });

  await dashboard.addEmployee(payload);
  this.data['uiCreatedPayload'] = payload;
});

When('I attempt to add an employee but cancel the modal', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const beforeCount = (await dashboard.readRows()).length;
  const payload = buildEmployeePayload({ dependants: 1 });

  await dashboard.openAddModal();
  await dashboard.employeeModal.fill(payload);
  await dashboard.employeeModal.cancel();

  this.data['addCancelBeforeCount'] = beforeCount;
});

When('I open add modal, type values, cancel, and open add modal again', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const payload = buildEmployeePayload({ dependants: 1 });

  await dashboard.openAddModal();
  await dashboard.employeeModal.fill(payload);
  await dashboard.employeeModal.cancel();
  await dashboard.openAddModal();
});

Then('the new employee should be visible in the employee table', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const payload = this.data['uiCreatedPayload'] as EmployeePayload;

  await expect
    .poll(async () => dashboard.isEmployeeVisibleByFullName(payload.firstName, payload.lastName))
    .toBeTruthy();

  await expect
    .poll(async () =>
      (await dashboard.readRows()).find(
        (row) => row.firstName === payload.firstName && row.lastName === payload.lastName,
      ),
    )
    .toBeTruthy();

  // The row id is required for follow-up edit/delete steps in smoke E2E flow.
  const matched = (await dashboard.readRows()).find(
    (row) => row.firstName === payload.firstName && row.lastName === payload.lastName,
  );
  if (!matched) {
    throw new Error('Created employee row was not found after add operation.');
  }

  this.data['selectedEmployeeId'] = matched.id;
  this.data['selectedEmployeePayload'] = payload;
});

Then('the created employee row should show correct payroll calculations', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const payload = this.data['uiCreatedPayload'] as EmployeePayload;

  await expect
    .poll(async () =>
      (await dashboard.readRows()).find(
        (item) => item.firstName === payload.firstName && item.lastName === payload.lastName,
      ),
    )
    .toBeTruthy();

  const matched = (await dashboard.readRows()).find(
    (item) => item.firstName === payload.firstName && item.lastName === payload.lastName,
  );
  if (!matched) {
    throw new Error('Unable to validate payroll calculations because created row was not found.');
  }

  const expected = calculateCompensation(payload.dependants);
  expect(parseCurrencyLikeValue(matched.gross)).toBeCloseTo(expected.grossPerPaycheck, 2);
  expect(parseCurrencyLikeValue(matched.benefitsCost)).toBeCloseTo(expected.benefitsCostPerPaycheck, 2);
  expect(parseCurrencyLikeValue(matched.net)).toBeCloseTo(expected.netPerPaycheck, 2);
});

Then('no new employee should be created', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const beforeCount = this.data['addCancelBeforeCount'] as number;
  const afterCount = (await dashboard.readRows()).length;

  expect(afterCount).toBe(beforeCount);
});

Then('the add modal fields should be empty', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);

  await expect(dashboard.employeeModal.firstNameInput).toHaveValue('');
  await expect(dashboard.employeeModal.lastNameInput).toHaveValue('');
  await expect(dashboard.employeeModal.dependantsInput).toHaveValue('');
});
