import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../fixtures/world';
import { getClient } from './api-step-utils';

When('I delete the seeded employee by id', async function (this: CustomWorld) {
  const client = getClient(this);
  const id = this.data['existingEmployeeId'] as string;

  this.data['response'] = await client.deleteById(id);
  this.data['deletedEmployeeId'] = id;
});

Then('the deleted employee should no longer be retrievable', async function (this: CustomWorld) {
  const client = getClient(this);
  const deletedId = this.data['deletedEmployeeId'] as string;

  const getAfterDelete = await client.getById(deletedId);
  expect([400, 404]).toContain(getAfterDelete.status);
});
