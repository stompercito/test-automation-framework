import { uniqueSuffix } from '../utils/helpers';

export type EmployeePayload = {
  firstName: string;
  lastName: string;
  dependants: number;
  username: string;
};

export function buildEmployeePayload(overrides: Partial<EmployeePayload> = {}): EmployeePayload {
  const suffix = uniqueSuffix();

  return {
    firstName: (`FN_${suffix}`).slice(0, 50),
    lastName: (`LN_${suffix}`).slice(0, 50),
    username: (`user_${suffix}`).slice(0, 50),
    dependants: 0,
    ...overrides,
  };
}

export function requiredFieldNegativeCases() {
  const base = buildEmployeePayload();
  return [
    { name: 'missing firstName', payload: { ...base, firstName: '' }, field: 'firstName' },
    { name: 'missing lastName', payload: { ...base, lastName: '' }, field: 'lastName' },
    { name: 'missing username', payload: { ...base, username: '' }, field: 'username' },
  ];
}

export function stringBoundaryCases() {
  const exactly50 = 'a'.repeat(50);
  const moreThan50 = 'b'.repeat(51);

  return [
    { name: 'firstName length 50', payload: buildEmployeePayload({ firstName: exactly50 }), expectedValid: true },
    { name: 'firstName length 51', payload: buildEmployeePayload({ firstName: moreThan50 }), expectedValid: false },
    { name: 'lastName length 50', payload: buildEmployeePayload({ lastName: exactly50 }), expectedValid: true },
    { name: 'lastName length 51', payload: buildEmployeePayload({ lastName: moreThan50 }), expectedValid: false },
    { name: 'username length 50', payload: buildEmployeePayload({ username: exactly50 }), expectedValid: true },
    { name: 'username length 51', payload: buildEmployeePayload({ username: moreThan50 }), expectedValid: false },
  ];
}

export function dependantsBoundaryCases() {
  return [
    { name: 'dependants min 0', payload: buildEmployeePayload({ dependants: 0 }), expectedValid: true },
    { name: 'dependants max 32', payload: buildEmployeePayload({ dependants: 32 }), expectedValid: true },
    { name: 'dependants below min', payload: buildEmployeePayload({ dependants: -1 }), expectedValid: false },
    { name: 'dependants above max', payload: buildEmployeePayload({ dependants: 33 }), expectedValid: false },
  ];
}

export function invalidUuidCases() {
  return ['abc', '1234', '00000000-0000-0000-0000-00000000000Z'];
}
