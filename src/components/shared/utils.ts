import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';

export function isFirestoreTimestamp(v: unknown): v is Timestamp {
  return v != null && typeof (v as Timestamp).toDate === 'function';
}

export function toDateSafe(v: unknown): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (isFirestoreTimestamp(v)) return v.toDate();
  return undefined;
}

export const formatTimestamp = (ts?: unknown) => {
  const date = toDateSafe(ts);
  if (!date) return '—';
  if (typeof ts === 'string') return ts;
  return format(date, 'dd MMM yyyy');
};

export function formatTimestampLocale(
  ts?: unknown,
  locale = 'en-IN',
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  },
): string {
  const date = toDateSafe(ts);
  if (!date) return '—';
  return date.toLocaleDateString(locale, options);
}
