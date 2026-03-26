import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../fixtures/world';
import { getClient } from './api-step-utils';

When('I request {string} with invalid employee id', async function (this: CustomWorld, operation: string) {
  const client = getClient(this);
  const invalidId = this.data['requestedEmployeeId'] as string;

  if (operation.toLowerCase() === 'delete') {
    this.data['response'] = await client.deleteById(invalidId);
    return;
  }

  this.data['response'] = await client.getById(invalidId);
});

Then('the API response should be a client error', async function (this: CustomWorld) {
  const response = this.data['response'] as { status: number; body?: unknown };
  const requestedEmployeeId = this.data['requestedEmployeeId'] as string | undefined;

  await this.attach(
    JSON.stringify(
      {
        requestedEmployeeId,
        status: response.status,
        body: response.body,
      },
      null,
      2,
    ),
    'application/json',
  );

  const isClientError = response.status >= 400 && response.status < 500;
  expect(
    isClientError,
    `Expected a 4xx client error for invalid employee id "${requestedEmployeeId}", but received status ${response.status}.`,
  ).toBeTruthy();
});
