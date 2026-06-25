import type { Timestamp } from "firebase/firestore";

function isTimestamp(v: unknown): v is Timestamp {
  return v != null && typeof (v as Timestamp).toMillis === "function";
}

/**
 * Converts a Firestore Timestamp to a serializable value (ms number) for Redux/store.
 */
export function timestampToSerializable(value: Timestamp | null | undefined): number | undefined {
  if (value == null || !isTimestamp(value)) return undefined;
  return value.toMillis();
}

/**
 * Sanitizes document data from Firestore for Redux (converts Timestamp to number).
 * Use when mapping snapshot.docs to avoid non-serializable values in store.
 */
export function serializeDocData<T extends Record<string, unknown>>(data: T): T {
  const out = { ...data } as Record<string, unknown>;
  if (isTimestamp(out.createdAt)) out.createdAt = (out.createdAt as Timestamp).toMillis();
  if (isTimestamp(out.updatedAt)) out.updatedAt = (out.updatedAt as Timestamp).toMillis();
  return out as T;
}
