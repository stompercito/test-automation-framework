/**
 * Shared tag taxonomy used across BDD features and reporting.
 * The goal is to filter by scope, risk, version, and expected outcome.
 */
export const Tags = {
  // Execution scope
  SMOKE: '@smoke',
  SANITY: '@sanity',
  REGRESSION: '@regression',
  WHITE_GLOVE: '@white-glove',
  BUG_HUNT: '@bug-hunt',

  // Category
  FUNCTIONAL: '@functional',
  NON_FUNCTIONAL: '@non-functional',

  // Layer / type
  UI: '@ui',
  API: '@api',
  ACCESSIBILITY: '@accessibility',
  PERFORMANCE: '@performance',

  // Version targeting
  V1: '@v1',
  V2: '@v2',
  V3: '@v3',

  // Priority
  P0: '@p0',
  P1: '@p1',
  P2: '@p2',
  P3: '@p3',

  // Severity
  SEV_BLOCKER: '@sev-blocker',
  SEV_CRITICAL: '@sev-critical',
  SEV_MAJOR: '@sev-major',
  SEV_MINOR: '@sev-minor',
  SEV_TRIVIAL: '@sev-trivial',

  // Failure classification
  FAILURE_BUG: '@failure-bug',
  FAILURE_SYSTEM: '@failure-system',
  FAILURE_DATA: '@failure-data',
  FAILURE_TEST: '@failure-test',

  // Expectations
  EXPECTED_PASS: '@expected-pass',
  EXPECTED_FAIL: '@expected-fail',
  KNOWN_BUG: '@known-bug',
} as const;
