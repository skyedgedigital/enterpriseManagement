import type { Bank } from "@/types";
import { computePayment } from "./paymentCalculation";
import {
  buildArrearAccumulator,
  type GenerateArrearParams,
} from "./generateArrear";
import type {
  BankStatementPTAData,
  BankStatementPTARow,
} from "@/components/pdf/BankStatementPTAPDF";

export interface BuildArrearBankReportParams extends GenerateArrearParams {
  banks: Bank[];
  departmentId?: string;
}

/**
 * Build bank-statement data for the arrear delta across the selected month range.
 *
 * `netAmount` per employee = arrear gross − PF − ESI, computed exactly the same
 * way as the Arrear PDF's "Net Amount Paid" column (via `computePayment` with
 * the selected Work Order's `newPfApplicable` flag). Employees with
 * `pfApplicable === false` are excluded so the bank-statement ties with the
 * arrear PF report. `month` / `year` on the output are the "To" month / year
 * (disbursement month).
 */
export function buildArrearBankStatementData(
  params: BuildArrearBankReportParams,
): BankStatementPTAData {
  const { banks, departmentId, toMonth, toYear } = params;
  const { entries } = buildArrearAccumulator(params);

  const included = [] as Array<{
    employeeId: string;
    name: string;
    workManNo: string;
    accountNumber: string;
    ifsc: string;
    netAmount: number;
  }>;

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

    if (breakdown.resultant1 <= 0) continue;

    const netAmount = Math.round(breakdown.netPayment);
    const bank = employee.bank ? banks.find((b) => b.id === employee.bank) ?? null : null;

    included.push({
      employeeId: employee.id,
      name: employee.name?.trim() || employee.code || "",
      workManNo: employee.workManNo ?? "",
      accountNumber: employee.accountNumber ?? "",
      ifsc: bank?.ifsc ?? "",
      netAmount,
    });
  }

  included.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  let totalAmount = 0;
  const rows: BankStatementPTARow[] = included.map((r, idx) => {
    totalAmount += r.netAmount;
    return {
      serialNo: idx + 1,
      workManNo: r.workManNo,
      name: r.name,
      bankAccount: r.accountNumber,
      ifsc: r.ifsc,
      netAmount: r.netAmount,
    };
  });

  return {
    month: toMonth,
    year: toYear,
    totalAmount,
    rows,
  };
}
