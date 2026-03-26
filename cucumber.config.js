/** @type {import('@cucumber/cucumber').IProfiles} */
const sharedOptions = {
  require: [
    'shared/steps/common/**/*.ts',
    'shared/steps/ui/**/*.ts',
    'shared/steps/api/**/*.ts',
    'shared/steps/accessibility/**/*.ts',
    'shared/steps/performance/**/*.ts',
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
  // Default: run all functional features
  default: {
    ...sharedOptions,
    paths: [
      'src/functional/ui/features/**/*.feature',
      'src/functional/api/features/**/*.feature',
    ],
  },

  // Full suite: functional + non-functional features
  all: {
    ...sharedOptions,
    paths: [
      'src/functional/ui/features/**/*.feature',
      'src/functional/api/features/**/*.feature',
      'src/non-functional/performance/features/**/*.feature',
      'src/non-functional/accessibility/features/**/*.feature',
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

  performance: {
    ...sharedOptions,
    paths: ['src/non-functional/performance/features/**/*.feature'],
  },

  accessibility: {
    ...sharedOptions,
    paths: ['src/non-functional/accessibility/features/**/*.feature'],
  },

  nonfunctional: {
    ...sharedOptions,
    paths: [
      'src/non-functional/performance/features/**/*.feature',
      'src/non-functional/accessibility/features/**/*.feature',
    ],
  },
};

module.exports = profiles;
