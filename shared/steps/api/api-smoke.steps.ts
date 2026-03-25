import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { buildEmployeePayload, EmployeePayload } from '../../test-data/employee.builder';
import { config } from '../../config/config';
import { CustomWorld } from '../../fixtures/world';
import { calculateCompensation } from '../../utils/payroll';
import { getClient } from './api-step-utils';

Given('API smoke prerequisites are ready for {string}', async function (this: CustomWorld, operation: string) {
  const normalized = operation.toLowerCase();
  const client = getClient(this);

  if (normalized === 'create') {
    this.data['smokePayload'] = buildEmployeePayload();
    this.data['smokeRequestPayload'] = this.data['smokePayload'];
    return;
  }

  const payload = buildEmployeePayload();
  const created = await client.create(payload);
  expect(created.status).toBe(200);

  this.trackEmployeeId(created.body.id);
  this.data['existingEmployeeId'] = created.body.id;
  this.data['smokeSeedPayload'] = payload;

  if (normalized === 'update') {
    this.data['smokeUpdatePayload'] = buildEmployeePayload({ dependants: 3 });
  }
});

When('I execute API smoke operation {string}', async function (this: CustomWorld, operation: string) {
  const normalized = operation.toLowerCase();
  const client = getClient(this);

  if (normalized === 'create') {
    const payload = this.data['smokePayload'] as EmployeePayload;
    const response = await client.create(payload);
    this.data['smokeRequestPayload'] = payload;
    this.data['response'] = response;
    if (response.status === 200 && response.body.id) {
      this.trackEmployeeId(response.body.id);
    }
    return;
  }

  const existingId = this.data['existingEmployeeId'] as string;

  if (normalized === 'read') {
    this.data['smokeRequestPayload'] = null;
    this.data['response'] = await client.getById(existingId);
    return;
  }

  if (normalized === 'update') {
    const payload = this.data['smokeUpdatePayload'] as EmployeePayload;
    this.data['smokeRequestPayload'] = payload;
    this.data['response'] = await client.update(existingId, payload);
    return;
  }

  if (normalized === 'delete') {
    this.data['smokeRequestPayload'] = null;
    this.data['response'] = await client.deleteById(existingId);
    return;
  }

  throw new Error(`Unsupported smoke operation: ${operation}`);
});

Then('API smoke operation {string} should return {string}', async function (
  this: CustomWorld,
  operation: string,
  expectedStatus: string,
) {
  const normalized = operation.toLowerCase();
  const response = this.data['response'] as { status: number };

  if (expectedStatus === '200-or-204' || normalized === 'delete') {
    expect([200, 204]).toContain(response.status);
    return;
  }

  expect(response.status).toBe(200);
});

Then('API smoke payroll should follow business rules for {string}', async function (this: CustomWorld, operation: string) {
  const normalized = operation.toLowerCase();
  if (normalized === 'delete') {
    return;
  }

  const response = this.data['response'] as {
    status: number;
    body: { gross: number; benefitsCost: number; net: number };
  };

  const payloadFromRequest = this.data['smokeRequestPayload'] as EmployeePayload | null;
  const payloadFromSeed = this.data['smokeSeedPayload'] as EmployeePayload | undefined;
  const payload = payloadFromRequest ?? payloadFromSeed;

  if (!payload) {
    throw new Error(`Missing payload context to validate payroll for API smoke operation: ${operation}`);
  }

  const expected = calculateCompensation(payload.dependants);
  expect(response.status).toBe(200);
  expect(response.body.gross).toBeCloseTo(expected.grossPerPaycheck, 2);
  expect(response.body.benefitsCost).toBeCloseTo(expected.benefitsCostPerPaycheck, 2);
  expect(response.body.net).toBeCloseTo(expected.netPerPaycheck, 2);
});

Then(
  'I attach API smoke trace for operation {string} using {string} on {string}',
  async function (this: CustomWorld, operation: string, method: string, endpoint: string) {
    const response = this.data['response'] as { status: number; body?: unknown };
    const requestPayload = this.data['smokeRequestPayload'] as Partial<EmployeePayload> | null;
    const existingId = this.data['existingEmployeeId'] as string | undefined;

    const resolvedEndpoint =
      endpoint.includes('{id}') && existingId ? endpoint.replace('{id}', existingId) : endpoint;

    const payloadSummary = requestPayload
      ? {
          firstName: requestPayload.firstName ?? null,
          lastName: requestPayload.lastName ?? null,
          dependants: requestPayload.dependants ?? null,
        }
      : null;

    const trace = {
      operation,
      request: {
        actor: config.credentials.username,
        method,
        endpoint: resolvedEndpoint,
        payload: requestPayload,
        payloadSummary,
      },
      response: {
        status: response?.status,
        body: response?.body ?? null,
      },
    };

    await this.attach(JSON.stringify(trace, null, 2), 'application/json');
  },
);
