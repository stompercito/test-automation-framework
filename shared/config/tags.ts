/**
 * Tag constants used to annotate feature files.
 *
 * Usage in .feature files:
 *   @smoke @functional @ui
 *   Scenario: Login with valid credentials
 *
 * Usage on the CLI:
 *   npm run test:bdd -- --tags "@smoke"
 */
export const Tags = {
  // Test scope
  SMOKE: '@smoke',
  REGRESSION: '@regression',
  SANITY: '@sanity',

  // Category
  FUNCTIONAL: '@functional',
  NON_FUNCTIONAL: '@non-functional',

  // Type
  UI: '@ui',
  API: '@api',
  ACCESSIBILITY: '@accessibility',
  PERFORMANCE: '@performance',

  // Priority
  CRITICAL: '@critical',
  HIGH: '@high',
  MEDIUM: '@medium',
  LOW: '@low',
} as const;
