import { computePayment } from "./paymentCalculation";
import { roundNearestInteger } from "./moneyRounding";
import {
  buildArrearAccumulator,
  type GenerateArrearParams,
} from "./generateArrear";
import type { PFReportRow } from "./generatePFReport";

const EPS_EDLI_CAP = 15_000;

export interface BuildArrearPFReportParams extends GenerateArrearParams {
  departmentId?: string;
}

/**
 * Build PF report rows for the arrear delta (basic + DA differential) across the
 * selected month range.
 *
 * Mirrors the numeric treatment of the current Arrear PDF's PF column: passes the
 * accumulated totals through `computePayment` with the selected Work Order's
 * `newPfApplicable` flag. Employer split columns (EPS 8.33%, EPF 3.67%) use the
 * same rule as {@link buildPFReport} with the ₹15,000 cap applied when
 * `newPfApplicable` is true.
 *
 * - Employees with `pfApplicable === false` are excluded.
 * - When `departmentId` is provided, only employees in that department are included.
 * - `ncpDays` is fixed at 0 (not meaningful for an arrear delta).
 */
export function buildArrearPFReport(
  params: BuildArrearPFReportParams,
): PFReportRow[] {
  const { departmentId } = params;
  const { entries } = buildArrearAccumulator(params);

  const rows: PFReportRow[] = [];

  for (const entry of entries.values()) {
    const { employee, totalDays, basicDiffRate, daDiffRate, newPfApplicable } = entry;

    if (employee.pfApplicable === false) continue;
    if (departmentId && employee.department !== departmentId) continue;
    if (totalDays <= 0) continue;

    const breakdown = computePayment(
      totalDays,
      basicDiffRate,
      daDiffRate,
      0,
      0,
      0,
      0,
      newPfApplicable,
    );

    const gross = breakdown.resultant1;
    if (gross <= 0) continue;

    const epfWages = newPfApplicable ? Math.min(gross, EPS_EDLI_CAP) : gross;
    const epsEdliWages = Math.min(epfWages, EPS_EDLI_CAP);

    rows.push({
      uan: employee.uan?.trim() ?? "",
      employeeName: employee.name?.trim() || employee.code || "",
      epfWagesGross: roundNearestInteger(gross),
      epfWages: roundNearestInteger(epfWages),
      epsWages: roundNearestInteger(epsEdliWages),
      edliWages: roundNearestInteger(epsEdliWages),
      pf: breakdown.pf,
      epfAmount: roundNearestInteger(epsEdliWages * 0.0833),
      ppfAmount: roundNearestInteger(epfWages * 0.0367),
      ncpDays: 0,
      lastColumn: 0,
    });
  }

  rows.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  return rows;
}
