import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { buildEmployeePayload, EmployeePayload } from '../../test-data/employee.builder';
import { CustomWorld } from '../../fixtures/world';
import { calculateCompensation } from '../../utils/payroll';
import { getClient } from './api-step-utils';

When('I update the seeded employee with valid data', async function (this: CustomWorld) {
  const client = getClient(this);
  const id = this.data['existingEmployeeId'] as string;
  const payload = buildEmployeePayload({ dependants: 3 });

  this.data['updatedPayload'] = payload;
  this.data['response'] = await client.update(id, payload);
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

Then('updated employee payroll should match business rules', async function (this: CustomWorld) {
  const client = getClient(this);
  const id = this.data['existingEmployeeId'] as string;
  const updated = this.data['updatedPayload'] as EmployeePayload;
  const expected = calculateCompensation(updated.dependants);

  const getResponse = await client.getById(id);
  expect(getResponse.status).toBe(200);
  expect(getResponse.body.gross).toBeCloseTo(expected.grossPerPaycheck, 2);
  expect(getResponse.body.benefitsCost).toBeCloseTo(expected.benefitsCostPerPaycheck, 2);
  expect(getResponse.body.net).toBeCloseTo(expected.netPerPaycheck, 2);
});
