import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../../../shared/fixtures/world';
import { NewPost, PostsClient } from '../clients/posts.client';

When(
  'I send a {string} request to {string}',
  async function (this: CustomWorld, method: string, path: string) {
    const client = new PostsClient(this.apiContext);
    const payload = this.data['requestPayload'] as NewPost | undefined;

    if (method === 'GET') {
      this.data['response'] = await client.getAll();
      return;
    }

    if (method === 'POST') {
      this.data['response'] = await client.create(payload ?? { userId: 1, title: '', body: '' });
      return;
    }

    throw new Error(`Unsupported method in template: ${method} ${path}`);
  },
);

Given(
  'I have a request payload with title {string} and body {string}',
  async function (this: CustomWorld, title: string, body: string) {
    this.data['requestPayload'] = { userId: 1, title, body } satisfies NewPost;
  },
);

Then('the response status should be {int}', async function (this: CustomWorld, expectedStatus: number) {
  const response = this.data['response'] as { status: number; body: unknown };
  expect(response.status).toBe(expectedStatus);
});
