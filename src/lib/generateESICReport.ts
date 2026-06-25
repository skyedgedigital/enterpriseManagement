import type { Employee, Wages, WorkOrder, Designation } from "@/types";
import { roundNearestInteger } from "./moneyRounding";

/** One row of the ESIC report table. */
export interface ESICReportRow {
  slNo: number;
  ipNumber: string; // 10 digits
  ipName: string; // alphabetical, uppercase
  daysPaid: number;
  totalMonthlyWage: number; // (basic + DA) × number of days
}

export interface BuildESICReportParams {
  employees: Employee[];
  wages: Wages[];
  workOrders: WorkOrder[];
  designations: Designation[];
  year: number;
  month: number;
  state?: string;
}

/** Normalize ESIC number to 10 digits (take last 10 or pad). Missing number → ten zeros. */
function to10DigitIPNumber(esicNo: string | undefined): string {
  const digits = (esicNo ?? "").replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits.padStart(10, "0").slice(-10);
}

function wagePassesStateFilter(
  w: Wages,
  state: string | undefined,
  workOrders: WorkOrder[],
): boolean {
  if (!state) return true;
  const wo = w.workOrderHr ? workOrders.find((o) => o.id === w.workOrderHr) : null;
  return !!(wo && wo.state === state);
}

/**
 * Build ESIC report rows for the selected year, month, and optional state.
 *
 * Includes everyone with wages for the period (and matching state filter when set) except
 * employees explicitly opted out (`esicApplicable === false`). IP number is derived from
 * `esicNo` when present; otherwise a 10-digit zero placeholder is used until master data is filled.
 *
 * **Total monthly wage** = sum over matching wage rows of `(Basic + DA per day) × days paid`
 * for that row (designation fallback for rates). **Days paid** = sum of `attendance` across those rows.
 */
export function buildESICReport({
  employees,
  wages,
  workOrders,
  designations,
  year,
  month,
  state,
}: BuildESICReportParams): ESICReportRow[] {
  const wagesByEmployee = new Map<string, Wages[]>();
  for (const w of wages) {
    if (w.year !== year || w.month !== month) continue;
    if (!wagePassesStateFilter(w, state, workOrders)) continue;
    const list = wagesByEmployee.get(w.employee) ?? [];
    list.push(w);
    wagesByEmployee.set(w.employee, list);
  }

  const rows: ESICReportRow[] = [];

  for (const emp of employees) {
    if (emp.esicApplicable === false) continue;

    const wageList = wagesByEmployee.get(emp.id);
    if (!wageList?.length) continue;

    const designation = emp.designation
      ? designations.find((d) => d.id === emp.designation) ?? null
      : null;

    let totalMonthlyWageSum = 0;
    let daysPaidSum = 0;

    for (const w of wageList) {
      const basicPerDay = w.basic ?? (designation ? Number(designation.basic) || 0 : 0);
      const daPerDay = w.da ?? (designation ? Number(designation.da) || 0 : 0);
      const daysPaid = w.attendance;
      totalMonthlyWageSum += (basicPerDay + daPerDay) * daysPaid;
      daysPaidSum += daysPaid;
    }

    rows.push({
      slNo: 0,
      ipNumber: to10DigitIPNumber(emp.esicNo),
      ipName: (emp.name?.trim() || emp.code || "").toUpperCase(),
      daysPaid: daysPaidSum,
      totalMonthlyWage: roundNearestInteger(totalMonthlyWageSum),
    });
  }

  rows.sort((a, b) => a.ipName.localeCompare(b.ipName));
  rows.forEach((r, i) => {
    r.slNo = i + 1;
  });

  return rows;
}
