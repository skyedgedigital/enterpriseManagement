import { BANK_NAMES, INDIAN_STATES_AND_UTS } from "@/lib/constants";

/**
 * Sanitize a display string for storage: lowercase, spaces/special chars → underscore, collapse underscores.
 * Used for grouping/filtering (e.g. work order state, bank name).
 */
export function toSanitizedKey(display: string): string {
  if (!display?.trim()) return "";
  return display
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Get display name for a stored state key (sanitized).
 */
export function getStateDisplayName(sanitized: string): string {
  if (!sanitized) return "-";
  if (sanitized === "no_state") return "No state";
  const found = INDIAN_STATES_AND_UTS.find((s) => toSanitizedKey(s) === sanitized);
  return found ?? sanitized;
}

/**
 * Get display name for a stored bank name key (sanitized).
 */
export function getBankDisplayName(sanitized: string): string {
  if (!sanitized) return "-";
  const found = BANK_NAMES.find((n) => toSanitizedKey(n) === sanitized);
  return found ?? sanitized;
}
