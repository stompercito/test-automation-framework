import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { config } from '../../config/config';
import { CustomWorld } from '../../fixtures/world';
import { getClient } from './api-step-utils';

function buildNearValidInvalidToken(token: string): string {
  const source = token.trim();
  if (!source) {
    return 'cmVwbGFjZV9tZV9idXRfaW52YWxpZA==';
  }

  const chars = source.split('');
  for (let i = chars.length - 1; i >= 0; i -= 1) {
    if (chars[i] === '=') {
      continue;
    }

    chars[i] = chars[i] === 'A' ? 'B' : 'A';
    return chars.join('');
  }

  return source;
}

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
    this.data['response'] = await client.getAll({
      token: buildNearValidInvalidToken(config.apiAuth.token),
    });
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
  const response = this.data['response'] as { status: number; body?: unknown };
  const variation = this.data['authVariation'] as string | undefined;

  if (outcome === 'accepted') {
    await this.attach(
      JSON.stringify({ authVariation: variation, expectedOutcome: outcome, status: response.status, body: response.body }, null, 2),
      'application/json',
    );
    expect(
      response.status,
      `Authentication variation "${variation}" was expected to be accepted, but returned status ${response.status}.`,
    ).toBe(200);
    return;
  }

  await this.attach(
    JSON.stringify({ authVariation: variation, expectedOutcome: outcome, status: response.status, body: response.body }, null, 2),
    'application/json',
  );

  const allowedStatuses = [400, 401, 403];
  expect(
    allowedStatuses.includes(response.status),
    `Authentication variation "${variation}" was expected to be rejected with one of ${allowedStatuses.join(', ')}, but returned ${response.status}. This usually indicates a real API behavior issue rather than a test-runner problem.`,
  ).toBeTruthy();
});
