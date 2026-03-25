import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../fixtures/world';
import { getClient } from './api-step-utils';

Given('I use authentication variation {string}', async function (this: CustomWorld, authVariation: string) {
  this.data['authVariation'] = authVariation;
});

When('I request all employees with the selected auth variation', async function (this: CustomWorld) {
  const variation = this.data['authVariation'] as string;
  const client = getClient(this);

  if (variation === 'missing') {
    this.data['response'] = await client.getAll({ token: '' });
    return;
  }

  if (variation === 'invalid-token') {
    this.data['response'] = await client.getAll({ token: 'invalid-token-value' });
    return;
  }

  if (variation === 'wrong-scheme') {
    const raw = await this.apiContext.get('api/Employees', {
      headers: { Authorization: 'Digest invalid' },
    });
    this.data['response'] = { status: raw.status(), body: await raw.text() };
    return;
  }

  this.data['response'] = await client.getAll();
});

Then('auth outcome should be {string}', async function (this: CustomWorld, outcome: string) {
  const response = this.data['response'] as { status: number };

  if (outcome === 'accepted') {
    expect(response.status).toBe(200);
    return;
  }

  expect([400, 401, 403]).toContain(response.status);
});
