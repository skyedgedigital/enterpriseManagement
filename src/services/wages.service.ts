import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, orderBy,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { roundHalfUp2, roundNearestInteger } from "@/lib/moneyRounding";
import type { Wages } from "@/types";
import { commitBatchedSetsResilient } from "./shared";

const colRef = collection(db, COLLECTIONS.WAGES);

const MONEY_FIELDS: Array<keyof Wages> = [
  "basic",
  "da",
  "payRate",
  "allowances",
  "otherCash",
  "total",
  "incentiveAmount",
  "otherDeduction",
  "advanceDeduction",
  "damageDeduction",
  "netAmountPaid",
];

const INTEGER_FIELDS: Array<keyof Wages> = [
  "month",
  "year",
  "incentiveDays",
];

const DECIMAL_FIELDS: Array<keyof Wages> = [
  "totalWorkingDays",
  "attendance",
];

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function removeUndefinedFields<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as T;
}

function normalizeWagesPayload(data: Partial<Wages>): Partial<Wages> {
  const payload: Partial<Wages> = { ...data };

  for (const key of MONEY_FIELDS) {
    if (payload[key] !== undefined) {
      payload[key] = roundHalfUp2(toNumber(payload[key])) as never;
    }
  }

  for (const key of DECIMAL_FIELDS) {
    if (payload[key] !== undefined) {
      payload[key] = roundHalfUp2(toNumber(payload[key])) as never;
    }
  }

  for (const key of INTEGER_FIELDS) {
    if (payload[key] !== undefined) {
      payload[key] = roundNearestInteger(toNumber(payload[key])) as never;
    }
  }

  return removeUndefinedFields(payload as Record<string, unknown>) as Partial<Wages>;
}

function buildWagesWritePayload(data: Omit<Wages, "id">): Record<string, unknown> {
  const normalized = normalizeWagesPayload(data);
  return {
    ...normalized,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export const wagesService = {
  getAll: async (): Promise<Wages[]> => {
    const q = query(colRef, orderBy("year", "desc"), orderBy("month", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Wages));
  },

  getByFilter: async (params: { employeeId?: string; year?: number; month?: number }): Promise<Wages[]> => {
    const constraints = [];
    if (params.employeeId) constraints.push(where("employee", "==", params.employeeId));
    if (params.year) constraints.push(where("year", "==", params.year));
    if (params.month) constraints.push(where("month", "==", params.month));
    constraints.push(orderBy("year", "desc"), orderBy("month", "desc"));

    const q = query(colRef, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Wages));
  },

  /** Wages for Indian FY ending March `fyEndYear` (April fyEndYear−1 through March fyEndYear). */
  getByFinancialYear: async (fyEndYear: number): Promise<Wages[]> => {
    const startYear = fyEndYear - 1;
    const periods: { year: number; month: number }[] = [];
    for (let m = 4; m <= 12; m += 1) periods.push({ year: startYear, month: m });
    for (let m = 1; m <= 3; m += 1) periods.push({ year: fyEndYear, month: m });
    const chunks = await Promise.all(
      periods.map(({ year, month }) => wagesService.getByFilter({ year, month })),
    );
    const byId = new Map<string, Wages>();
    for (const list of chunks) {
      for (const w of list) {
        byId.set(w.id, w);
      }
    }
    return Array.from(byId.values());
  },

  /** Wages for calendar year `calendarYear` (January–December). Single year query. */
  getByCalendarYear: async (calendarYear: number): Promise<Wages[]> => {
    return wagesService.getByFilter({ year: calendarYear });
  },

  create: async (data: Omit<Wages, "id">): Promise<Wages> => {
    const payload = buildWagesWritePayload(data);
    const docRef = await addDoc(colRef, payload);
    const normalized = normalizeWagesPayload(data);
    return { id: docRef.id, ...(normalized as Omit<Wages, "id">) };
  },

  /** Bulk insert for Excel upload — uses Firestore batched writes (500 per commit). */
  createMany: async (
    items: Omit<Wages, "id">[],
  ): Promise<{ success: number; errors: string[] }> => {
    if (items.length === 0) return { success: 0, errors: [] };
    const documents = items.map((item) => buildWagesWritePayload(item));
    return commitBatchedSetsResilient(colRef, documents);
  },

  update: async (id: string, data: Partial<Wages>): Promise<void> => {
    const normalized = normalizeWagesPayload(data);
    await updateDoc(doc(db, COLLECTIONS.WAGES, id), { ...normalized, updatedAt: serverTimestamp() });
  },

  remove: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.WAGES, id));
  },
};
