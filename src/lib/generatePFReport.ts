import type { Employee, Wages, WorkOrder, Designation } from "@/types";
import { computePayment } from "./paymentCalculation";
import { roundNearestInteger } from "./moneyRounding";

/** One row of the PF report table (as in the screenshot). */
export interface PFReportRow {
  uan: string;
  employeeName: string;
  epfWagesGross: number;
  epfWages: number;
  epsWages: number;
  edliWages: number;
  pf: number; // employee 12%
  epfAmount: number; // employer 8.33% (EPS)
  ppfAmount: number; // employer 3.67% (EPF)
  ncpDays: number;
  lastColumn: number; // often 0 in portal formats
}

const EPS_EDLI_CAP = 15_000;

export interface BuildPFReportParams {
  employees: Employee[];
  wages: Wages[];
  designations: Designation[];
  workOrders: WorkOrder[];
  year: number;
  month: number;
  departmentId?: string;
}

function pfFromWageRow(
  w: Wages,
  emp: Employee,
  designations: Designation[],
  workOrders: WorkOrder[],
): {
  epfWagesGross: number;
  epfWages: number;
  pf: number;
  ncpDays: number;
} {
  const designation = emp.designation
    ? designations.find((d) => d.id === emp.designation) ?? null
    : null;
  const basicRate = w.basic ?? (designation ? Number(designation.basic) || 0 : 0);
  const daRate = w.da ?? (designation ? Number(designation.da) || 0 : 0);
  const attendance = w.attendance;
  const otherCash = w.otherCash ?? 0;
  const allowances = w.allowances ?? 0;
  const otherDeduction = w.otherDeduction ?? 0;

  const workOrder = w.workOrderHr
    ? workOrders.find((wo) => wo.id === w.workOrderHr) ?? null
    : null;
  const newPfApplicable = workOrder?.newPfApplicable ?? false;

  const breakdown = computePayment(
    attendance,
    basicRate,
    daRate,
    otherCash,
    allowances,
    0,
    otherDeduction,
    newPfApplicable,
  );

  const gross = breakdown.resultant1;
  const epfWages = newPfApplicable ? Math.min(gross, EPS_EDLI_CAP) : gross;
  const totalWorkingDays = w.totalWorkingDays ?? 0;

  return {
    epfWagesGross: gross,
    epfWages,
    pf: breakdown.raw.pf,
    ncpDays: Math.max(0, totalWorkingDays - attendance),
  };
}

/**
 * Build PF report rows for the selected year, month, and optional department.
 *
 * Includes everyone with wages for the period except employees explicitly opted out
 * (`pfApplicable === false`). UAN is shown when present; rows are still included if UAN
 * is missing so you can fill it in master data or the sheet.
 *
 * **How PF is calculated (aligned with CLM / pay slip):**
 * - `computePayment` derives **EPF wages (gross)** as `resultant1` = (Basic + DA per day) × payable days
 *   from the wages record (`attendance` / present days), plus the same other cash / allowances inputs
 *   as in payroll (incentive is not added here — overtime passed as 0).
 * - **Employee PF (12%)** uses `breakdown.pf` from that call (same rule as pay slip). If an employee has
 *   multiple wage rows for the month (e.g. different work orders), values are **summed** into one report line.
 * - **₹15,000 cap** applies per wage row when that row’s work order has `newPfApplicable === true`
 *   (see `WorkOrderFormPage` “New PF Applicable”). The **EPF Wages** column is the sum of those per-row
 *   PF bases; **EPS / EDLI** use `min(that sum, 15,000)` like the single-row case.
 * - Employer splits: **EPS 8.33%** on `epsWages`, **EPF 3.67%** on summed **EPF Wages** (rounded rupees).
 */
export function buildPFReport({
  employees,
  wages,
  designations,
  workOrders,
  year,
  month,
  departmentId,
}: BuildPFReportParams): PFReportRow[] {
  const wagesByEmployee = new Map<string, Wages[]>();
  for (const w of wages) {
    if (w.year !== year || w.month !== month) continue;
    const list = wagesByEmployee.get(w.employee) ?? [];
    list.push(w);
    wagesByEmployee.set(w.employee, list);
  }

  const rows: PFReportRow[] = [];

  for (const emp of employees) {
    if (emp.pfApplicable === false) continue;
    if (departmentId && emp.department !== departmentId) continue;

    const wageList = wagesByEmployee.get(emp.id);
    if (!wageList?.length) continue;

    let epfWagesGrossSum = 0;
    let epfWagesSum = 0;
    let pfSum = 0;
    let ncpDaysSum = 0;

    for (const w of wageList) {
      const part = pfFromWageRow(w, emp, designations, workOrders);
      epfWagesGrossSum += part.epfWagesGross;
      epfWagesSum += part.epfWages;
      pfSum += part.pf;
      ncpDaysSum += part.ncpDays;
    }

    const epsWages = Math.min(epfWagesSum, EPS_EDLI_CAP);
    const edliWages = Math.min(epfWagesSum, EPS_EDLI_CAP);

    const pf = roundNearestInteger(pfSum);
    const epfAmount = roundNearestInteger(epsWages * 0.0833);
    const ppfAmount = roundNearestInteger(epfWagesSum * 0.0367);

    rows.push({
      uan: emp.uan?.trim() ?? "",
      employeeName: emp.name?.trim() || emp.code || "",
      epfWagesGross: roundNearestInteger(epfWagesGrossSum),
      epfWages: roundNearestInteger(epfWagesSum),
      epsWages: roundNearestInteger(epsWages),
      edliWages: roundNearestInteger(edliWages),
      pf,
      epfAmount,
      ppfAmount,
      ncpDays: roundNearestInteger(ncpDaysSum),
      lastColumn: 0,
    });
  }

  rows.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  return rows;
}
