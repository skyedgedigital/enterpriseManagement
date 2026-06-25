import type { Attendance, Designation, Employee, Wages, WorkOrder } from "@/types";
import {
  CONTRACTOR_BONUS_CORRESPONDING_LINE,
  CONTRACTOR_BONUS_OFFICE_LINE,
  CONTRACTOR_NAME,
} from "@/lib/constants";
import { buildWagesPaySlipData } from "@/lib/generateWagesPaySlip";

export interface BonusChecklistMonthCell {
  month: number;
  year: number;
  label: string;
  days: number;
  amount: number;
}

export interface BonusChecklistRow {
  employeeId: string;
  workManNo: string;
  employeeName: string;
  months: BonusChecklistMonthCell[];
  arrear: number;
  total: number;
  payRate: number;
  daysWorkedYear: number;
}

export interface BonusChecklistData {
  fyEndYear: number;
  fyLabel: string;
  periodFromDisplay: string;
  periodToDisplay: string;
  /** Company name (first line of header, bold) */
  contractorName: string;
  /** Second line, e.g. Office Add.-… */
  contractorOfficeLine: string;
  /** Third line, e.g. Corresponding Add.-… */
  contractorCorrespondingLine: string;
  /** Work order number when filtered; empty when “all” work orders */
  orderNumber: string;
  rows: BonusChecklistRow[];
}

/** Per-month and year-end sums for the footer row (amounts are net wages only; arrear is separate). */
export interface BonusChecklistFooterTotals {
  perMonth: { days: number; amount: number }[];
  sumArrear: number;
  /** Sum of all monthly net amounts in the grid (excludes arrear). */
  sumPaidExcludingArrear: number;
  sumDaysWorkedYear: number;
}

export function computeBonusChecklistFooterTotals(rows: BonusChecklistRow[]): BonusChecklistFooterTotals {
  if (rows.length === 0) {
    return {
      perMonth: [],
      sumArrear: 0,
      sumPaidExcludingArrear: 0,
      sumDaysWorkedYear: 0,
    };
  }
  const n = rows[0].months.length;
  const perMonth = Array.from({ length: n }, (_, i) => {
    let days = 0;
    let amount = 0;
    for (const r of rows) {
      const m = r.months[i];
      if (m) {
        days += m.days;
        amount += m.amount;
      }
    }
    return { days, amount };
  });
  let sumArrear = 0;
  let sumPaidExcludingArrear = 0;
  let sumDaysWorkedYear = 0;
  for (const r of rows) {
    sumArrear += r.arrear;
    sumDaysWorkedYear += r.daysWorkedYear;
    for (const m of r.months) {
      sumPaidExcludingArrear += m.amount;
    }
  }
  return { perMonth, sumArrear, sumPaidExcludingArrear, sumDaysWorkedYear };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** dd-mm-yyyy */
export function formatBonusPeriodDate(day: number, month: number, year: number): string {
  return `${pad2(day)}-${pad2(month)}-${year}`;
}

export function financialYearMonthSequence(
  fyEndYear: number,
): { year: number; month: number; label: string }[] {
  const labels = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const y0 = fyEndYear - 1;
  return labels.map((label, i) =>
    i < 9
      ? { year: y0, month: 4 + i, label }
      : { year: fyEndYear, month: i - 8, label },
  );
}

function pickWage(
  wages: Wages[],
  employeeId: string,
  year: number,
  month: number,
  workOrderId: string | undefined,
): Wages | null {
  const matches = wages.filter(
    (w) => w.employee === employeeId && w.year === year && w.month === month,
  );
  if (matches.length === 0) return null;
  if (workOrderId) {
    const exact = matches.filter((w) => w.workOrderHr === workOrderId);
    if (exact.length === 0) return null;
    return exact.slice().sort((a, b) => a.id.localeCompare(b.id))[0];
  }
  return matches.slice().sort((a, b) => a.id.localeCompare(b.id))[0];
}

function pickAttendance(
  attendances: Attendance[],
  employeeId: string,
  year: number,
  month: number,
  wageWorkOrderHr: string | undefined,
): Attendance | null {
  const matches = attendances.filter(
    (a) => a.employee === employeeId && a.year === year && a.month === month,
  );
  if (matches.length === 0) return null;
  if (wageWorkOrderHr) {
    const exact = matches.find((a) => a.workOrderHr === wageWorkOrderHr);
    if (exact) return exact;
  }
  return matches.slice().sort((a, b) => a.id.localeCompare(b.id))[0];
}

function workManSortKey(no: string): number {
  const n = parseInt(no.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 999999;
}

export interface BuildBonusChecklistParams {
  fyEndYear: number;
  workOrderId?: string;
  employees: Employee[];
  workOrders: WorkOrder[];
  designations: Designation[];
  wages: Wages[];
  attendances: Attendance[];
}

export function buildBonusChecklistData({
  fyEndYear,
  workOrderId,
  employees,
  workOrders,
  designations,
  wages,
  attendances,
}: BuildBonusChecklistParams): BonusChecklistData {
  const fyMonths = financialYearMonthSequence(fyEndYear);
  const wageInFy = wages.filter((w) =>
    fyMonths.some((m) => m.year === w.year && m.month === w.month),
  );
  const scopedWages = workOrderId
    ? wageInFy.filter((w) => w.workOrderHr === workOrderId)
    : wageInFy;
  const employeeIds = [...new Set(scopedWages.map((w) => w.employee))];

  const orderNumber = workOrderId
    ? (workOrders.find((wo) => wo.id === workOrderId)?.workOrderNumber ?? "").trim()
    : "";

  const rows: BonusChecklistRow[] = [];

  for (const employeeId of employeeIds) {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) continue;

    const months: BonusChecklistMonthCell[] = [];
    let payRate = 0;
    let daysWorkedYear = 0;
    let sumAmount = 0;

    for (const { year, month, label } of fyMonths) {
      const wageRow = pickWage(wages, employeeId, year, month, workOrderId);
      if (!wageRow) {
        months.push({ year, month, label, days: 0, amount: 0 });
        continue;
      }

      const attendance = pickAttendance(
        attendances,
        employeeId,
        year,
        month,
        wageRow.workOrderHr,
      );
      const workOrder = wageRow.workOrderHr
        ? workOrders.find((wo) => wo.id === wageRow.workOrderHr) ?? null
        : null;

      const slip = buildWagesPaySlipData({
        employee: emp,
        wages: wageRow,
        attendance,
        workOrder,
        designations,
        month,
        year,
        newPfApplicable: workOrder?.newPfApplicable ?? false,
      });

      const days = slip.daysWorked;
      const amount = slip.netAmountPaid;
      months.push({ year, month, label, days, amount });
      daysWorkedYear += days;
      sumAmount += amount;
      if (amount > 0) {
        payRate = slip.payRate;
      }
    }

    const arrear = 0;
    rows.push({
      employeeId,
      workManNo: emp.workManNo?.trim() || "—",
      employeeName: (emp.name ?? emp.code ?? "").trim() || "—",
      months,
      arrear,
      total: sumAmount + arrear,
      payRate,
      daysWorkedYear,
    });
  }

  rows.sort(
    (a, b) =>
      workManSortKey(a.workManNo) - workManSortKey(b.workManNo) ||
      a.employeeName.localeCompare(b.employeeName),
  );

  const y0 = fyEndYear - 1;
  return {
    fyEndYear,
    fyLabel: `${y0}-${fyEndYear}`,
    periodFromDisplay: formatBonusPeriodDate(1, 4, y0),
    periodToDisplay: formatBonusPeriodDate(31, 3, fyEndYear),
    contractorName: CONTRACTOR_NAME.replace(/,\s*$/, "").trim(),
    contractorOfficeLine: CONTRACTOR_BONUS_OFFICE_LINE,
    contractorCorrespondingLine: CONTRACTOR_BONUS_CORRESPONDING_LINE,
    orderNumber,
    rows,
  };
}
