import { expect, request, test } from '@playwright/test';
import { config } from '../../../shared/config/config';
import { buildEmployeePayload } from '../../../shared/test-data/employee.builder';
import {
  getApiAuthRows,
  getApiDependantsRows,
  getApiExtraPropRows,
  getApiInvalidUuidRows,
  getApiReadonlyRows,
  getApiRequiredFieldRows,
  getApiStringLengthRows,
} from '../../../shared/test-data/paylocity-matrices';
import { EmployeesClient } from '../../../shared/clients/employees.client';
import { assertEmployeeShape } from './validators/employee.validator';

test.describe('Paylocity Employees API', () => {
  const createdIds: string[] = [];

  test.afterEach(async () => {
    const api = await request.newContext({
      baseURL: config.apiBaseUrl,
      extraHTTPHeaders: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const employees = new EmployeesClient(api);

    while (createdIds.length > 0) {
      const id = createdIds.pop();
      if (!id) continue;
      try {
        await employees.deleteById(id);
      } catch {
        // Cleanup best effort.
      }
    }

    await api.dispose();
  });

  async function getClient() {
    const api = await request.newContext({
      baseURL: config.apiBaseUrl,
      extraHTTPHeaders: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    return {
      api,
      employees: new EmployeesClient(api),
    };
  }

  test('[API-F-001] create employee with valid payload', async () => {
    const { api, employees } = await getClient();
    const payload = buildEmployeePayload({ dependants: 1 });

    const response = await employees.create(payload);
    expect(response.status).toBe(200);
    assertEmployeeShape(response.body);
    expect(response.body.firstName).toBe(payload.firstName);

    createdIds.push(response.body.id);
    await api.dispose();
  });

  test('[API-F-002] get all employees returns a list', async () => {
    const { api, employees } = await getClient();
    const response = await employees.getAll();

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();

    await api.dispose();
  });

  test('[API-F-003] get employee by valid id', async () => {
    const { api, employees } = await getClient();
    const created = await employees.create(buildEmployeePayload());
    createdIds.push(created.body.id);

    const response = await employees.getById(created.body.id);
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(created.body.id);

    await api.dispose();
  });

  test('[API-F-004] update employee with valid payload', async () => {
    const { api, employees } = await getClient();
    const created = await employees.create(buildEmployeePayload());
    createdIds.push(created.body.id);

    const updated = buildEmployeePayload({ dependants: 4 });
    const updateResponse = await employees.update(created.body.id, updated);

    expect(updateResponse.status).toBe(200);

    const fetched = await employees.getById(created.body.id);
    expect(fetched.body.firstName).toBe(updated.firstName);
    expect(fetched.body.dependants).toBe(updated.dependants);

    await api.dispose();
  });

  test('[API-F-005] delete employee by valid id', async () => {
    const { api, employees } = await getClient();
    const created = await employees.create(buildEmployeePayload());

    const deleted = await employees.deleteById(created.body.id);
    expect([200, 204]).toContain(deleted.status);

    const getAfterDelete = await employees.getById(created.body.id);
    expect([400, 404]).toContain(getAfterDelete.status);

    await api.dispose();
  });

  test('[API-F-014] CRUD chain consistency', async () => {
    const { api, employees } = await getClient();
    const created = await employees.create(buildEmployeePayload({ dependants: 2 }));
    createdIds.push(created.body.id);

    const updatedPayload = buildEmployeePayload({ dependants: 5 });
    const updated = await employees.update(created.body.id, updatedPayload);
    expect(updated.status).toBe(200);

    const fetched = await employees.getById(created.body.id);
    expect(fetched.body.firstName).toBe(updatedPayload.firstName);

    const deleted = await employees.deleteById(created.body.id);
    expect([200, 204]).toContain(deleted.status);

    const idx = createdIds.indexOf(created.body.id);
    if (idx >= 0) {
      createdIds.splice(idx, 1);
    }

    await api.dispose();
  });

  test.describe('[API-F-006] required field validation (DDT-API-REQ-FIELDS)', () => {
    for (const row of getApiRequiredFieldRows()) {
      test(`${row.input_value}`, async () => {
        const { api, employees } = await getClient();
        const payload = buildEmployeePayload();

        if (row.input_value.includes('firstName')) {
          payload.firstName = '';
        }
        if (row.input_value.includes('lastName')) {
          payload.lastName = '';
        }
        if (row.input_value.includes('username')) {
          payload.username = '';
        }

        const response = await employees.create(payload);
        expect(response.status).toBeGreaterThanOrEqual(400);

        await api.dispose();
      });
    }
  });

  test.describe('[API-F-007] string length boundary validation (DDT-API-STRING-LEN)', () => {
    const targetFields: Array<'firstName' | 'lastName' | 'username'> = ['firstName', 'lastName', 'username'];

    for (const row of getApiStringLengthRows()) {
      for (const field of targetFields) {
        test(`${field} | ${row.input_value}`, async () => {
          const { api, employees } = await getClient();
          const payload = buildEmployeePayload();
          payload[field] = 'x'.repeat(row.lengthValue);

          const response = await employees.create(payload);

          if (row.expectedValid) {
            expect(response.status).toBe(200);
            createdIds.push(response.body.id);
          } else {
            expect(response.status).toBeGreaterThanOrEqual(400);
          }

          await api.dispose();
        });
      }
    }
  });

  test.describe('[API-F-008] dependants boundary validation (DDT-API-DEPENDANTS)', () => {
    for (const row of getApiDependantsRows()) {
      test(`${row.input_value}`, async () => {
        const { api, employees } = await getClient();

        const response = await employees.create(buildEmployeePayload({ dependants: row.numericValue }));

        if (row.expectedValid) {
          expect(response.status).toBe(200);
          createdIds.push(response.body.id);
        } else {
          expect(response.status).toBeGreaterThanOrEqual(400);
        }

        await api.dispose();
      });
    }
  });

  test.describe('[API-F-009] invalid UUID handling (DDT-API-INVALID-UUID)', () => {
    for (const row of getApiInvalidUuidRows()) {
      test(`${row.input_value}`, async () => {
        const { api, employees } = await getClient();

        if (row.resolvedId === '') {
          const raw = await api.get('api/Employees/');
          expect(raw.status()).toBeGreaterThanOrEqual(400);
        } else {
          const response = await employees.getById(row.resolvedId);
          expect(response.status).toBeGreaterThanOrEqual(400);
        }

        await api.dispose();
      });
    }
  });

  test.describe('[API-F-010] read-only fields cannot be client controlled (DDT-API-READONLY)', () => {
    for (const row of getApiReadonlyRows()) {
      test(`${row.input_value}`, async () => {
        const { api, employees } = await getClient();
        const payload = buildEmployeePayload() as unknown as Record<string, unknown>;

        if (row.input_value.includes('gross')) payload.gross = 999999;
        if (row.input_value.includes('benefitsCost')) payload.benefitsCost = 0;
        if (row.input_value.includes('net')) payload.net = 999999;
        if (row.input_value.includes('sortKey')) payload.sortKey = 'forced-sort';
        if (row.input_value.includes('partitionKey')) payload.partitionKey = 'forced-partition';

        const response = await employees.create(payload as ReturnType<typeof buildEmployeePayload>);

        if (response.status === 200) {
          createdIds.push(response.body.id);
          if (payload.gross !== undefined) {
            expect(Number(response.body.gross)).not.toBe(Number(payload.gross));
          }
        } else {
          expect(response.status).toBeGreaterThanOrEqual(400);
        }

        await api.dispose();
      });
    }
  });

  test.describe('[API-F-011] unexpected properties rejection (DDT-API-EXTRA-PROPS)', () => {
    for (const row of getApiExtraPropRows()) {
      test(`${row.input_value}`, async () => {
        const { api, employees } = await getClient();

        const payload = buildEmployeePayload() as unknown as Record<string, unknown>;

        if (row.input_value === 'middleName') payload.middleName = 'X';
        if (row.input_value === 'randomFlag') payload.randomFlag = true;
        if (row.input_value === 'nestedObject') payload.nestedObject = { enabled: true };

        const response = await employees.create(payload as ReturnType<typeof buildEmployeePayload>);
        expect(response.status).toBeGreaterThanOrEqual(400);

        await api.dispose();
      });
    }
  });

  test.describe('[API-F-013] authentication required (DDT-API-AUTH)', () => {
    for (const row of getApiAuthRows()) {
      test(`${row.input_value}`, async () => {
        const { api, employees } = await getClient();
        let status: number;

        if (row.input_value === 'missing header') {
          const response = await employees.getAll({ token: '' });
          status = response.status;
        } else if (row.input_value === 'invalid token') {
          const response = await employees.getAll({ token: 'invalid-token-value' });
          status = response.status;
        } else if (row.input_value === 'wrong auth scheme') {
          const response = await api.get('api/Employees', {
            headers: { Authorization: 'Digest invalid' },
          });
          status = response.status();
        } else {
          const response = await employees.getAll();
          status = response.status;
        }

        if (row.expectedValid) {
          expect(status).toBe(200);
        } else {
          expect([400, 401, 403]).toContain(status);
        }

        await api.dispose();
      });
    }
  });
});
