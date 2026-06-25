import { doc, runTransaction, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/config/firebase";
import { COLLECTIONS, EMPLOYEE_CODE_PREFIX, EMPLOYEE_CODE_DIGITS } from "@/lib/constants";

const counterRef = () => doc(db, COLLECTIONS.COUNTERS, "employeeCode");

/**
 * Returns the next employee code (EMP0001, EMP0002, ...) using a Firestore transaction.
 * Call this when creating a new employee to get a unique, auto-incremented code.
 */
function formatEmployeeCode(num: number): string {
  return EMPLOYEE_CODE_PREFIX + String(num).padStart(EMPLOYEE_CODE_DIGITS, "0");
}

export async function getNextEmployeeCode(): Promise<string> {
  const codes = await getNextEmployeeCodes(1);
  return codes[0];
}

/** Reserve consecutive employee codes in a single transaction (for bulk upload). */
export async function getNextEmployeeCodes(count: number): Promise<string[]> {
  if (count < 1) return [];
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef());
    const startNum = snap.exists() ? (snap.data()?.lastNumber ?? 0) + 1 : 1;
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
