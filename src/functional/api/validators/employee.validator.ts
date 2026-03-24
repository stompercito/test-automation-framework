export type EmployeeResponse = {
  id: string;
  firstName: string;
  lastName: string;
  dependants: number;
  salary?: number;
  gross?: number;
  benefitsCost?: number;
  net?: number;
  username?: string;
  expiration?: string;
  partitionKey?: string;
  sortKey?: string;
};

export function assertEmployeeShape(employee: EmployeeResponse): void {
  if (!employee.id || typeof employee.id !== 'string') {
    throw new Error('Employee response is missing id');
  }
  if (typeof employee.firstName !== 'string' || typeof employee.lastName !== 'string') {
    throw new Error('Employee response must include firstName and lastName');
  }
  if (typeof employee.dependants !== 'number') {
    throw new Error('Employee response must include dependants as number');
  }
}
