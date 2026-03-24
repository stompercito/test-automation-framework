import { After, Before } from '@cucumber/cucumber';
import { request } from '@playwright/test';
import { config } from '../config/config';
import { CustomWorld } from './world';
import { EmployeesClient } from '../../src/functional/api/clients/employees.client';

Before(async function (this: CustomWorld) {
  this.apiContext = await request.newContext({
    baseURL: config.apiBaseUrl,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
});

After(async function (this: CustomWorld) {
  if (this.apiContext && this.createdEmployeeIds.length > 0) {
    const employeesClient = new EmployeesClient(this.apiContext);
    for (const id of this.createdEmployeeIds) {
      try {
        await employeesClient.deleteById(id);
      } catch {
        // Best-effort cleanup to avoid masking test failures.
      }
    }
  }

  await this.apiContext?.dispose();

  this.data = {};
  this.createdEmployeeIds = [];
});
