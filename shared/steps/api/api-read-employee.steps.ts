import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { buildEmployeePayload } from '../../test-data/employee.builder';
import { CustomWorld } from '../../fixtures/world';
import { getClient } from './api-step-utils';

Given('an employee exists via API', async function (this: CustomWorld) {
  const client = getClient(this);
  const payload = buildEmployeePayload();
  const response = await client.create(payload);

  expect(response.status).toBe(200);
  this.trackEmployeeId(response.body.id);
  this.data['existingEmployeeId'] = response.body.id;
  this.data['existingEmployeePayload'] = payload;
});

Given('I use invalid employee id {string}', async function (this: CustomWorld, invalidId: string) {
  this.data['requestedEmployeeId'] = invalidId;
});

When('I request all employees', async function (this: CustomWorld) {
  this.data['response'] = await getClient(this).getAll();
});

When('I request employee by id', async function (this: CustomWorld) {
  const id = (this.data['requestedEmployeeId'] as string) ?? (this.data['existingEmployeeId'] as string);
  this.data['response'] = await getClient(this).getById(id);
});

Then('the employee list response should be successful', async function (this: CustomWorld) {
  const response = this.data['response'] as { status: number; body: unknown[] };
  expect(response.status).toBe(200);
  expect(Array.isArray(response.body)).toBeTruthy();
});

Then('the employee by id response should match seeded employee', async function (this: CustomWorld) {
  const response = this.data['response'] as { status: number; body: { id: string } };
  expect(response.status).toBe(200);
  expect(response.body.id).toBe(this.data['existingEmployeeId']);
});
