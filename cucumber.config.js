/** @type {import('@cucumber/cucumber').IProfiles} */
const sharedOptions = {
  require: [
    'src/functional/ui/hooks/**/*.ts',
    'src/functional/ui/steps/**/*.ts',
    'src/functional/api/steps/**/*.ts',
    'shared/fixtures/world.ts',
    'shared/fixtures/hooks.ts',
  ],
  requireModule: ['ts-node/register'],
  format: [
    'progress-bar',
    'html:reports/html/cucumber-report.html',
  ],
  formatOptions: { snippetInterface: 'async-await' },
  publishQuiet: true,
};

const profiles = {
  // Default: run all features
  default: {
    ...sharedOptions,
    paths: [
      'src/functional/ui/features/**/*.feature',
      'src/functional/api/features/**/*.feature',
    ],
  },

  // UI-only profile
  ui: {
    ...sharedOptions,
    paths: ['src/functional/ui/features/**/*.feature'],
  },

  // API-only profile
  api: {
    ...sharedOptions,
    paths: ['src/functional/api/features/**/*.feature'],
  },

  // Smoke profile (all features, smoke tag)
  smoke: {
    ...sharedOptions,
    paths: [
      'src/functional/ui/features/**/*.feature',
      'src/functional/api/features/**/*.feature',
    ],
    tags: '@smoke',
  },

  // Regression profile (all features, regression tag)
  regression: {
    ...sharedOptions,
    paths: [
      'src/functional/ui/features/**/*.feature',
      'src/functional/api/features/**/*.feature',
    ],
    tags: '@regression',
  },
};

module.exports = profiles;
