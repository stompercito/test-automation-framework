import { uniqueSuffix } from '../utils/helpers';

export type EmployeePayload = {
  firstName: string;
  lastName: string;
  dependants: number;
  username: string;
};

const REALISTIC_FIRST_NAMES = [
  'Olivia',
  'Ethan',
  'Sofia',
  'Mateo',
  'Camila',
  'Lucas',
  'Valeria',
  'Daniel',
  'Elena',
  'Adrian',
] as const;

const REALISTIC_LAST_NAMES = [
  'Garcia',
  'Martinez',
  'Lopez',
  'Hernandez',
  'Gonzalez',
  'Rivera',
  'Torres',
  'Flores',
  'Ramirez',
  'Castillo',
] as const;

function sumCharCodes(value: string): number {
  return value.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
}

function buildReadableSuffix(rawSuffix: string): string {
  return rawSuffix.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toLowerCase();
}

export function buildEmployeePayload(overrides: Partial<EmployeePayload> = {}): EmployeePayload {
  const suffix = uniqueSuffix();
  const suffixScore = sumCharCodes(suffix);
  const readableSuffix = buildReadableSuffix(suffix);
  const baseFirstName = REALISTIC_FIRST_NAMES[suffixScore % REALISTIC_FIRST_NAMES.length];
  const baseLastName = REALISTIC_LAST_NAMES[(suffixScore + 3) % REALISTIC_LAST_NAMES.length];

  return {
    firstName: `${baseFirstName}${readableSuffix}`.slice(0, 50),
    lastName: `${baseLastName}${readableSuffix}`.slice(0, 50),
    username: `${baseFirstName.toLowerCase()}.${baseLastName.toLowerCase()}.${readableSuffix}`.slice(0, 50),
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

export function buildUiInvalidDependantsVariation(caseName: string) {
  const base = buildEmployeePayload({ dependants: 1 });

  switch (caseName) {
    case 'negative dependants':
      return { ...base, dependants: '-1' };
    case 'dependants above max':
      return { ...base, dependants: '33' };
    case 'decimal dependants':
      return { ...base, dependants: '1.5' };
    case 'text dependants':
      return { ...base, dependants: 'abc' };
    case 'blank dependants':
      return { ...base, dependants: '' };
    case 'spaces only dependants':
      return { ...base, dependants: '   ' };
    case 'mixed dependants text':
      return { ...base, dependants: '12abc' };
    default:
      throw new Error(`Unsupported invalid dependants variation: ${caseName}`);
  }
}

export function buildInvalidNameVariation(caseName: string) {
  const base = buildEmployeePayload({ dependants: 1 });
  const over50 = 'N'.repeat(51);

  switch (caseName) {
    case 'firstName numeric only':
      return { ...base, firstName: '12345' };
    case 'lastName numeric only':
      return { ...base, lastName: '12345' };
    case 'both names numeric only':
      return { ...base, firstName: '12345', lastName: '67890' };
    case 'firstName blank':
      return { ...base, firstName: '' };
    case 'lastName blank':
      return { ...base, lastName: '' };
    case 'both names blank':
      return { ...base, firstName: '', lastName: '' };
    case 'firstName spaces only':
      return { ...base, firstName: '   ' };
    case 'lastName spaces only':
      return { ...base, lastName: '   ' };
    case 'both names spaces only':
      return { ...base, firstName: '   ', lastName: '   ' };
    case 'firstName mixed alphanumeric':
      return { ...base, firstName: 'Ana123' };
    case 'lastName mixed alphanumeric':
      return { ...base, lastName: 'Lopez123' };
    case 'firstName over 50 chars':
      return { ...base, firstName: over50 };
    case 'lastName over 50 chars':
      return { ...base, lastName: over50 };
    case 'both names over 50 chars':
      return { ...base, firstName: over50, lastName: over50 };
    default:
      throw new Error(`Unsupported invalid name variation: ${caseName}`);
  }
}

export function buildUiInvalidNameVariation(caseName: string) {
  return buildInvalidNameVariation(caseName);
}

export function buildMissingRequiredEmployeeVariation(caseName: string) {
  const base = buildEmployeePayload({ dependants: 1 });

  switch (caseName) {
    case 'missing firstName':
      return { ...base, firstName: '' };
    case 'missing lastName':
      return { ...base, lastName: '' };
    case 'all visible fields empty':
      return {
        ...base,
        firstName: '',
        lastName: '',
        dependants: '' as unknown as number,
      };
    default:
      throw new Error(`Unsupported missing required variation: ${caseName}`);
  }
}

export function buildUiValidAddBoundaryVariation(caseName: string) {
  const minName = 'A';
  const maxName = 'M'.repeat(50);

  switch (caseName) {
    case 'min names and min dependants':
      return buildEmployeePayload({ firstName: minName, lastName: minName, dependants: 0 });
    case 'max names and max dependants':
      return buildEmployeePayload({ firstName: maxName, lastName: maxName, dependants: 32 });
    case 'typical names and zero dependants':
      return buildEmployeePayload({ firstName: 'Taylor', lastName: 'Jordan', dependants: 0 });
    case 'typical names and max dependants':
      return buildEmployeePayload({ firstName: 'Taylor', lastName: 'Jordan', dependants: 32 });
    default:
      throw new Error(`Unsupported valid add boundary variation: ${caseName}`);
  }
}
