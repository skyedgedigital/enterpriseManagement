import { doc, runTransaction, getDoc, getDocs, collection, query, where, type Transaction } from "firebase/firestore";
import { db } from "@/config/firebase";
import { COLLECTIONS, EMPLOYEE_CODE_PREFIX, EMPLOYEE_CODE_DIGITS } from "@/lib/constants";

const counterRef = () => doc(db, COLLECTIONS.COUNTERS, "employeeCode");

function formatEmployeeCode(num: number): string {
  return EMPLOYEE_CODE_PREFIX + String(num).padStart(EMPLOYEE_CODE_DIGITS, "0");
}

function nextNumberFromCounter(exists: boolean, lastNumber: unknown): number {
  return exists ? (typeof lastNumber === "number" ? lastNumber : 0) + 1 : 1;
}

/**
 * Preview the next employee code without reserving it.
 * Safe to call when the Add Employee form opens.
 */
export async function peekNextEmployeeCode(): Promise<string> {
  const snap = await getDoc(counterRef());
  const nextNum = nextNumberFromCounter(snap.exists(), snap.data()?.lastNumber);
  return formatEmployeeCode(nextNum);
}

/**
 * Read the next code inside a transaction. Does not write.
 * Pair with writeEmployeeCodeCounter so the counter commits only with the employee.
 */
export async function readNextEmployeeCode(tx: Transaction): Promise<{ code: string; lastNumber: number }> {
  const snap = await tx.get(counterRef());
  const lastNumber = nextNumberFromCounter(snap.exists(), snap.data()?.lastNumber);
  return { code: formatEmployeeCode(lastNumber), lastNumber };
}

export function writeEmployeeCodeCounter(tx: Transaction, lastNumber: number): void {
  tx.set(counterRef(), { lastNumber }, { merge: true });
}

/** Reserve consecutive employee codes in a single transaction (for bulk upload). */
export async function getNextEmployeeCodes(count: number): Promise<string[]> {
  if (count < 1) return [];
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef());
    const startNum = nextNumberFromCounter(snap.exists(), snap.data()?.lastNumber);
    const endNum = startNum + count - 1;
    tx.set(counterRef(), { lastNumber: endNum }, { merge: true });
    return Array.from({ length: count }, (_, i) => formatEmployeeCode(startNum + i));
  });
}

/**
 * Returns true if no other employee has this code (or only the excluded one when editing).
 */
export async function isEmployeeCodeUnique(code: string, excludeEmployeeId?: string): Promise<boolean> {
  const col = collection(db, COLLECTIONS.EMPLOYEES);
  const q = query(col, where("code", "==", code));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return true;
  if (!excludeEmployeeId) return false;
  const other = snapshot.docs.find((d) => d.id !== excludeEmployeeId);
  return !other;
}
