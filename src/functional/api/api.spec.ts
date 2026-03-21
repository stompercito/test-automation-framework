import { test, expect } from '@playwright/test';
import { PostsClient } from './clients/posts.client';

/**
 * Functional › API tests – Playwright native spec.
 *
 * These tests run without a browser and call the JSONPlaceholder API.
 * They demonstrate the API client abstraction and serve as fast, reliable
 * contract tests that can also be used as setup hooks in UI scenarios.
 *
 * Run with: npm run test:api
 */

test.describe('Posts API – CRUD operations', () => {
  let client: PostsClient;

  test.beforeEach(async ({ request }) => {
    client = new PostsClient(request);
  });

  test('GET /posts returns 200 and a non-empty list', async () => {
    const { status, body } = await client.getAll();
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  test('GET /posts/1 returns a single post', async () => {
    const { status, body } = await client.getById(1);
    expect(status).toBe(200);
    expect(body.id).toBe(1);
    expect(body.title).toBeTruthy();
  });

  test('POST /posts creates a new post and returns 201', async () => {
    const { status, body } = await client.create({
      userId: 1,
      title: 'Automated Test Post',
      body: 'Created by the test automation framework',
    });
    expect(status).toBe(201);
    expect(body.title).toBe('Automated Test Post');
  });

  test('PUT /posts/1 updates the post title', async () => {
    const { status, body } = await client.update(1, { title: 'Updated Title' });
    expect(status).toBe(200);
    expect(body.title).toBe('Updated Title');
  });

  test('DELETE /posts/1 returns 200', async () => {
    const { status } = await client.remove(1);
    expect(status).toBe(200);
  });
});
