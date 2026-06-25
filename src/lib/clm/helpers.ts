import { toast } from "sonner";
import type {
  Attendance,
  AttendanceDay,
  AttendanceStatus,
  Employee,
  Wages,
} from "@/types";
import {
  getAttendanceSliceForWorkOrder,
  getDayWorkOrderTag,
} from "@/lib/attendanceSlice";
import { getWeeklyAllowanceSummaryFromAttendance } from "@/lib/paymentCalculation";

export const DEFAULT_WORKING_DAYS = 26;

export function periodString(month: number, year: number): string {
  return `${String(month).padStart(2, "0")}-${year}`;
}

// --------------------------------------------------------------------------
// runReport: unified try / catch / toast wrapper around a report builder.
// --------------------------------------------------------------------------

export interface RunReportOptions<T> {
  /** Human-readable report name used in error messages (e.g. "FORM XVII"). */
  label: string;
  /** Optional validator. Return an error message to abort, or null to proceed. */
  validate?: () => string | null;
  /** The async operation to run. */
  run: () => Promise<T>;
  /** Optional success toast. When omitted, nothing is shown on success. */
  successMessage?: string;
}

export async function runReport<T>(
  opts: RunReportOptions<T>,
): Promise<T | null> {
  const err = opts.validate?.();
  if (err) {
    toast.error(err);
    return null;
  }
  try {
    const result = await opts.run();
    if (opts.successMessage) toast.success(opts.successMessage);
    return result;
  } catch (e) {
    console.error(`${opts.label} generation failed`, e);
    toast.error(`Failed to generate ${opts.label}.`);
    return null;
  }
}

// --------------------------------------------------------------------------
// Show-list wages seeding: compute the (employee, work order) pairs that
// need a fresh wages row for a given period.
// --------------------------------------------------------------------------

export interface MissingWagesPair {
  employee: Employee;
  workOrderHr: string;
}

export function computeMissingWagesPairs(args: {
  employees: Employee[];
  existingWages: Wages[];
  workOrderId: string;
  period: string;
}): MissingWagesPair[] {
  const { employees, existingWages, workOrderId, period } = args;
  const required: MissingWagesPair[] = [];
  for (const emp of employees) {
    for (const a of emp.workOrderHr ?? []) {
      if (a.period !== period) continue;
      if (!a.workOrderHr) continue;
      if (workOrderId && a.workOrderHr !== workOrderId) continue;
      required.push({ employee: emp, workOrderHr: a.workOrderHr });
    }
  }
  const existingKey = new Set(
    existingWages.map((w) => `${w.employee}::${w.workOrderHr ?? ""}`),
  );
  return required.filter(
    ({ employee, workOrderHr }) =>
      !existingKey.has(`${employee.id}::${workOrderHr}`),
  );
}

// --------------------------------------------------------------------------
// Remove-employee attendance plan: compute the update or delete operation
// needed when an employee is removed from one work order in a given month.
// --------------------------------------------------------------------------

export type RemoveEmployeeAttendancePlan =
  | { action: "noop" }
  | { action: "delete"; id: string }
  | { action: "update"; id: string; data: Partial<Attendance> };

function isSunday(year: number, month: number, day: number): boolean {
  return new Date(year, month - 1, day).getDay() === 0;
}

function defaultStatusFor(year: number, month: number, day: number): AttendanceStatus {
  return isSunday(year, month, day) ? "Not Paid" : "Absent";
}

export function buildRemoveEmployeeAttendancePlan(args: {
  monthlyRecord: Attendance | null;
  workOrderId: string;
  year: number;
  month: number;
}): RemoveEmployeeAttendancePlan {
  const { monthlyRecord, workOrderId, year, month } = args;
  if (!monthlyRecord) return { action: "noop" };

  const rebuilt: AttendanceDay[] = (monthlyRecord.days ?? []).map((d) => {
    const effectiveTag = getDayWorkOrderTag(d, monthlyRecord);
    if (effectiveTag === workOrderId) {
      return { day: d.day, status: defaultStatusFor(year, month, d.day) };
    }
    return { ...d };
  });

  const clearRecordLevelTag = monthlyRecord.workOrderHr === workOrderId;
  const hasExplicitTag = rebuilt.some(
    (d) => d.workOrderHr && d.workOrderHr.trim() !== "",
  );
  const hasNonDefaultStatus = rebuilt.some(
    (d) => d.status !== defaultStatusFor(year, month, d.day),
  );
  const keepsRecordTag =
    !clearRecordLevelTag && Boolean(monthlyRecord.workOrderHr);

  if (!hasExplicitTag && !hasNonDefaultStatus && !keepsRecordTag) {
    return { action: "delete", id: monthlyRecord.id };
  }

  const monthSlice = getAttendanceSliceForWorkOrder(
    { ...monthlyRecord, days: rebuilt },
    null,
  );
  const weekly = getWeeklyAllowanceSummaryFromAttendance(rebuilt, year, month);
  return {
    action: "update",
    id: monthlyRecord.id,
    data: {
      days: rebuilt,
      presentDays: monthSlice.presentDays,
      earnedLeaves: monthSlice.earnedLeaves,
      casualLeaves: monthSlice.casualLeaves,
      festivalLeaves: monthSlice.festivalLeaves,
      continuousWeeks: weekly.continuousWeeks,
      weeklyAllowanceDays: weekly.weeklyAllowanceDays,
      weeklyAllowanceAmount: weekly.weeklyAllowanceAmount,
      workOrderHr: clearRecordLevelTag ? "" : monthlyRecord.workOrderHr,
    },
  };
}
