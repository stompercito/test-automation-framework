const http = require('http');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');
const { DEFAULT_PORT } = require('./dashboard-server.cjs');

const ROOT_DIR = path.resolve(__dirname, '..');
const SERVER_SCRIPT_PATH = path.join(__dirname, 'dashboard-server.cjs');

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

function requestHealth(port) {
  return new Promise((resolve) => {
    const request = http.get(
      {
        hostname: '127.0.0.1',
        port,
        path: '/health',
        timeout: 1200,
      },
      (response) => {
        let body = '';
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          try {
            const parsed = JSON.parse(body || '{}');
            resolve(response.statusCode === 200 && parsed.ok === true);
          } catch {
            resolve(false);
          }
        });
      },
    );

    request.on('timeout', () => {
      request.destroy();
      resolve(false);
    });
    request.on('error', () => resolve(false));
  });
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();

    tester.once('error', () => {
      resolve(false);
    });

    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });

    tester.listen(port, '127.0.0.1');
  });
}

async function resolveDashboardPort() {
  for (let offset = 0; offset < 10; offset += 1) {
    const port = DEFAULT_PORT + offset;
    if (await requestHealth(port)) {
      return { port, alreadyRunning: true };
    }

    if (await isPortFree(port)) {
      return { port, alreadyRunning: false };
    }
  }

  throw new Error('Unable to find an available local port for the dashboard.');
}

function launchDetachedServer(port) {
  const child = spawn(process.execPath, [SERVER_SCRIPT_PATH, '--port', String(port)], {
    cwd: ROOT_DIR,
    detached: true,
    stdio: 'ignore',
  });

  child.unref();
}

async function ensureDashboardServer(port, alreadyRunning) {
  if (alreadyRunning) {
    return;
  }

  launchDetachedServer(port);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await requestHealth(port)) {
      return;
    }

    await wait(250);
  }

  throw new Error(`Dashboard server did not become healthy on port ${port}.`);
}

function openUrl(url) {
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], {
      cwd: ROOT_DIR,
      detached: true,
      stdio: 'ignore',
    }).unref();
    return;
  }

  if (process.platform === 'darwin') {
    spawn('open', [url], {
      cwd: ROOT_DIR,
      detached: true,
      stdio: 'ignore',
    }).unref();
    return;
  }

  spawn('xdg-open', [url], {
    cwd: ROOT_DIR,
    detached: true,
    stdio: 'ignore',
  }).unref();
}

async function ensureDashboardOpen(options = {}) {
  const { noBrowser = false } = options;
  const { port, alreadyRunning } = await resolveDashboardPort();
  await ensureDashboardServer(port, alreadyRunning);

  const urls = {
    testCases: `http://127.0.0.1:${port}/test-cases`,
    bugReports: `http://127.0.0.1:${port}/bug-reports`,
  };

  if (!noBrowser) {
    openUrl(urls.testCases);
  }

  return urls;
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));

  ensureDashboardOpen({ noBrowser: Boolean(args['no-browser']) })
    .then((urls) => {
      console.log(`Test cases dashboard: ${urls.testCases}`);
      console.log(`Bug reports dashboard: ${urls.bugReports}`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
}

module.exports = {
  ensureDashboardOpen,
};
