import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { buildEmployeePayload, buildInvalidNameVariation, EmployeePayload } from '../../test-data/employee.builder';
import { CustomWorld } from '../../fixtures/world';
import { calculateCompensation } from '../../utils/payroll';
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

Given('I have an employee payload using invalid API name variation {string}', async function (
  this: CustomWorld,
  nameCase: string,
) {
  this.data['employeePayload'] = buildInvalidNameVariation(nameCase);
  this.data['invalidApiNameVariation'] = nameCase;
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

Then('invalid API name handling should be enforced or exposed as a defect', async function (this: CustomWorld) {
  const response = this.data['response'] as {
    status: number;
    body?: { firstName?: string; lastName?: string; id?: string };
  };
  const payload = this.data['employeePayload'] as EmployeePayload;
  const nameCase = (this.data['invalidApiNameVariation'] as string | undefined) ?? 'unknown invalid API name variation';

  await this.attach(
    JSON.stringify(
      {
        nameVariation: nameCase,
        status: response.status,
        requestPayload: payload,
        responseBody: response.body ?? null,
      },
      null,
      2,
    ),
    'application/json',
  );

  if (response.status >= 400) {
    return;
  }

  expect(response.status, `Expected invalid API name variation "${nameCase}" to be rejected with a 4xx response.`).toBe(200);
  expect(
    response.body?.firstName,
    `API accepted invalid API name variation "${nameCase}" and also returned a mismapped firstName property.`,
  ).toBe(payload.firstName);
  expect(
    response.body?.lastName,
    `API accepted invalid API name variation "${nameCase}" and also returned a mismapped lastName property.`,
  ).toBe(payload.lastName);

  throw new Error(
    `API accepted invalid API name variation "${nameCase}" with status 200. This is being flagged as a defect.`,
  );
});

Then('the created employee payroll should match business rules', async function (this: CustomWorld) {
  const response = this.data['response'] as {
    status: number;
    body: { gross: number; benefitsCost: number; net: number };
  };
  const payload = this.data['employeePayload'] as EmployeePayload;
  const expected = calculateCompensation(payload.dependants);

  expect(response.status).toBe(200);
  expect(response.body.gross).toBeCloseTo(expected.grossPerPaycheck, 2);
  expect(response.body.benefitsCost).toBeCloseTo(expected.benefitsCostPerPaycheck, 2);
  expect(response.body.net).toBeCloseTo(expected.netPerPaycheck, 2);
});

Then(
  'payroll business rules should be respected for dependants outcome {string}',
  async function (this: CustomWorld, outcome: string) {
    if (outcome !== 'accepted') {
      return;
    }

    const response = this.data['response'] as {
      status: number;
      body: { gross: number; benefitsCost: number; net: number };
    };
    const payload = this.data['employeePayload'] as EmployeePayload;
    const expected = calculateCompensation(payload.dependants);

    expect(response.status).toBe(200);
    expect(response.body.gross).toBeCloseTo(expected.grossPerPaycheck, 2);
    expect(response.body.benefitsCost).toBeCloseTo(expected.benefitsCostPerPaycheck, 2);
    expect(response.body.net).toBeCloseTo(expected.netPerPaycheck, 2);
  },
);
