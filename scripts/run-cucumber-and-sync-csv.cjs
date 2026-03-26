const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { updateCsvFromCucumberReport, formatTimestamp } = require('./update-test-case-csv.cjs');

const reportCliPath = path.join('reports', 'json', 'cucumber-report.json');
const reportPath = path.resolve(__dirname, '..', 'reports', 'json', 'cucumber-report.json');
const csvPath = path.resolve(__dirname, '..', 'reports', 'csv', 'paylocity-test-cases.csv');

function resolveCucumberBinPath() {
  const cucumberPackageJsonPath = require.resolve('@cucumber/cucumber/package.json');
  return path.resolve(path.dirname(cucumberPackageJsonPath), 'bin', 'cucumber.js');
}

async function main() {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  if (fs.existsSync(reportPath)) {
    fs.unlinkSync(reportPath);
  }

  const forwardedArgs = process.argv.slice(2);
  const isDryRun = forwardedArgs.includes('--dry-run') || forwardedArgs.includes('-d');
  const cucumberArgs = [
    resolveCucumberBinPath(),
    '--config',
    'cucumber.config.js',
    ...forwardedArgs,
    '--format',
    `json:${reportCliPath}`,
  ];

  const child = spawn(process.execPath, cucumberArgs, {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      NO_COLOR: '1',
      FORCE_COLOR: '0',
    },
    stdio: 'inherit',
  });

  child.on('error', (error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });

  child.on('close', (code) => {
    const testExitCode = typeof code === 'number' ? code : 1;
    let finalExitCode = testExitCode;

    if (isDryRun) {
      process.exit(finalExitCode);
    }

    try {
      const summary = updateCsvFromCucumberReport({
        reportPath,
        csvPath,
        timestamp: formatTimestamp(),
      });

      console.log(
        `Updated ${summary.updatedCount} test case rows in ${summary.csvPath} using latest Cucumber results.`,
      );
    } catch (error) {
      console.error(
        `Failed to update ${csvPath} from ${reportPath}: ${error instanceof Error ? error.message : String(error)}`,
      );

      if (finalExitCode === 0) {
        finalExitCode = 1;
      }
    }

    process.exit(finalExitCode);
  });
}

main();
