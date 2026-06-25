import { createElement } from "react";
import type { Employee, Wages, Bank, Attendance, WorkOrder } from "@/types";
import { openPDFInNewTab } from "./pdfUtils";
import {
  computePayment,
  getEarnedIncentive,
  getWeeklyAllowanceSummaryFromAttendance,
} from "./paymentCalculation";
import { BankStatementPTAPDF } from "@/components/pdf/BankStatementPTAPDF";
import type {
  BankStatementPTAData,
  BankStatementPTARow,
} from "@/components/pdf/BankStatementPTAPDF";

export interface GenerateBankStatementPTAParams {
  employees: Employee[];
  wages: Wages[];
  attendances: Attendance[];
  banks: Bank[];
  workOrders: WorkOrder[];
  year: number;
  month: number;
  workOrderId?: string;
  departmentId?: string;
}

function periodString(month: number, year: number): string {
  return `${String(month).padStart(2, "0")}-${year}`;
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getMonthlyNetForStatement(
  wage: Wages,
  attendances: Attendance[],
  workOrders: WorkOrder[],
  year: number,
  month: number,
  selectedWorkOrderId?: string,
): number {
  const attendanceByWorkOrder =
    attendances.find(
      (a) =>
        a.employee === wage.employee &&
        a.year === year &&
        a.month === month &&
        (selectedWorkOrderId
          ? a.workOrderHr === selectedWorkOrderId
          : wage.workOrderHr
            ? a.workOrderHr === wage.workOrderHr
            : true),
    ) ?? null;

  const attendanceAny =
    attendanceByWorkOrder ??
    attendances.find(
      (a) => a.employee === wage.employee && a.year === year && a.month === month,
    ) ??
    null;

  const attendanceDays = toNumber(attendanceAny?.presentDays ?? wage.attendance);
  const basic = toNumber(wage.basic);
  const da = toNumber(wage.da);
  const payRate = toNumber(wage.payRate);
  const otherCash = toNumber(wage.otherCash);
  const weeklyAllowanceAmount = attendanceAny?.weeklyAllowanceAmount ??
    (attendanceAny?.days?.length && attendanceAny.year != null && attendanceAny.month != null
      ? getWeeklyAllowanceSummaryFromAttendance(
          attendanceAny.days,
          attendanceAny.year,
          attendanceAny.month,
        ).weeklyAllowanceAmount
      : 0);
  const allowances = toNumber(wage.allowances) + toNumber(weeklyAllowanceAmount);
  const otherDeduction = toNumber(wage.otherDeduction);
  const workOrder = selectedWorkOrderId
    ? workOrders.find((wo) => wo.id === selectedWorkOrderId) ?? null
    : wage.workOrderHr
      ? workOrders.find((wo) => wo.id === wage.workOrderHr) ?? null
      : null;

  // If legacy rows only have payRate, treat it as (basic + da) combined.
  const resolvedBasic = basic || da ? basic : payRate;
  const resolvedDa = basic || da ? da : 0;

  const monthlyIncentive = toNumber(wage.incentiveAmount);
  const incentiveEarned = getEarnedIncentive(monthlyIncentive, attendanceDays);
  const computed = computePayment(
    attendanceDays,
    resolvedBasic,
    resolvedDa,
    otherCash,
    allowances,
    incentiveEarned,
    otherDeduction,
    workOrder?.newPfApplicable ?? false,
  );

  return Math.round(computed.netPayment);
}

export async function generateBankStatementPTA({
  employees,
  wages,
  attendances,
  banks,
  workOrders,
  year,
  month,
  workOrderId,
  departmentId,
}: GenerateBankStatementPTAParams): Promise<void> {
  const data = buildBankStatementPTAData({
    employees,
    wages,
    attendances,
    banks,
    workOrders,
    year,
    month,
    workOrderId,
    departmentId,
  });
  await openPDFInNewTab(createElement(BankStatementPTAPDF, { data }));
}

export function buildBankStatementPTAData({
  employees,
  wages,
  attendances,
  banks,
  workOrders,
  year,
  month,
  workOrderId,
  departmentId,
}: GenerateBankStatementPTAParams): BankStatementPTAData {
  const period = periodString(month, year);
  const includeAllWorkOrders = !workOrderId;

  const wageAmountByEmployee = new Map<string, number>();
  for (const w of wages) {
    if (w.year !== year || w.month !== month) continue;
    if (!includeAllWorkOrders && w.workOrderHr !== workOrderId) continue;
    wageAmountByEmployee.set(
      w.employee,
      (wageAmountByEmployee.get(w.employee) ?? 0) +
        getMonthlyNetForStatement(
          w,
          attendances,
          workOrders,
          year,
          month,
          workOrderId,
        )
    );
  }

  const filtered = employees.filter((emp) => {
    const woList = emp.workOrderHr ?? [];
    const assigned = woList.some(
      (wo) =>
        wo.period === period &&
        (includeAllWorkOrders || wo.workOrderHr === workOrderId)
    );
    if (!assigned) return false;
    if (!wageAmountByEmployee.has(emp.id)) return false;
    if (departmentId && emp.department !== departmentId) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const na = (a.name ?? a.code ?? "").toLowerCase();
    const nb = (b.name ?? b.code ?? "").toLowerCase();
    return na.localeCompare(nb);
  });

  let totalAmount = 0;
  const rows: BankStatementPTARow[] = sorted.map((emp, idx) => {
    const amountRounded = Math.round(wageAmountByEmployee.get(emp.id) ?? 0);
    totalAmount += amountRounded;
    const bank = emp.bank ? banks.find((b) => b.id === emp.bank) : null;
    return {
      serialNo: idx + 1,
      workManNo: emp.workManNo ?? "",
      name: emp.name ?? emp.code ?? "",
      bankAccount: emp.accountNumber ?? "",
      ifsc: bank?.ifsc ?? "",
      netAmount: amountRounded,
    };
  });

  const data: BankStatementPTAData = {
    month,
    year,
    totalAmount,
    rows,
  };

  return data;
}
