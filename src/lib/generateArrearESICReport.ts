import { roundNearestInteger } from "./moneyRounding";
import {
  buildArrearAccumulator,
  type ArrearRowFilter,
  type GenerateArrearParams,
} from "./generateArrear";
import type { ESICReportRow } from "./generateESICReport";

export interface BuildArrearESICReportParams extends GenerateArrearParams {
  state?: string;
}

function to10DigitIPNumber(esicNo: string | undefined): string {
  const digits = (esicNo ?? "").replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits.padStart(10, "0").slice(-10);
}

/**
 * Build ESIC report rows for the arrear delta across the selected month range.
 *
 * - `totalMonthlyWage` = (basicDiff + daDiff) amount accumulated across the range.
 * - `daysPaid` = total days worked across the range.
 * - Employees with `esicApplicable === false` are excluded.
 * - When `state` is provided, only attendance / wages rows whose `workOrderHr`
 *   matches a Work Order with that state contribute — same rule as
 *   {@link buildESICReport}.
 */
export function buildArrearESICReport(
  params: BuildArrearESICReportParams,
): ESICReportRow[] {
  const { state } = params;

  const rowFilter: ArrearRowFilter | undefined = state
    ? (row, workOrders) => {
        if (!row.workOrderHr) return false;
        const wo = workOrders.find((o) => o.id === row.workOrderHr);
        return !!(wo && wo.state === state);
      }
    : undefined;

  const { entries } = buildArrearAccumulator(params, { rowFilter });

  const rows: ESICReportRow[] = [];

  for (const entry of entries.values()) {
    const { employee, totalDays, basicDiffAmount, daDiffAmount } = entry;

    if (employee.esicApplicable === false) continue;
    if (totalDays <= 0) continue;

    const totalMonthlyWage = basicDiffAmount + daDiffAmount;
    if (totalMonthlyWage <= 0) continue;

    rows.push({
      slNo: 0,
      ipNumber: to10DigitIPNumber(employee.esicNo),
      ipName: (employee.name?.trim() || employee.code || "").toUpperCase(),
      daysPaid: totalDays,
      totalMonthlyWage: roundNearestInteger(totalMonthlyWage),
    });
  }

  rows.sort((a, b) => a.ipName.localeCompare(b.ipName));
  rows.forEach((r, i) => {
    r.slNo = i + 1;
  });

  return rows;
}
