const fs = require('fs');
const http = require('http');
const path = require('path');
const { parseCsv, stringifyCsv, formatTimestamp } = require('./update-test-case-csv.cjs');

const ROOT_DIR = path.resolve(__dirname, '..');
const DASHBOARD_DIR = path.join(ROOT_DIR, 'dashboard');
const TEST_CASES_CSV_PATH = path.join(ROOT_DIR, 'reports', 'csv', 'paylocity-test-cases.csv');
const BUG_REPORTS_CSV_PATH = path.join(ROOT_DIR, 'reports', 'csv', 'paylocity-bug-report.csv');
const DEFAULT_PORT = Number(process.env.PAYLOCITY_DASHBOARD_PORT || 4173);
const EDITABLE_CLASSIFICATIONS = new Set(['hybrid', 'manual']);
const ALLOWED_MANUAL_STATUSES = new Set(['PASS', 'FAIL', 'PARTIAL', 'BLOCKED', 'NOT_RUN']);

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

function normalizeRows(rows) {
  if (rows.length === 0) {
    return { header: [], objects: [] };
  }

  const [header, ...dataRows] = rows;
  const objects = dataRows.map((row) => {
    const normalized = [...row];
    while (normalized.length < header.length) {
      normalized.push('');
    }

    return header.reduce((accumulator, columnName, index) => {
      accumulator[columnName] = normalized[index] ?? '';
      return accumulator;
    }, {});
  });

  return { header, objects };
}

function readCsvObjects(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return normalizeRows(parseCsv(content));
}

function buildTestCaseResponse() {
  const { header, objects } = readCsvObjects(TEST_CASES_CSV_PATH);
  const summary = {
    total: objects.length,
    automatable: objects.filter((row) => row.classification === 'Automatable').length,
    hybrid: objects.filter((row) => row.classification === 'Hybrid').length,
    manual: objects.filter((row) => row.classification === 'Manual').length,
    pass: objects.filter((row) => /\bPASS\b/.test(row.last_execution)).length,
    fail: objects.filter((row) => /\bFAIL\b/.test(row.last_execution)).length,
    blank: objects.filter((row) => !String(row.last_execution ?? '').trim()).length,
  };

  return {
    generatedAt: formatTimestamp(),
    header,
    summary,
    rows: objects,
  };
}

function buildBugReportResponse() {
  const { header, objects } = readCsvObjects(BUG_REPORTS_CSV_PATH);

  return {
    generatedAt: formatTimestamp(),
    header,
    summary: {
      total: objects.length,
      critical: objects.filter((row) => row.severity === 'Critical').length,
      high: objects.filter((row) => row.severity === 'High').length,
      medium: objects.filter((row) => row.severity === 'Medium').length,
    },
    rows: objects,
  };
}

function updateTestCaseManualResult(testCaseId, status) {
  if (!ALLOWED_MANUAL_STATUSES.has(status)) {
    throw new Error(`Unsupported manual status "${status}".`);
  }

  const content = fs.readFileSync(TEST_CASES_CSV_PATH, 'utf8');
  const rows = parseCsv(content);
  const header = rows[0] ?? [];
  const testCaseIdIndex = header.indexOf('test_case_id');
  const classificationIndex = header.indexOf('classification');
  const lastExecutionIndex = header.indexOf('last_execution');

  if (testCaseIdIndex === -1 || classificationIndex === -1 || lastExecutionIndex === -1) {
    throw new Error('Test cases CSV is missing required columns.');
  }

  const targetRow = rows
    .slice(1)
    .find((row) => String(row[testCaseIdIndex] ?? '').trim() === testCaseId);

  if (!targetRow) {
    throw new Error(`Test case "${testCaseId}" was not found.`);
  }

  const classification = String(targetRow[classificationIndex] ?? '').trim().toLowerCase();
  if (!EDITABLE_CLASSIFICATIONS.has(classification)) {
    throw new Error(`Test case "${testCaseId}" is not editable from the dashboard.`);
  }

  targetRow[lastExecutionIndex] = `${formatTimestamp()} | ${status} | Dashboard review`;
  fs.writeFileSync(TEST_CASES_CSV_PATH, stringifyCsv(rows), 'utf8');

  return {
    testCaseId,
    status,
    lastExecution: targetRow[lastExecutionIndex],
  };
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, payload, contentType = 'text/plain; charset=utf-8') {
  response.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
  });
  response.end(payload);
}

function sendAsset(response, relativeFilePath, contentType) {
  const filePath = path.join(DASHBOARD_DIR, relativeFilePath);
  if (!fs.existsSync(filePath)) {
    sendText(response, 404, 'Not found');
    return;
  }

  sendText(response, 200, fs.readFileSync(filePath, 'utf8'), contentType);
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body is too large.'));
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function createDashboardServer() {
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      const pathname = url.pathname;

      if (request.method === 'GET' && pathname === '/health') {
        sendJson(response, 200, { ok: true, service: 'paylocity-dashboard' });
        return;
      }

      if (request.method === 'GET' && pathname === '/api/test-cases') {
        sendJson(response, 200, buildTestCaseResponse());
        return;
      }

      if (request.method === 'GET' && pathname === '/api/bug-reports') {
        sendJson(response, 200, buildBugReportResponse());
        return;
      }

      if (request.method === 'POST' && pathname.startsWith('/api/test-cases/')) {
        const match = pathname.match(/^\/api\/test-cases\/([^/]+)\/manual-result$/);
        if (!match) {
          sendText(response, 404, 'Not found');
          return;
        }

        const testCaseId = decodeURIComponent(match[1]);
        const body = await readRequestBody(request);
        const parsedBody = JSON.parse(body || '{}');
        const status = String(parsedBody.status ?? '').trim().toUpperCase();
        const result = updateTestCaseManualResult(testCaseId, status);
        sendJson(response, 200, result);
        return;
      }

      if (request.method === 'GET' && (pathname === '/' || pathname === '/test-cases')) {
        sendAsset(response, 'test-cases.html', 'text/html; charset=utf-8');
        return;
      }

      if (request.method === 'GET' && pathname === '/bug-reports') {
        sendAsset(response, 'bug-reports.html', 'text/html; charset=utf-8');
        return;
      }

      if (request.method === 'GET' && pathname === '/assets/styles.css') {
        sendAsset(response, 'styles.css', 'text/css; charset=utf-8');
        return;
      }

      if (request.method === 'GET' && pathname === '/assets/common.js') {
        sendAsset(response, 'common.js', 'application/javascript; charset=utf-8');
        return;
      }

      if (request.method === 'GET' && pathname === '/assets/test-cases.js') {
        sendAsset(response, 'test-cases.js', 'application/javascript; charset=utf-8');
        return;
      }

      if (request.method === 'GET' && pathname === '/assets/bug-reports.js') {
        sendAsset(response, 'bug-reports.js', 'application/javascript; charset=utf-8');
        return;
      }

      sendText(response, 404, 'Not found');
    } catch (error) {
      sendJson(response, 500, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

function startServer(port = DEFAULT_PORT) {
  const server = createDashboardServer();
  server.listen(port, '127.0.0.1', () => {
    console.log(`Paylocity dashboard running at http://127.0.0.1:${port}`);
  });

  return server;
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  const port = Number(args.port || DEFAULT_PORT);
  startServer(port);
}

module.exports = {
  ALLOWED_MANUAL_STATUSES,
  DEFAULT_PORT,
  createDashboardServer,
  startServer,
};
