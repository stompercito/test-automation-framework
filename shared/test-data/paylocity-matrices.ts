import fs from 'fs';
import path from 'path';
import { parseCsv } from '../utils/csv';

export type MatrixRow = {
  matrix_id: string;
  linked_test_case_id: string;
  target: string;
  field: string;
  dataset_name: string;
  input_value: string;
  expected_outcome: string;
  dataset_notes: string;
};

function loadMatrixRows(): MatrixRow[] {
  const csvPath = path.resolve(process.cwd(), 'reports/csv/paylocity-test-data-matrices.csv');
  const content = fs.readFileSync(csvPath, 'utf8');
  return parseCsv(content) as MatrixRow[];
}

function byMatrixId(matrixId: string): MatrixRow[] {
  return loadMatrixRows().filter((row) => row.matrix_id === matrixId);
}

export function getApiRequiredFieldRows(): MatrixRow[] {
  return byMatrixId('DDT-API-REQ-FIELDS');
}

export function getApiDependantsRows(): Array<MatrixRow & { numericValue: number; expectedValid: boolean }> {
  return byMatrixId('DDT-API-DEPENDANTS').map((row) => ({
    ...row,
    numericValue: Number(row.input_value),
    expectedValid: row.expected_outcome.toLowerCase() === 'accepted',
  }));
}

export function getApiStringLengthRows(): Array<MatrixRow & { lengthValue: number; expectedValid: boolean }> {
  return byMatrixId('DDT-API-STRING-LEN').map((row) => {
    const lengthValue = Number(row.input_value.split(' ')[0]);
    const normalized = row.expected_outcome.toLowerCase();
    const expectedValid = normalized.startsWith('accepted');

    return {
      ...row,
      lengthValue,
      expectedValid,
    };
  });
}

export function getApiInvalidUuidRows(): Array<MatrixRow & { resolvedId: string }> {
  const map: Record<string, string> = {
    'plain-text': 'not-a-uuid',
    'numeric-string': '12345',
    'empty-string': '',
    'wrong-length-uuid': '12345678-1234-1234-1234-12345678901',
  };

  return byMatrixId('DDT-API-INVALID-UUID').map((row) => ({
    ...row,
    resolvedId: map[row.input_value] ?? row.input_value,
  }));
}

export function getApiReadonlyRows(): MatrixRow[] {
  return byMatrixId('DDT-API-READONLY');
}

export function getApiExtraPropRows(): MatrixRow[] {
  return byMatrixId('DDT-API-EXTRA-PROPS');
}

export function getApiAuthRows(): Array<MatrixRow & { expectedValid: boolean }> {
  return byMatrixId('DDT-API-AUTH').map((row) => ({
    ...row,
    expectedValid: row.expected_outcome.toLowerCase() === 'accepted',
  }));
}

export function getUiDependantsRows(): MatrixRow[] {
  return byMatrixId('DDT-UI-DEPENDANTS-INVALID');
}

export function getUiRequiredRows(): MatrixRow[] {
  return byMatrixId('DDT-UI-REQ-FIELDS');
}
