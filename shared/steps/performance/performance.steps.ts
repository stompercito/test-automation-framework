import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { buildEmployeePayload, EmployeePayload } from '../../test-data/employee.builder';
import { CustomWorld } from '../../fixtures/world';
import { EmployeesClient } from '../../clients/employees.client';

function client(world: CustomWorld): EmployeesClient {
  return new EmployeesClient(world.apiContext);
}

Given('performance threshold for list endpoint is {int} ms', async function (this: CustomWorld, thresholdMs: number) {
  this.data['perfListThreshold'] = thresholdMs;
});

Given('performance threshold for CRUD operations is {int} ms', async function (this: CustomWorld, thresholdMs: number) {
  this.data['perfCrudThreshold'] = thresholdMs;
});

Given('a valid employee payload is prepared for performance run', async function (this: CustomWorld) {
  this.data['perfPayload'] = buildEmployeePayload();
});

When('I measure response time for employee list endpoint', async function (this: CustomWorld) {
  const start = Date.now();
  const response = await client(this).getAll();
  const elapsed = Date.now() - start;

  this.data['perfListResponse'] = response;
  this.data['perfListElapsed'] = elapsed;
});

When('I measure create, update, and delete operation times', async function (this: CustomWorld) {
  const c = client(this);
  const payload = this.data['perfPayload'] as EmployeePayload;

  const createStart = Date.now();
  const created = await c.create(payload);
  const createMs = Date.now() - createStart;

  const createdId = created.body.id;
  if (created.status === 200 && createdId) {
    this.trackEmployeeId(createdId);
  }

  const updatePayload = buildEmployeePayload({ dependants: 2 });
  const updateStart = Date.now();
  const updated = await c.update(createdId, updatePayload);
  const updateMs = Date.now() - updateStart;

  const deleteStart = Date.now();
  const deleted = await c.deleteById(createdId);
  const deleteMs = Date.now() - deleteStart;

  this.data['perfCrudStatuses'] = {
    create: created.status,
    update: updated.status,
    delete: deleted.status,
  };
  this.data['perfCrudTimes'] = { createMs, updateMs, deleteMs };
});

When('I run repeated CRUD cycles for {int} iterations', async function (this: CustomWorld, iterations: number) {
  const c = client(this);
  let failures = 0;

  for (let i = 0; i < iterations; i += 1) {
    const payload = buildEmployeePayload({ dependants: i % 5 });
    const created = await c.create(payload);

    if (created.status !== 200 || !created.body.id) {
      failures += 1;
      continue;
    }

    this.trackEmployeeId(created.body.id);

    const updated = await c.update(created.body.id, buildEmployeePayload({ dependants: (i + 1) % 5 }));
    const deleted = await c.deleteById(created.body.id);

    if (updated.status !== 200 || ![200, 204].includes(deleted.status)) {
      failures += 1;
    }
  }

  this.data['perfRepeatedFailures'] = failures;
});

Then('the list endpoint should return success and respond within threshold', async function (this: CustomWorld) {
  const response = this.data['perfListResponse'] as { status: number };
  const elapsed = this.data['perfListElapsed'] as number;
  const threshold = this.data['perfListThreshold'] as number;

  expect(response.status).toBe(200);
  expect(elapsed).toBeLessThanOrEqual(threshold);
});

Then(
  'create, update, and delete should return expected statuses and remain within threshold',
  async function (this: CustomWorld) {
  const times = this.data['perfCrudTimes'] as { createMs: number; updateMs: number; deleteMs: number };
  const statuses = this.data['perfCrudStatuses'] as { create: number; update: number; delete: number };
  const threshold = this.data['perfCrudThreshold'] as number;

  expect(statuses.create).toBe(200);
  expect(statuses.update).toBe(200);
  expect([200, 204]).toContain(statuses.delete);

  expect(times.createMs).toBeLessThanOrEqual(threshold);
  expect(times.updateMs).toBeLessThanOrEqual(threshold);
  expect(times.deleteMs).toBeLessThanOrEqual(threshold);
  },
);

Then('repeated CRUD run should complete with zero unexpected failures', async function (this: CustomWorld) {
  const failures = this.data['perfRepeatedFailures'] as number;
  expect(failures).toBe(0);
});
