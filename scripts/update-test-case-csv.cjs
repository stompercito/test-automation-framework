const fs = require('fs');
const path = require('path');

const defaultReportPath = path.resolve(__dirname, '..', 'reports', 'json', 'cucumber-report.json');
const defaultCsvPath = path.resolve(__dirname, '..', 'reports', 'csv', 'paylocity-test-cases.csv');

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith('--')) {
      continue;
    }

    const key = current.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

function formatTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function parseCsv(content) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(cell);
      cell = '';
      continue;
    }

    if (char === '\r') {
      if (next === '\n') {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function stringifyCsv(rows) {
  const escapeCell = (value) => {
    const text = String(value ?? '');
    if (/[",\r\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  return `${rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')}\r\n`;
}

function extractTestCaseId(name) {
  const match = String(name ?? '').match(/^\[([^\]]+)\]/);
  return match ? match[1] : undefined;
}

function normalizeScenarioStatus(steps) {
  const statuses = (steps ?? [])
    .map((step) => step?.result?.status)
    .filter(Boolean);

  if (statuses.length === 0) {
    return 'NOT_RUN';
  }

  if (statuses.some((status) => ['failed', 'ambiguous', 'undefined', 'pending'].includes(status))) {
    return 'FAIL';
  }

  if (statuses.every((status) => status === 'passed')) {
    return 'PASS';
  }

  if (statuses.every((status) => status === 'skipped')) {
    return 'SKIPPED';
  }

  if (statuses.includes('passed') && statuses.includes('skipped')) {
    return 'PARTIAL';
  }

  return String(statuses[0]).toUpperCase();
}

function aggregateStatuses(statuses) {
  if (statuses.length === 0) {
    return 'NOT_RUN';
  }

  if (statuses.some((status) => status === 'FAIL')) {
    return 'FAIL';
  }

  if (statuses.every((status) => status === 'PASS')) {
    return 'PASS';
  }

  if (statuses.every((status) => status === 'SKIPPED')) {
    return 'SKIPPED';
  }

  if (statuses.every((status) => status === 'NOT_RUN')) {
    return 'NOT_RUN';
  }

  return 'PARTIAL';
}

function loadCaseResults(reportPath) {
  const reportContent = fs.readFileSync(reportPath, 'utf8');
  const parsedReport = JSON.parse(reportContent);
  const caseResults = new Map();

  for (const feature of parsedReport) {
    for (const element of feature.elements ?? []) {
      const testCaseId = extractTestCaseId(element.name);
      if (!testCaseId) {
        continue;
      }

      const entry = caseResults.get(testCaseId) ?? [];
      entry.push({
        name: element.name,
        line: Number(element.line) || 0,
        status: normalizeScenarioStatus(element.steps),
      });
      caseResults.set(testCaseId, entry);
    }
  }

  for (const [testCaseId, entries] of caseResults.entries()) {
    entries.sort((left, right) => left.line - right.line);
    caseResults.set(testCaseId, entries);
  }

  return caseResults;
}

function buildLastExecutionValue(entries, timestamp) {
  const statuses = entries.map((entry) => entry.status);
  const overallStatus = aggregateStatuses(statuses);

  if (entries.length === 1) {
    return `${timestamp} | ${overallStatus}`;
  }

  const exampleStatuses = entries
    .map((entry, index) => `#1.${index + 1} ${entry.status}`)
    .join(' | ');

  return `${timestamp} | ${overallStatus} | ${exampleStatuses}`;
}

function updateCsvFromCucumberReport(options = {}) {
  const reportPath = path.resolve(options.reportPath ?? defaultReportPath);
  const csvPath = path.resolve(options.csvPath ?? defaultCsvPath);
  const timestamp = options.timestamp ?? formatTimestamp();

  if (!fs.existsSync(reportPath)) {
    throw new Error(`Cucumber JSON report not found at "${reportPath}".`);
  }

  if (!fs.existsSync(csvPath)) {
    throw new Error(`Test cases CSV not found at "${csvPath}".`);
  }

  const caseResults = loadCaseResults(reportPath);
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(csvContent);

  if (rows.length === 0) {
    throw new Error(`CSV "${csvPath}" is empty.`);
  }

  const header = rows[0];
  const testCaseIdIndex = header.indexOf('test_case_id');
  const lastExecutionIndex = header.indexOf('last_execution');

  if (testCaseIdIndex === -1 || lastExecutionIndex === -1) {
    throw new Error('CSV must contain "test_case_id" and "last_execution" columns.');
  }

  const malformedRows = rows
    .slice(1)
    .map((row, index) => ({
      logicalRowNumber: index + 2,
      testCaseId: row[testCaseIdIndex] ?? '(missing test_case_id)',
      columnCount: row.length,
    }))
    .filter((row) => row.columnCount !== header.length);

  if (malformedRows.length > 0) {
    const details = malformedRows
      .slice(0, 10)
      .map(
        (row) =>
          `${row.testCaseId} at logical CSV row ${row.logicalRowNumber} has ${row.columnCount} columns (expected ${header.length}).`,
      )
      .join(' ');

    throw new Error(
      `CSV contains malformed rows with unbalanced columns. Fix the quoting before syncing results. ${details}`,
    );
  }

  let updatedCount = 0;

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    while (row.length < header.length) {
      row.push('');
    }

    const testCaseId = row[testCaseIdIndex];
    const entries = caseResults.get(testCaseId);
    if (!entries) {
      continue;
    }

    row[lastExecutionIndex] = buildLastExecutionValue(entries, timestamp);
    updatedCount += 1;
  }

  fs.writeFileSync(csvPath, stringifyCsv(rows), 'utf8');

  return {
    csvPath,
    reportPath,
    updatedCount,
    matchedCases: caseResults.size,
    timestamp,
  };
}

if (require.main === module) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const summary = updateCsvFromCucumberReport({
      reportPath: args.report,
      csvPath: args.csv,
      timestamp: args.timestamp,
    });

    console.log(
      `Updated ${summary.updatedCount} test case rows in ${summary.csvPath} using ${summary.reportPath} at ${summary.timestamp}.`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

module.exports = {
  updateCsvFromCucumberReport,
  formatTimestamp,
  parseCsv,
  stringifyCsv,
};
