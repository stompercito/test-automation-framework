import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { EmployeesClient } from '../../clients/employees.client';
import { CustomWorld } from '../../fixtures/world';
import {
  buildEmployeePayload,
  buildMissingRequiredEmployeeVariation,
  buildUiInvalidDependantsVariation,
  buildUiInvalidNameVariation,
  buildUiValidAddBoundaryVariation,
  EmployeePayload,
} from '../../test-data/employee.builder';
import { getDashboard } from './ui-step-utils';

function findPersistedAttemptedEmployee(
  employees: Array<{ username?: string; firstName?: string; lastName?: string }>,
  attemptedPayload: Partial<EmployeePayload>,
) {
  const attemptedFirstName = attemptedPayload.firstName?.trim();
  const attemptedLastName = attemptedPayload.lastName?.trim();

  return employees.find((employee) => {
    if (attemptedPayload.username && employee.username === attemptedPayload.username) {
      return true;
    }

    return Boolean(
      attemptedFirstName &&
      attemptedLastName &&
      employee.firstName === attemptedFirstName &&
      employee.lastName === attemptedLastName,
    );
  });
}

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

When('I enter valid employee data except for invalid dependants variation {string}', async function (
  this: CustomWorld,
  dependantsCase: string,
) {
  const dashboard = getDashboard(this);
  const payload = buildUiInvalidDependantsVariation(dependantsCase);

  this.data['addFlowBeforeCount'] = (await dashboard.readRows()).length;
  this.data['attemptedAddPayload'] = payload;
  this.data['expectedAddSubmissionOutcome'] = 'rejected';

  await dashboard.employeeModal.fill(payload);
});

When('I enter employee data using invalid name variation {string}', async function (
  this: CustomWorld,
  nameCase: string,
) {
  const dashboard = getDashboard(this);
  const payload = buildUiInvalidNameVariation(nameCase);

  this.data['addFlowBeforeCount'] = (await dashboard.readRows()).length;
  this.data['attemptedAddPayload'] = payload;
  this.data['expectedAddSubmissionOutcome'] = 'rejected';

  await dashboard.employeeModal.fill(payload);
});

When('I enter employee data with missing required field variation {string}', async function (
  this: CustomWorld,
  fieldCase: string,
) {
  const dashboard = getDashboard(this);
  const payload = buildMissingRequiredEmployeeVariation(fieldCase);

  this.data['addFlowBeforeCount'] = (await dashboard.readRows()).length;
  this.data['attemptedAddPayload'] = payload;
  this.data['expectedAddSubmissionOutcome'] = 'rejected';

  await dashboard.employeeModal.fill(payload);
});

When('I enter employee data using feedback failure variation {string}', async function (
  this: CustomWorld,
  failureCase: string,
) {
  const dashboard = getDashboard(this);
  let payload: {
    firstName: string;
    lastName: string;
    dependants: number | string;
    username: string;
  };

  switch (failureCase) {
    case 'blank dependants':
      payload = buildUiInvalidDependantsVariation('blank dependants');
      break;
    case 'both names blank':
      payload = {
        ...buildMissingRequiredEmployeeVariation('all visible fields empty'),
        dependants: 1,
      };
      break;
    default:
      throw new Error(`Unsupported feedback failure variation: ${failureCase}`);
  }

  this.data['addFlowBeforeCount'] = (await dashboard.readRows()).length;
  this.data['attemptedAddPayload'] = payload;
  this.data['expectedAddSubmissionOutcome'] = 'rejected';

  await dashboard.employeeModal.fill(payload);
});

When('I enter employee data using valid add boundary variation {string}', async function (
  this: CustomWorld,
  boundaryCase: string,
) {
  const dashboard = getDashboard(this);
  const payload = buildUiValidAddBoundaryVariation(boundaryCase);

  this.data['addFlowBeforeCount'] = (await dashboard.readRows()).length;
  this.data['uiCreatedPayload'] = payload;
  this.data['attemptedAddPayload'] = payload;
  this.data['expectedAddSubmissionOutcome'] = 'accepted';

  await dashboard.employeeModal.fill(payload);
});

When('I submit the add employee form', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const beforeCount =
    (this.data['addFlowBeforeCount'] as number | undefined) ??
    (this.data['addCancelBeforeCount'] as number | undefined) ??
    (await dashboard.readRows()).length;
  const expectedOutcome = this.data['expectedAddSubmissionOutcome'] as 'accepted' | 'rejected' | undefined;

  await expect(dashboard.employeeModal.addButton).toBeVisible();
  await dashboard.employeeModal.addButton.click();

  const modalClosed = await dashboard.employeeModal.modalDialog
    .waitFor({ state: 'hidden', timeout: 1500 })
    .then(() => true)
    .catch(() => false);

  const afterCount = (await dashboard.readRows()).length;

  this.data['addFlowBeforeCount'] = beforeCount;
  this.data['addFlowAfterCount'] = afterCount;
  this.data['addFormSubmissionClosed'] = modalClosed;

  if (expectedOutcome === 'accepted') {
    const hadObservableEffect = modalClosed || afterCount > beforeCount;
    expect(
      hadObservableEffect,
      'Expected a valid add submission to have an observable effect (modal closes or row count increases), but the Add button click appeared to do nothing.',
    ).toBeTruthy();
  }
});

Then('the new employee should be visible in the employee table', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const payload = this.data['uiCreatedPayload'] as EmployeePayload;

  await expect
    .poll(
      async () => dashboard.findStructuredRowByFullName(payload.firstName, payload.lastName),
      {
        message: `Expected employee "${payload.firstName} ${payload.lastName}" to appear in the table after add.`,
        timeout: 15000,
      },
    )
    .toBeDefined();

  // The row id is required for follow-up edit/delete steps in smoke E2E flow.
  const matched = await dashboard.findStructuredRowByFullName(payload.firstName, payload.lastName);
  if (!matched) {
    throw new Error('Created employee row was not found after add operation.');
  }

  this.data['selectedEmployeeId'] = matched.id;
  this.data['selectedEmployeePayload'] = payload;
});

Then('no new employee should be created', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const beforeCount =
    (this.data['addFlowBeforeCount'] as number | undefined) ??
    (this.data['addCancelBeforeCount'] as number | undefined);
  const afterCount = (await dashboard.readRows()).length;
  const attemptedPayload = this.data['attemptedAddPayload'] as Partial<EmployeePayload> | undefined;

  expect(beforeCount).toBeDefined();
  expect(afterCount).toBe(beforeCount);

  if (attemptedPayload?.username) {
    const employeesClient = new EmployeesClient(this.apiContext);

    await expect
      .poll(
        async () => {
          const response = await employeesClient.getAll();
          if (response.status !== 200 || !Array.isArray(response.body)) {
            return undefined;
          }

          return findPersistedAttemptedEmployee(response.body, attemptedPayload);
        },
        {
          message: `Expected no employee to be created for attempted payload "${attemptedPayload.firstName ?? ''} ${attemptedPayload.lastName ?? ''}" / username "${attemptedPayload.username ?? ''}", but a matching employee was returned by the API.`,
          timeout: 5000,
        },
      )
      .toBeUndefined();
  }
});

Then('the add employee flow should not complete successfully', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const beforeCount = this.data['addFlowBeforeCount'] as number | undefined;
  const afterCount =
    (this.data['addFlowAfterCount'] as number | undefined) ??
    (await dashboard.readRows()).length;
  const modalClosed = this.data['addFormSubmissionClosed'] as boolean | undefined;
  const attemptedPayload = this.data['attemptedAddPayload'] as Partial<EmployeePayload> | undefined;
  const rows = await dashboard.readRows();

  expect(beforeCount).toBeDefined();
  expect(afterCount).toBe(beforeCount);
  expect(
    modalClosed,
    'Expected the add modal to close after pressing Add Employee. The modal stayed open, which indicates the submit action did not complete successfully.',
  ).toBeTruthy();

  const attemptedFirstName = attemptedPayload?.firstName?.trim();
  const attemptedLastName = attemptedPayload?.lastName?.trim();

  if (attemptedFirstName && attemptedLastName) {
    const matchedRow = rows.find(
      (row) => row.firstName === attemptedFirstName && row.lastName === attemptedLastName,
    );
    expect(
      matchedRow,
      `Expected add flow to avoid persisting employee "${attemptedFirstName} ${attemptedLastName}", but a matching row was found.`,
    ).toBeUndefined();
  }
});

Then('invalid employee name values should not be accepted in the table', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const payload = this.data['attemptedAddPayload'] as EmployeePayload | undefined;
  const rows = await dashboard.readRows();

  if (!payload) {
    throw new Error('Missing attempted add payload for invalid-name assertion.');
  }

  const matchedRow = rows.find(
    (row) => row.firstName === payload.firstName.trim() && row.lastName === payload.lastName.trim(),
  );

  expect(matchedRow).toBeUndefined();

  if (payload.username) {
    const employeesClient = new EmployeesClient(this.apiContext);

    await expect
      .poll(
        async () => {
          const response = await employeesClient.getAll();
          if (response.status !== 200 || !Array.isArray(response.body)) {
            return undefined;
          }

          return findPersistedAttemptedEmployee(response.body, payload);
        },
        {
          message: `Expected invalid-name submission not to create employee "${payload.firstName ?? ''} ${payload.lastName ?? ''}" / username "${payload.username ?? ''}", but a matching employee was returned by the API.`,
          timeout: 5000,
        },
      )
      .toBeUndefined();
  }
});

Then('the add modal fields should be empty', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);

  await expect(dashboard.employeeModal.firstNameInput).toHaveValue('');
  await expect(dashboard.employeeModal.lastNameInput).toHaveValue('');
  await expect(dashboard.employeeModal.dependantsInput).toHaveValue('');
});

Then('a visible validation or error message should be shown', async function (this: CustomWorld) {
  const dashboard = getDashboard(this);
  const feedbackLocator = dashboard.employeeModal.modal.locator(
    [
      '[role="alert"]',
      '.alert-danger',
      '.alert-warning',
      '.validation-summary-errors',
      '.field-validation-error',
      '.invalid-feedback',
      '.text-danger',
      '[data-valmsg-summary="true"]',
      '[data-valmsg-replace="true"]',
    ].join(', '),
  );

  await expect
    .poll(
      async () => {
        const count = await feedbackLocator.count();
        for (let index = 0; index < count; index += 1) {
          const candidate = feedbackLocator.nth(index);
          const isVisible = await candidate.isVisible().catch(() => false);
          if (!isVisible) {
            continue;
          }

          const text = (await candidate.textContent())?.trim() ?? '';
          if (text) {
            return text;
          }
        }

        return undefined;
      },
      {
        message:
          'Expected a visible validation or error message after the failed save attempt, but no visible feedback text was found in the employee modal.',
        timeout: 5000,
      },
    )
    .toBeDefined();
});
