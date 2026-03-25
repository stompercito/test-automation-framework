import { Then, When } from '@cucumber/cucumber';
import { expect, Locator, Page } from '@playwright/test';
import { CustomWorld } from '../../fixtures/world';
import { buildEmployeePayload, EmployeePayload } from '../../test-data/employee.builder';
import { getDashboard, requireSelectedEmployeeId } from '../ui/ui-step-utils';

type FocusResult = {
  reached: boolean;
  tabs: number;
};

async function isFocused(target: Locator): Promise<boolean> {
  const count = await target.count();
  if (count === 0) {
    return false;
  }
  const node = target.first();
  return node.evaluate((el) => el === document.activeElement);
}

async function tabUntilFocused(page: Page, target: Locator, maxTabs = 40): Promise<FocusResult> {
  if (await isFocused(target)) {
    return { reached: true, tabs: 0 };
  }

  for (let i = 1; i <= maxTabs; i += 1) {
    await page.keyboard.press('Tab');
    if (await isFocused(target)) {
      return { reached: true, tabs: i };
    }
  }

  return { reached: false, tabs: maxTabs };
}

When('I reset keyboard focus to the dashboard', async function (this: CustomWorld) {
  await this.page.locator('body').click({ position: { x: 5, y: 5 } });
});

Then('the add employee action should be reachable by keyboard', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const control = dashboard.addButton;
  const result = await tabUntilFocused(this.page, control);

  expect(
    result.reached,
    `Add Employee action was not reachable by keyboard after ${result.tabs} Tab presses.`,
  ).toBeTruthy();
});

Then('the edit action for the seeded employee should be reachable by keyboard', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const employeeId = requireSelectedEmployeeId(this);
  const row = await dashboard.findRowById(employeeId);
  const control = row
    .locator('button:has(.fa-edit), [role="button"]:has(.fa-edit), .fa-edit')
    .first();

  await this.page.locator('body').click({ position: { x: 5, y: 5 } });
  const addReach = await tabUntilFocused(this.page, dashboard.addButton);
  expect(
    addReach.reached,
    'Cannot validate Edit keyboard reachability because Add action was not reachable first.',
  ).toBeTruthy();

  const result = await tabUntilFocused(this.page, control);

  expect(
    result.reached,
    `Edit action was not reachable by keyboard after ${result.tabs + addReach.tabs} Tab presses.`,
  ).toBeTruthy();
});

Then('the delete action for the seeded employee should be reachable by keyboard', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const employeeId = requireSelectedEmployeeId(this);
  const row = await dashboard.findRowById(employeeId);
  const editControl = row
    .locator('button:has(.fa-edit), [role="button"]:has(.fa-edit), .fa-edit')
    .first();
  const control = row
    .locator('button:has(.fa-times), [role="button"]:has(.fa-times), .fa-times')
    .first();

  await this.page.locator('body').click({ position: { x: 5, y: 5 } });
  const addReach = await tabUntilFocused(this.page, dashboard.addButton);
  expect(
    addReach.reached,
    'Cannot validate Delete keyboard reachability because Add action was not reachable first.',
  ).toBeTruthy();

  const editReach = await tabUntilFocused(this.page, editControl);
  expect(
    editReach.reached,
    'Cannot validate Delete keyboard reachability because Edit action was not reachable first.',
  ).toBeTruthy();

  const result = await tabUntilFocused(this.page, control);

  expect(
    result.reached,
    `Delete action was not reachable by keyboard after ${result.tabs + addReach.tabs + editReach.tabs} Tab presses.`,
  ).toBeTruthy();
});

When('I open add employee modal using only the keyboard', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);

  await this.page.locator('body').click({ position: { x: 5, y: 5 } });
  const focusResult = await tabUntilFocused(this.page, dashboard.addButton);
  expect(
    focusResult.reached,
    `Add Employee action was not reachable by keyboard after ${focusResult.tabs} Tab presses.`,
  ).toBeTruthy();
  await this.page.keyboard.press('Enter');
  await dashboard.employeeModal.waitUntilOpen('add');
});

When('I open add employee modal from dashboard', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  await dashboard.openAddModal();
});

Then('focus should move to a logical control in the employee modal', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const firstNameFocused = await isFocused(dashboard.employeeModal.firstNameInput);
  const modalFocused = await isFocused(dashboard.employeeModal.modal);

  expect(firstNameFocused || modalFocused).toBeTruthy();
});

Then('keyboard navigation should reach modal action controls', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const addButtonResult = await tabUntilFocused(this.page, dashboard.employeeModal.addButton);

  expect(addButtonResult.reached).toBeTruthy();

  const cancelButton = dashboard.employeeModal.modal.getByRole('button', { name: /cancel|close/i }).first();
  const cancelButtonResult = await tabUntilFocused(this.page, cancelButton);
  expect(cancelButtonResult.reached).toBeTruthy();
});

Then('employee modal inputs should have non-empty placeholders', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const firstName = dashboard.employeeModal.firstNameInput;
  const lastName = dashboard.employeeModal.lastNameInput;
  const dependants = dashboard.employeeModal.dependantsInput;

  await expect(firstName).toBeVisible();
  await expect(lastName).toBeVisible();
  await expect(dependants).toBeVisible();

  const warnings: string[] = [];
  const firstPlaceholder = (await firstName.getAttribute('placeholder'))?.trim() ?? '';
  const lastPlaceholder = (await lastName.getAttribute('placeholder'))?.trim() ?? '';
  const dependantsPlaceholder = (await dependants.getAttribute('placeholder'))?.trim() ?? '';

  if (!firstPlaceholder) warnings.push('firstName input is missing a non-empty placeholder.');
  if (!lastPlaceholder) warnings.push('lastName input is missing a non-empty placeholder.');
  if (!dependantsPlaceholder) warnings.push('dependants input is missing a non-empty placeholder.');

  await this.attach(
    JSON.stringify(
      {
        placeholderCheck: {
          firstName: firstPlaceholder || null,
          lastName: lastPlaceholder || null,
          dependants: dependantsPlaceholder || null,
        },
        warnings,
      },
      null,
      2,
    ),
    'application/json',
  );

  if (warnings.length > 0 && this.page && !this.page.isClosed()) {
    const screenshot = await this.page.screenshot({ fullPage: true });
    await this.attach(screenshot, 'image/png');
    this.data['failureScreenshotAttached'] = true;
    throw new Error(`Accessibility placeholder validation failed: ${warnings.join(' ')}`);
  }
});

Then('add and cancel buttons should be visible in the employee modal', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  await expect(dashboard.employeeModal.addButton).toBeVisible();
  const cancelButton = dashboard.employeeModal.modal.getByRole('button', { name: /cancel|close/i }).first();
  await expect(cancelButton).toBeVisible();
});

Then('keyboard navigation should reach employee modal inputs and action buttons', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const firstName = dashboard.employeeModal.firstNameInput;
  const lastName = dashboard.employeeModal.lastNameInput;
  const dependants = dashboard.employeeModal.dependantsInput;
  const addButton = dashboard.employeeModal.addButton;
  const cancelButton = dashboard.employeeModal.modal.getByRole('button', { name: /cancel|close/i }).first();

  const firstResult = await tabUntilFocused(this.page, firstName, 10);
  expect(firstResult.reached, `First Name input was not keyboard-reachable after ${firstResult.tabs} Tab presses.`).toBeTruthy();

  const lastResult = await tabUntilFocused(this.page, lastName, 10);
  expect(lastResult.reached, `Last Name input was not keyboard-reachable after ${lastResult.tabs} Tab presses.`).toBeTruthy();

  const dependantsResult = await tabUntilFocused(this.page, dependants, 10);
  expect(
    dependantsResult.reached,
    `Dependants input was not keyboard-reachable after ${dependantsResult.tabs} Tab presses.`,
  ).toBeTruthy();

  const addResult = await tabUntilFocused(this.page, addButton, 10);
  expect(addResult.reached, `Add button was not keyboard-reachable after ${addResult.tabs} Tab presses.`).toBeTruthy();

  const cancelResult = await tabUntilFocused(this.page, cancelButton, 10);
  expect(cancelResult.reached, `Cancel button was not keyboard-reachable after ${cancelResult.tabs} Tab presses.`).toBeTruthy();
});

When('I submit a valid employee from the accessibility add modal flow', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const payload = buildEmployeePayload({ dependants: 1 });

  await dashboard.employeeModal.fill(payload);
  await dashboard.employeeModal.submitAdd();
  this.data['a11yCreatedPayload'] = payload;

  await expect
    .poll(async () =>
      (await dashboard.readRows()).find((row) => row.firstName === payload.firstName && row.lastName === payload.lastName),
    )
    .toBeTruthy();

  const matched = (await dashboard.readRows()).find(
    (row) => row.firstName === payload.firstName && row.lastName === payload.lastName,
  );
  if (!matched) {
    throw new Error('Created employee row was not found after accessibility add flow.');
  }

  this.data['selectedEmployeeId'] = matched.id;
  this.data['selectedEmployeePayload'] = payload as EmployeePayload;
});
