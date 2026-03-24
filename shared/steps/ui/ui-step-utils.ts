import { CustomWorld } from '../../fixtures/world';
import { BenefitsDashboardPage } from '../../pages/benefits-dashboard.page';
import { EmployeePayload } from '../../test-data/employee.builder';

export function getDashboard(world: CustomWorld): BenefitsDashboardPage {
  let dashboard = world.data['dashboardPage'] as BenefitsDashboardPage | undefined;
  if (!dashboard) {
    dashboard = new BenefitsDashboardPage(world.page);
    world.data['dashboardPage'] = dashboard;
  }
  return dashboard;
}

export function requireSelectedEmployeeId(world: CustomWorld): string {
  const id = world.data['selectedEmployeeId'];
  if (!id || typeof id !== 'string') {
    throw new Error(
      'Missing employee prerequisite. Add @requiresEmployee to the scenario or seed employee data explicitly.',
    );
  }
  return id;
}

export function requireSelectedEmployeePayload(world: CustomWorld): EmployeePayload {
  const payload = world.data['selectedEmployeePayload'];
  if (!payload || typeof payload !== 'object') {
    throw new Error(
      'Missing seeded employee payload. Ensure @requiresEmployee hook or explicit prerequisite setup is used.',
    );
  }
  return payload as EmployeePayload;
}
