import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../fixtures/world';
import { getDashboard, requireSelectedEmployeeId } from './ui-step-utils';

When('I delete the existing employee and confirm', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const employeeId = requireSelectedEmployeeId(this);

  await dashboard.openDeleteById(employeeId);
  await dashboard.deleteModal.confirmDelete();
});

When('I open delete and cancel for the existing employee', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const employeeId = requireSelectedEmployeeId(this);

  await dashboard.openDeleteById(employeeId);
  await dashboard.deleteModal.cancelDelete();
});

Then('the employee should not be visible in the table by id', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const employeeId = requireSelectedEmployeeId(this);

  await expect.poll(async () => dashboard.findStructuredRowById(employeeId)).toBeUndefined();
});

Then('the employee should remain visible in the table by id', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const employeeId = requireSelectedEmployeeId(this);

  await expect.poll(async () => dashboard.findStructuredRowById(employeeId)).toBeDefined();
});

