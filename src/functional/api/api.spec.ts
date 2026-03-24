import { test } from '@playwright/test';

test.describe('Template API', () => {
  test.skip('example: GET endpoint check', async ({ request }) => {
    // Template only:
    // const response = await request.get('/your-endpoint');
    // expect(response.status()).toBe(200);
  });

  test.skip('example: POST endpoint check', async ({ request }) => {
    // Template only:
    // const response = await request.post('/your-endpoint', { data: { key: 'value' } });
    // expect(response.status()).toBe(201);
  });
});
