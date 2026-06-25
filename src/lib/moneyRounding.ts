/**
 * Central helpers for money and numeric rounding used across the app.
 * Prefer these instead of redefining Math.round / toFixed patterns in components.
 */

/**
 * Half-up rounding to 2 decimal places. Uses `Number.EPSILON` to reduce
 * binary float noise (e.g. 1.005 → 1.01).
 */
export function roundHalfUp2(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Nearest integer (e.g. 2.2 → 2, 2.5 → 3, 2.6 → 3). Same as `Math.round`.
 */
export function roundNearestInteger(amount: number): number {
  return Math.round(amount);
}

/** String for amounts shown to 2 dp after half-up rounding. */
export function formatMoney2(amount: number): string {
  return roundHalfUp2(amount).toFixed(2);
}

/** Whole units as a string after nearest-integer rounding (e.g. rupees, leave days). */
export function formatMoneyWhole(amount: number): string {
  return String(roundNearestInteger(amount));
}

/** Whole rupees, always rounded up (e.g. bonus Form C). */
export function ceilToWholeRupee(amount: number): number {
  return Math.ceil(amount);
}
