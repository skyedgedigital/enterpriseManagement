import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { roundHalfUp2 } from "@/lib/moneyRounding";
import { serializeDocData } from "@/lib/firestore";
import { commitBatchedSetsResilient } from "./shared";
import type { Attendance } from "@/types";

const colRef = collection(db, COLLECTIONS.ATTENDANCES);

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function mapDocToAttendance(id: string, data: Record<string, unknown>): Attendance {
  const serialized = serializeDocData(data);
  return { id, ...serialized } as Attendance;
}

function buildAttendanceWritePayload(data: Omit<Attendance, "id">): Record<string, unknown> {
  const daysArray = Array.isArray(data.days)
    ? data.days.map((d) => {
        const entry: Record<string, unknown> = {
          day: num(d.day),
          status: String(d.status ?? "Present"),
        };
        if (d.workOrderHr != null && String(d.workOrderHr).trim() !== "") {
          entry.workOrderHr = String(d.workOrderHr);
        }
        return entry;
      })
    : [];
  const payload: Record<string, unknown> = {
    employee: String(data.employee),
    year: num(data.year),
    month: num(data.month),
    presentDays: roundHalfUp2(num(data.presentDays)),
    earnedLeaves: num(data.earnedLeaves),
    casualLeaves: num(data.casualLeaves),
    festivalLeaves: num(data.festivalLeaves),
    continuousWeeks: num(data.continuousWeeks),
    weeklyAllowanceDays: num(data.weeklyAllowanceDays),
    weeklyAllowanceAmount: roundHalfUp2(num(data.weeklyAllowanceAmount)),
    days: daysArray,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (data.workOrderHr != null && String(data.workOrderHr).trim() !== "") {
    payload.workOrderHr = String(data.workOrderHr);
  }
  return payload;
}

function attendanceFromPayload(
  id: string,
  data: Omit<Attendance, "id">,
  payload: Record<string, unknown>,
  daysArray: Attendance["days"],
): Attendance {
  return {
    id,
    employee: data.employee,
    year: data.year,
    month: data.month,
    presentDays: payload.presentDays as number,
    earnedLeaves: payload.earnedLeaves as number,
    casualLeaves: payload.casualLeaves as number,
    festivalLeaves: payload.festivalLeaves as number,
    continuousWeeks: payload.continuousWeeks as number,
    weeklyAllowanceDays: payload.weeklyAllowanceDays as number,
    weeklyAllowanceAmount: payload.weeklyAllowanceAmount as number,
    days: daysArray,
    workOrderHr: payload.workOrderHr as string | undefined,
  };
}

export const attendanceService = {
  getAll: async (): Promise<Attendance[]> => {
    const snapshot = await getDocs(colRef);
    const list = snapshot.docs.map((d) => mapDocToAttendance(d.id, d.data()));
    return list.sort((a, b) => (b.year - a.year) || (b.month - a.month));
  },

  getByFilter: async (params: { employeeId?: string; year?: number; month?: number }): Promise<Attendance[]> => {
    const constraints: ReturnType<typeof where>[] = [];
    if (params.employeeId) constraints.push(where("employee", "==", params.employeeId));
    if (params.year !== undefined) constraints.push(where("year", "==", params.year));
    if (params.month !== undefined) constraints.push(where("month", "==", params.month));
    const q = query(colRef, ...constraints);
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((d) => mapDocToAttendance(d.id, d.data()));
    return list.sort((a, b) => (b.year - a.year) || (b.month - a.month));
  },

  getByFinancialYear: async (fyEndYear: number): Promise<Attendance[]> => {
    const startYear = fyEndYear - 1;
    const periods: { year: number; month: number }[] = [];
    for (let m = 4; m <= 12; m += 1) periods.push({ year: startYear, month: m });
    for (let m = 1; m <= 3; m += 1) periods.push({ year: fyEndYear, month: m });
    const chunks = await Promise.all(
      periods.map(({ year, month }) => attendanceService.getByFilter({ year, month })),
    );
    const byId = new Map<string, Attendance>();
    for (const list of chunks) {
      for (const a of list) {
        byId.set(a.id, a);
      }
    }
    return Array.from(byId.values());
  },

  getByCalendarYear: async (calendarYear: number): Promise<Attendance[]> => {
    return attendanceService.getByFilter({ year: calendarYear });
  },

  create: async (data: Omit<Attendance, "id">): Promise<Attendance> => {
    const payload = buildAttendanceWritePayload(data);
    const docRef = await addDoc(colRef, payload);
    return attendanceFromPayload(
      docRef.id,
      data,
      payload,
      (payload.days as Attendance["days"]) ?? [],
    );
  },

  /** Bulk insert for Excel upload — uses Firestore batched writes (500 per commit). */
  createMany: async (
    items: Omit<Attendance, "id">[],
  ): Promise<{ success: number; errors: string[] }> => {
    if (items.length === 0) return { success: 0, errors: [] };
    const documents = items.map((item) => buildAttendanceWritePayload(item));
    return commitBatchedSetsResilient(colRef, documents);
  },

  update: async (id: string, data: Partial<Attendance>): Promise<void> => {
    const payload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (data.employee !== undefined) payload.employee = String(data.employee);
    if (data.year !== undefined) payload.year = num(data.year);
    if (data.month !== undefined) payload.month = num(data.month);
    if (data.presentDays !== undefined) payload.presentDays = roundHalfUp2(num(data.presentDays));
    if (data.earnedLeaves !== undefined) payload.earnedLeaves = num(data.earnedLeaves);
    if (data.casualLeaves !== undefined) payload.casualLeaves = num(data.casualLeaves);
    if (data.festivalLeaves !== undefined) payload.festivalLeaves = num(data.festivalLeaves);
    if (data.continuousWeeks !== undefined) payload.continuousWeeks = num(data.continuousWeeks);
    if (data.weeklyAllowanceDays !== undefined) payload.weeklyAllowanceDays = num(data.weeklyAllowanceDays);
    if (data.weeklyAllowanceAmount !== undefined) {
      payload.weeklyAllowanceAmount = roundHalfUp2(num(data.weeklyAllowanceAmount));
    }
    if (Array.isArray(data.days) && data.days.length > 0) {
      payload.days = data.days.map((d) => {
        const entry: Record<string, unknown> = {
          day: num(d.day),
          status: String(d.status ?? "Present"),
        };
        if (d.workOrderHr != null && String(d.workOrderHr).trim() !== "") {
          entry.workOrderHr = String(d.workOrderHr);
        }
        return entry;
      });
    }
    if (data.workOrderHr !== undefined && String(data.workOrderHr).trim() !== "") {
      payload.workOrderHr = String(data.workOrderHr);
    } else if (data.workOrderHr === "") {
      payload.workOrderHr = "";
    }
    await updateDoc(doc(db, COLLECTIONS.ATTENDANCES, id), payload);
  },

  remove: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.ATTENDANCES, id));
  },
};
