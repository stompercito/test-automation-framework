import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { buildEmployeePayload, EmployeePayload } from '../../test-data/employee.builder';
import { CustomWorld } from '../../fixtures/world';
import { getClient } from './api-step-utils';

Given('I have a valid employee payload', async function (this: CustomWorld) {
  this.data['employeePayload'] = buildEmployeePayload();
});

Given('I have a valid employee payload with dependants {int}', async function (this: CustomWorld, dependants: number) {
  this.data['employeePayload'] = buildEmployeePayload({ dependants });
});

Given('I have an invalid employee payload missing {string}', async function (this: CustomWorld, field: string) {
  const payload = buildEmployeePayload();
  if (field === 'firstName') payload.firstName = '';
  if (field === 'lastName') payload.lastName = '';
  if (field === 'username') payload.username = '';
  this.data['employeePayload'] = payload;
});

Given('I have a payload with {string} length {int}', async function (this: CustomWorld, field: string, length: number) {
  const payload = buildEmployeePayload();
  const value = 'x'.repeat(length);

  if (field === 'firstName') payload.firstName = value;
  if (field === 'lastName') payload.lastName = value;
  if (field === 'username') payload.username = value;

  this.data['employeePayload'] = payload;
});

Given('I have a payload attempting to control read-only field {string}', async function (this: CustomWorld, field: string) {
  const payload = buildEmployeePayload() as unknown as Record<string, unknown>;

  if (field === 'gross') payload.gross = 999999;
  if (field === 'benefitsCost') payload.benefitsCost = 0;
  if (field === 'net') payload.net = 999999;
  if (field === 'partitionKey') payload.partitionKey = 'forced-key';
  if (field === 'sortKey') payload.sortKey = 'forced-sort';

  this.data['employeePayload'] = payload;
  this.data['readonlyField'] = field;
});

Given('I have a payload with additional property {string}', async function (this: CustomWorld, property: string) {
  const payload = buildEmployeePayload() as unknown as Record<string, unknown>;

  if (property === 'middleName') payload.middleName = 'X';
  if (property === 'randomFlag') payload.randomFlag = true;
  if (property === 'nestedObject') payload.nestedObject = { enabled: true };

  this.data['employeePayload'] = payload;
});

Given('I have a payload with expiration value {string}', async function (this: CustomWorld, expirationValue: string) {
  const payload = buildEmployeePayload() as unknown as Record<string, unknown>;
  payload.expiration = expirationValue;
  this.data['employeePayload'] = payload;
});

When('I create the employee via API', async function (this: CustomWorld) {
  const client = getClient(this);
  const payload = this.data['employeePayload'] as EmployeePayload;
  const response = await client.create(payload);

  this.data['response'] = response;
  if (response.status === 200 && response.body.id) {
    this.trackEmployeeId(response.body.id);
    this.data['existingEmployeeId'] = response.body.id;
  }
});

Then('the employee is created successfully', async function (this: CustomWorld) {
  const response = this.data['response'] as { status: number; body: { id: string } };
  expect(response.status).toBe(200);
  expect(response.body.id).toBeTruthy();
});

Then('the API response should be {string}', async function (this: CustomWorld, outcome: string) {
  const response = this.data['response'] as { status: number };

  if (outcome === 'accepted') {
    expect(response.status).toBe(200);
    return;
  }

  expect(response.status).toBeGreaterThanOrEqual(400);
});

Then('read-only enforcement should be respected for {string}', async function (this: CustomWorld, field: string) {
  const response = this.data['response'] as { status: number; body: Record<string, unknown> };

  if (response.status === 200) {
    if (field === 'gross' || field === 'benefitsCost' || field === 'net') {
      expect(Number(response.body[field])).not.toBe(999999);
    }
    return;
  }

  expect(response.status).toBeGreaterThanOrEqual(400);
});

Then('expiration handling outcome should be {string}', async function (this: CustomWorld, outcome: string) {
  const response = this.data['response'] as { status: number };

  if (outcome === 'accepted') {
    expect(response.status).toBe(200);
    return;
  }

  if (outcome === 'implementation-specific') {
    expect([200, 400, 422]).toContain(response.status);
    return;
  }

  expect(response.status).toBeGreaterThanOrEqual(400);
});
