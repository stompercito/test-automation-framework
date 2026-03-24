import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { buildEmployeePayload } from '../../../../shared/test-data/employee.builder';
import { CustomWorld } from '../../../../shared/fixtures/world';
import { EmployeesClient } from '../clients/employees.client';

Given('I have a valid employee payload', async function (this: CustomWorld) {
  this.data['employeePayload'] = buildEmployeePayload();
});

When('I create the employee via API', async function (this: CustomWorld) {
  const client = new EmployeesClient(this.apiContext);
  const payload = this.data['employeePayload'] as ReturnType<typeof buildEmployeePayload>;
  const response = await client.create(payload);

  this.data['employeeResponse'] = response;
  if (response.status === 200 && response.body.id) {
    this.trackEmployeeId(response.body.id);
  }
});

Then('the employee is created successfully', async function (this: CustomWorld) {
  const response = this.data['employeeResponse'] as { status: number; body: { id: string } };
  expect(response.status).toBe(200);
  expect(response.body.id).toBeTruthy();
});
