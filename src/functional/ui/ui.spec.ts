import { expect, Page, request, test } from '@playwright/test';
import { config } from '../../../shared/config/config';
import {
  buildEmployeePayload,
} from '../../../shared/test-data/employee.builder';
import { getUiDependantsRows, getUiRequiredRows } from '../../../shared/test-data/paylocity-matrices';
import { calculateCompensation, parseCurrencyLikeValue } from '../../../shared/utils/payroll';
import { EmployeesClient } from '../../../shared/clients/employees.client';
import { BenefitsDashboardPage } from '../../../shared/pages/benefits-dashboard.page';
import { PaylocityLoginPage } from '../../../shared/pages/paylocity-login.page';

test.describe('Paylocity Benefits Dashboard - UI', () => {
  const createdEmployeeIds: string[] = [];

  test.afterEach(async () => {
    const api = await request.newContext({
      baseURL: config.apiBaseUrl,
      extraHTTPHeaders: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const employees = new EmployeesClient(api);
    while (createdEmployeeIds.length > 0) {
      const id = createdEmployeeIds.pop();
      if (!id) continue;
      try {
        await employees.deleteById(id);
      } catch {
        // Best effort cleanup.
      }
    }

    await api.dispose();
  });

  async function loginAndOpenDashboard(page: Page) {
    const login = new PaylocityLoginPage(page);
    const dashboard = new BenefitsDashboardPage(page);

    await login.goto();
    await login.assertReady();
    await login.login(config.credentials.username, config.credentials.password);
    await dashboard.assertLoaded();

    return dashboard;
  }

  async function createEmployeeViaApi(overrides: Partial<ReturnType<typeof buildEmployeePayload>> = {}) {
    const payload = buildEmployeePayload(overrides);

    const api = await request.newContext({
      baseURL: config.apiBaseUrl,
      extraHTTPHeaders: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const employees = new EmployeesClient(api);
    const response = await employees.create(payload);
    expect(response.status).toBe(200);

    const createdId = response.body.id;
    createdEmployeeIds.push(createdId);
    await api.dispose();

    return { payload, id: createdId };
  }

  test('[UI-F-001] dashboard smoke: login and core controls visible', async ({ page }) => {
    await loginAndOpenDashboard(page);
  });

  test('[UI-F-002] add employee happy path', async ({ page }) => {
    const dashboard = await loginAndOpenDashboard(page);
    const payload = buildEmployeePayload({ dependants: 2 });

    await dashboard.addEmployee(payload);
    await expect
      .poll(async () => dashboard.isEmployeeVisibleByFullName(payload.firstName, payload.lastName))
      .toBeTruthy();
  });

  test('[UI-F-003] edit employee happy path', async ({ page }) => {
    const created = await createEmployeeViaApi();
    const dashboard = await loginAndOpenDashboard(page);

    await dashboard.openEditById(created.id);

    const updatedPayload = buildEmployeePayload({ dependants: 3 });
    await dashboard.employeeModal.fill(updatedPayload);
    await dashboard.employeeModal.submitUpdate();

    await expect
      .poll(async () => dashboard.isEmployeeVisibleByFullName(updatedPayload.firstName, updatedPayload.lastName))
      .toBeTruthy();
  });

  test('[UI-F-004] delete employee happy path', async ({ page }) => {
    const created = await createEmployeeViaApi();
    const dashboard = await loginAndOpenDashboard(page);

    await dashboard.openDeleteById(created.id);
    await dashboard.deleteModal.confirmDelete();

    await expect.poll(async () => dashboard.findStructuredRowById(created.id)).toBeUndefined();

    const index = createdEmployeeIds.indexOf(created.id);
    if (index >= 0) {
      createdEmployeeIds.splice(index, 1);
    }
  });

  test('[UI-F-005] cancel delete keeps employee row', async ({ page }) => {
    const created = await createEmployeeViaApi();
    const dashboard = await loginAndOpenDashboard(page);

    await dashboard.openDeleteById(created.id);
    await dashboard.deleteModal.cancelDelete();

    await expect.poll(async () => dashboard.findStructuredRowById(created.id)).toBeDefined();
  });

  test('[UI-F-007] modal button toggle add/update', async ({ page }) => {
    const created = await createEmployeeViaApi();
    const dashboard = await loginAndOpenDashboard(page);

    await dashboard.openAddModal();
    await expect(dashboard.employeeModal.addButton).toBeVisible();
    await expect(dashboard.employeeModal.updateButton).toBeHidden();
    await dashboard.employeeModal.cancel();

    await dashboard.openEditById(created.id);
    await expect(dashboard.employeeModal.updateButton).toBeVisible();
    await expect(dashboard.employeeModal.addButton).toBeHidden();
  });

  test('[UI-F-008] modal reset on add', async ({ page }) => {
    const dashboard = await loginAndOpenDashboard(page);
    const payload = buildEmployeePayload();

    await dashboard.openAddModal();
    await dashboard.employeeModal.fill(payload);
    await dashboard.employeeModal.cancel();

    await dashboard.openAddModal();
    await expect(dashboard.employeeModal.firstNameInput).toHaveValue('');
    await expect(dashboard.employeeModal.lastNameInput).toHaveValue('');
    await expect(dashboard.employeeModal.dependantsInput).toHaveValue('');
  });

  test('[UI-F-010] calculations displayed correctly', async ({ page }) => {
    const created = await createEmployeeViaApi({ dependants: 2 });
    const dashboard = await loginAndOpenDashboard(page);

    const row = await dashboard.findStructuredRowById(created.id);
    expect(row).toBeDefined();

    const expected = calculateCompensation(2);

    expect(parseCurrencyLikeValue(row!.gross)).toBeCloseTo(expected.grossPerPaycheck, 2);
    expect(parseCurrencyLikeValue(row!.benefitsCost)).toBeCloseTo(expected.benefitsCostPerPaycheck, 2);
    expect(parseCurrencyLikeValue(row!.net)).toBeCloseTo(expected.netPerPaycheck, 2);
  });

  test('[UI-F-011] header/value mapping check catches lastName/firstName inversion', async ({ page }) => {
    const created = await createEmployeeViaApi();
    const dashboard = await loginAndOpenDashboard(page);

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

    const row = await dashboard.findRowById(created.id);
    const cells = await row.locator('td').allTextContents();

    expect(cells[1]?.trim()).toBe(created.payload.lastName);
    expect(cells[2]?.trim()).toBe(created.payload.firstName);
  });

  test.describe('[UI-F-012] dependants input validation (DDT-UI-DEPENDANTS)', () => {
    for (const row of getUiDependantsRows()) {
      test.skip(`${row.input_value}`, async () => {
        // TODO: finalize deterministic expected outcomes after validating current UI behavior in environment.
      });
    }
  });

  test.describe('[UI-F-013] required fields validation (DDT-UI-REQ-FIELDS)', () => {
    for (const row of getUiRequiredRows()) {
      test(`${row.input_value}`, async ({ page }) => {
        const dashboard = await loginAndOpenDashboard(page);
        const beforeCount = (await dashboard.readRows()).length;
        const payload = buildEmployeePayload({ dependants: 1 });

        if (row.input_value.includes('missing firstName')) {
          payload.firstName = '';
        }
        if (row.input_value.includes('missing lastName')) {
          payload.lastName = '';
        }

        await dashboard.openAddModal();
        await dashboard.employeeModal.fill(payload);
        await dashboard.employeeModal.submitAdd();

        const afterCount = (await dashboard.readRows()).length;
        const modalStillVisible = await dashboard.employeeModal.modal.isVisible();

        expect(afterCount === beforeCount || modalStillVisible).toBeTruthy();
      });
    }
  });
});
