import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { buildEmployeePayload, EmployeePayload } from '../../test-data/employee.builder';
import { CustomWorld } from '../../fixtures/world';
import { getClient } from './api-step-utils';

When('I update the seeded employee with valid data', async function (this: CustomWorld) {
  const client = getClient(this);
  const id = this.data['existingEmployeeId'] as string;
  const payload = buildEmployeePayload({ dependants: 3 });

  this.data['updatedPayload'] = payload;
  this.data['response'] = await client.update(id, payload);
});

When('I complete a full employee CRUD chain', async function (this: CustomWorld) {
  const client = getClient(this);
  const createPayload = this.data['employeePayload'] as EmployeePayload;

  const created = await client.create(createPayload);
  this.data['crudCreateStatus'] = created.status;

  if (created.status === 200) {
    this.trackEmployeeId(created.body.id);
  }

  const fetchedBefore = await client.getById(created.body.id);
  this.data['crudGetBeforeStatus'] = fetchedBefore.status;

  const updatePayload = buildEmployeePayload({ dependants: 3 });
  const updated = await client.update(created.body.id, updatePayload);
  this.data['crudUpdateStatus'] = updated.status;

  const fetchedAfter = await client.getById(created.body.id);
  this.data['crudGetAfterStatus'] = fetchedAfter.status;

  const deleted = await client.deleteById(created.body.id);
  this.data['crudDeleteStatus'] = deleted.status;

  const fetchAfterDelete = await client.getById(created.body.id);
  this.data['crudGetAfterDeleteStatus'] = fetchAfterDelete.status;
});

Then('updated employee data should be persisted', async function (this: CustomWorld) {
  const client = getClient(this);
  const id = this.data['existingEmployeeId'] as string;
  const updated = this.data['updatedPayload'] as EmployeePayload;

  const getResponse = await client.getById(id);
  expect(getResponse.status).toBe(200);
  expect(getResponse.body.firstName).toBe(updated.firstName);
  expect(getResponse.body.lastName).toBe(updated.lastName);
  expect(getResponse.body.dependants).toBe(updated.dependants);
});

Then('each API operation should return expected statuses', async function (this: CustomWorld) {
  expect(this.data['crudCreateStatus']).toBe(200);
  expect(this.data['crudGetBeforeStatus']).toBe(200);
  expect(this.data['crudUpdateStatus']).toBe(200);
  expect(this.data['crudGetAfterStatus']).toBe(200);
  expect([200, 204]).toContain(this.data['crudDeleteStatus'] as number);
  expect([400, 404]).toContain(this.data['crudGetAfterDeleteStatus'] as number);
});
