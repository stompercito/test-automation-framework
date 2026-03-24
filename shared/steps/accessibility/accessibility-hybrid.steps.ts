import { Then, When } from '@cucumber/cucumber';
import { expect, Locator, Page } from '@playwright/test';
import { CustomWorld } from '../../fixtures/world';
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

When('I navigate through dashboard controls using only the keyboard', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const employeeId = requireSelectedEmployeeId(this);
  const row = await dashboard.findRowById(employeeId);

  this.data['a11yAddControl'] = dashboard.addButton;
  this.data['a11yEditControl'] = row
    .locator('button:has(.fa-edit), [role="button"]:has(.fa-edit), .fa-edit')
    .first();
  this.data['a11yDeleteControl'] = row
    .locator('button:has(.fa-times), [role="button"]:has(.fa-times), .fa-times')
    .first();

  await this.page.locator('body').click({ position: { x: 5, y: 5 } });
});

Then('the add employee action should be reachable by keyboard', async function (this: CustomWorld) {
  const control = this.data['a11yAddControl'] as Locator;
  const result = await tabUntilFocused(this.page, control);

  expect(result.reached).toBeTruthy();
});

Then('the edit action for the seeded employee should be reachable by keyboard', async function (this: CustomWorld) {
  const control = this.data['a11yEditControl'] as Locator;
  const result = await tabUntilFocused(this.page, control);

  expect(result.reached).toBeTruthy();
});

Then('the delete action for the seeded employee should be reachable by keyboard', async function (this: CustomWorld) {
  const control = this.data['a11yDeleteControl'] as Locator;
  const result = await tabUntilFocused(this.page, control);

  expect(result.reached).toBeTruthy();
});

When('I open add employee modal using only the keyboard', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);

  await this.page.locator('body').click({ position: { x: 5, y: 5 } });
  await tabUntilFocused(this.page, dashboard.addButton);
  await this.page.keyboard.press('Enter');
  await expect(dashboard.employeeModal.modal).toBeVisible();
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
