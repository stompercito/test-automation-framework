import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../fixtures/world';
import { buildEmployeePayload, buildUiInvalidDependantsVariation, EmployeePayload } from '../../test-data/employee.builder';
import { getDashboard, requireSelectedEmployeeId, requireSelectedEmployeePayload } from './ui-step-utils';

When('I edit the existing employee through the UI modal', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const employeeId = requireSelectedEmployeeId(this);
  const updated = buildEmployeePayload({ dependants: 3 });

  const modalAlreadyOpen = await dashboard.employeeModal.isOpen();
  if (!modalAlreadyOpen) {
    await dashboard.openEditById(employeeId);
  }
  await dashboard.employeeModal.fill(updated);
  await dashboard.employeeModal.submitUpdate();

  this.data['updatedEmployeePayload'] = updated;
  this.data['selectedEmployeePayload'] = updated;
});

When('I open edit and cancel for the existing employee', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const employeeId = requireSelectedEmployeeId(this);

  await dashboard.openEditById(employeeId);
  await dashboard.employeeModal.fill(buildEmployeePayload({ dependants: 4 }));
  await dashboard.employeeModal.cancel();
});

When('I open the add employee modal', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  await dashboard.openAddModal();
});

When('I open the edit modal for the existing employee', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const employeeId = requireSelectedEmployeeId(this);
  await dashboard.openEditById(employeeId);
});

When('I open the edit modal for the created employee', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const createdId = this.data['selectedEmployeeId'] as string | undefined;

  if (!createdId) {
    throw new Error('Missing created employee id. Ensure add step ran before opening edit modal.');
  }

  await dashboard.openEditById(createdId);
});

When('I replace dependants with invalid edit variation {string}', async function (
  this: CustomWorld,
  dependantsCase: string,
) {
  const dashboard = getDashboard(this);
  const original = requireSelectedEmployeePayload(this);
  const invalidVariation = buildUiInvalidDependantsVariation(dependantsCase);

  this.data['attemptedEditPayload'] = {
    ...original,
    dependants: invalidVariation.dependants,
  };

  await dashboard.employeeModal.firstNameInput.fill(original.firstName);
  await dashboard.employeeModal.lastNameInput.fill(original.lastName);
  await dashboard.employeeModal.dependantsInput.fill(String(invalidVariation.dependants));
});

When('I submit the edit employee form', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);

  await expect(dashboard.employeeModal.updateButton).toBeVisible();
  await dashboard.employeeModal.updateButton.click();

  const modalClosed = await dashboard.employeeModal.modalDialog
    .waitFor({ state: 'hidden', timeout: 1500 })
    .then(() => true)
    .catch(() => false);

  this.data['editFormSubmissionClosed'] = modalClosed;
});

Then('the employee row should show updated values', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const employeeId = requireSelectedEmployeeId(this);
  const updated = this.data['updatedEmployeePayload'] as EmployeePayload;

  await expect
    .poll(async () => dashboard.isEmployeeVisibleByFullName(updated.firstName, updated.lastName))
    .toBeTruthy();

  await expect
    .poll(async () => dashboard.findStructuredRowById(employeeId))
    .toBeDefined();

  const row = await dashboard.findStructuredRowById(employeeId);
  if (!row) {
    throw new Error('Updated employee row was not found by id after edit.');
  }

  const displayedNames = [row.firstName, row.lastName];
  expect(displayedNames.includes(updated.firstName)).toBeTruthy();
  expect(displayedNames.includes(updated.lastName)).toBeTruthy();
  expect(row.dependants).toBe(String(updated.dependants));
});

Then('the existing employee should remain unchanged in the table', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const employeeId = requireSelectedEmployeeId(this);
  const original = requireSelectedEmployeePayload(this);

  const row = await dashboard.findStructuredRowById(employeeId);
  expect(row).toBeDefined();
  const displayedNames = [row!.firstName, row!.lastName];
  expect(displayedNames.includes(original.firstName)).toBeTruthy();
  expect(displayedNames.includes(original.lastName)).toBeTruthy();
  expect(row!.dependants).toBe(String(original.dependants));
});

Then('the edit employee flow should not complete as a successful save', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const employeeId = requireSelectedEmployeeId(this);
  const original = requireSelectedEmployeePayload(this);
  const row = await dashboard.findStructuredRowById(employeeId);
  const modalClosed = this.data['editFormSubmissionClosed'] as boolean | undefined;

  expect(row).toBeDefined();

  const rowStillOriginal =
    row !== undefined &&
    [row.firstName, row.lastName].includes(original.firstName) &&
    [row.firstName, row.lastName].includes(original.lastName) &&
    row.dependants === String(original.dependants);

  expect(
    rowStillOriginal || modalClosed === false,
    'Expected invalid edit submission not to complete as a successful save. The modal closed and the row no longer reflects the original employee data.',
  ).toBeTruthy();
});

Then('the add button should be visible and update button hidden', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  await expect(dashboard.employeeModal.addButton).toBeVisible();
  await expect(dashboard.employeeModal.updateButton).toBeHidden();
});

Then('the update button should be visible and add button hidden', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  await expect(dashboard.employeeModal.updateButton).toBeVisible();
  await expect(dashboard.employeeModal.addButton).toBeHidden();
});

Then('the edit modal should show the selected employee values', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const employeeId = requireSelectedEmployeeId(this);
  const payload = requireSelectedEmployeePayload(this);

  await expect(dashboard.employeeModal.idInput).toHaveValue(employeeId);
  await expect(dashboard.employeeModal.firstNameInput).toHaveValue(payload.firstName);
  await expect(dashboard.employeeModal.lastNameInput).toHaveValue(payload.lastName);
  await expect(dashboard.employeeModal.dependantsInput).toHaveValue(String(payload.dependants));
});

Then('the edit modal should show the created employee values', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const employeeId = requireSelectedEmployeeId(this);
  const payload = this.data['uiCreatedPayload'] as EmployeePayload | undefined;

  if (!payload) {
    throw new Error('Missing created employee payload. Ensure add step ran before this assertion.');
  }

  await expect(dashboard.employeeModal.idInput).toHaveValue(employeeId);
  await expect(dashboard.employeeModal.firstNameInput).toHaveValue(payload.firstName);
  await expect(dashboard.employeeModal.lastNameInput).toHaveValue(payload.lastName);
  await expect(dashboard.employeeModal.dependantsInput).toHaveValue(String(payload.dependants));
});

