import { CustomWorld } from '../../fixtures/world';
import { EmployeesClient } from '../../clients/employees.client';

export function getClient(world: CustomWorld): EmployeesClient {
  return new EmployeesClient(world.apiContext);
}
