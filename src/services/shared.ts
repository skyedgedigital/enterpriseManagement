import {
  doc,
  writeBatch,
  type CollectionReference,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

/** Partial Firestore update — omits undefined keys */
export function omitUndefined<T extends Record<string, unknown>>(
  obj: T,
): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const v = obj[key as keyof T];
    if (v !== undefined) out[key] = v;
  }
  return out as Partial<T>;
}

/** Firestore allows at most 500 writes per batch commit. */
export const FIRESTORE_BATCH_SIZE = 500;

/**
 * Insert many documents using batched writes (500 ops per commit).
 * Returns how many documents were written successfully.
 */
export async function commitBatchedSets(
  colRef: CollectionReference,
  documents: Record<string, unknown>[],
  onBatchError?: (batchIndex: number, error: unknown) => void,
): Promise<number> {
  let written = 0;

  for (let i = 0; i < documents.length; i += FIRESTORE_BATCH_SIZE) {
    const chunk = documents.slice(i, i + FIRESTORE_BATCH_SIZE);
    const batch = writeBatch(db);
    for (const data of chunk) {
      batch.set(doc(colRef), data);
    }
    try {
      await batch.commit();
      written += chunk.length;
    } catch (error) {
      onBatchError?.(Math.floor(i / FIRESTORE_BATCH_SIZE), error);
      throw error;
    }
  }

  return written;
}

export async function commitBatchedSetsResilient(
  colRef: CollectionReference,
  documents: Record<string, unknown>[],
): Promise<{ success: number; errors: string[] }> {
  let success = 0;
  const errors: string[] = [];

  for (let i = 0; i < documents.length; i += FIRESTORE_BATCH_SIZE) {
    const chunk = documents.slice(i, i + FIRESTORE_BATCH_SIZE);
    const batchIndex = Math.floor(i / FIRESTORE_BATCH_SIZE) + 1;
    const batch = writeBatch(db);
    for (const data of chunk) {
      batch.set(doc(colRef), data);
    }
    try {
      await batch.commit();
      success += chunk.length;
    } catch (error) {
      errors.push(
        error instanceof Error
          ? `Batch ${batchIndex} failed: ${error.message}`
          : `Batch ${batchIndex} failed`,
      );
    }
  }

  return { success, errors };
}
