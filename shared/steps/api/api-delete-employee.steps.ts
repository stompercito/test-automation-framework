import { Then, When } from '@cucumber/cucumber';
import { CustomWorld } from '../../fixtures/world';
import { getClient } from './api-step-utils';

When('I delete the seeded employee by id', async function (this: CustomWorld) {
  const client = getClient(this);
  const id = this.data['existingEmployeeId'] as string;

  this.data['response'] = await client.deleteById(id);
  this.data['deletedEmployeeId'] = id;
  this.data['requestedEmployeeId'] = id;
});
