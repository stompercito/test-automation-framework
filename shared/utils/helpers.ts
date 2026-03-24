/**
 * Miscellaneous utility helpers available to all test layers.
 */

/** Generate a unique string suffix useful for test data isolation. */
export function uniqueSuffix(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
