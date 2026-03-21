import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../../../shared/fixtures/world';
import { PostsClient, NewPost, Post } from '../clients/posts.client';

/**
 * Step definitions for the Posts API feature.
 *
 * All HTTP calls go through PostsClient which extends the shared ApiClient
 * base class, keeping step definitions focused on assertions only.
 */

let lastResponse: { status: number; body: unknown };

When('I send a GET request to {string}', async function (this: CustomWorld, path: string) {
  const client = new PostsClient(this.apiContext);
  if (path === '/posts') {
    lastResponse = await client.getAll();
  } else {
    const id = Number(path.split('/').pop());
    lastResponse = await client.getById(id);
  }
  this.data['response'] = lastResponse;
});

Given(
  'I have a new post with title {string} and body {string}',
  async function (this: CustomWorld, title: string, body: string) {
    this.data['newPost'] = { userId: 1, title, body } satisfies NewPost;
  },
);

When('I send a POST request to {string}', async function (this: CustomWorld, _path: string) {
  const client = new PostsClient(this.apiContext);
  const post = this.data['newPost'] as NewPost;
  lastResponse = await client.create(post);
  this.data['response'] = lastResponse;
});

Given(
  'I have an update for post {int} with title {string}',
  async function (this: CustomWorld, id: number, title: string) {
    this.data['updateId'] = id;
    this.data['updatePayload'] = { title };
  },
);

When('I send a PUT request to {string}', async function (this: CustomWorld, _path: string) {
  const client = new PostsClient(this.apiContext);
  const id = this.data['updateId'] as number;
  const payload = this.data['updatePayload'] as Partial<Post>;
  lastResponse = await client.update(id, payload);
  this.data['response'] = lastResponse;
});

When('I send a DELETE request to {string}', async function (this: CustomWorld, path: string) {
  const client = new PostsClient(this.apiContext);
  const id = Number(path.split('/').pop());
  lastResponse = await client.remove(id);
  this.data['response'] = lastResponse;
});

Then('the response status should be {int}', async function (this: CustomWorld, expectedStatus: number) {
  const response = this.data['response'] as { status: number; body: unknown };
  expect(response.status).toBe(expectedStatus);
});

Then('the response body should contain a list of posts', async function (this: CustomWorld) {
  const response = this.data['response'] as { status: number; body: unknown[] };
  expect(Array.isArray(response.body)).toBe(true);
  expect(response.body.length).toBeGreaterThan(0);
});

Then('the post should have a title and body', async function (this: CustomWorld) {
  const response = this.data['response'] as { status: number; body: Post };
  expect(response.body.title).toBeTruthy();
  expect(response.body.body).toBeTruthy();
});

Then('the created post should have the title {string}', async function (this: CustomWorld, title: string) {
  const response = this.data['response'] as { status: number; body: Post };
  expect(response.body.title).toBe(title);
});

Then('the post title should be {string}', async function (this: CustomWorld, title: string) {
  const response = this.data['response'] as { status: number; body: Post };
  expect(response.body.title).toBe(title);
});
