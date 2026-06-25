import type { Attendance, Employee, WorkOrder } from "@/types";
import {
  CONTRACTOR_BONUS_CORRESPONDING_LINE,
  CONTRACTOR_BONUS_OFFICE_LINE,
  CONTRACTOR_NAME,
  LEAVE_MUSTER_CONTRACTOR_PARTY_TEXT,
  LEAVE_MUSTER_PRINCIPAL_EMPLOYER_TEXT,
} from "@/lib/constants";
import { computeLiveRegisterLeaveEntitlements } from "@/lib/liveRegisterLeaveEntitlements";

export interface LeaveRegisterMonthCell {
  month: number;
  label: string;
  /** Days worked (present days) for the month; 0 if no attendance record */
  presentDays: number;
}

export interface LeaveRegisterRow {
  employeeId: string;
  workManNo: string;
  employeeName: string;
  fathersName: string;
  sex: string;
  months: LeaveRegisterMonthCell[];
  totalPresent: number;
  /** EL from total present days: floor(totalPresent / 20) */
  totalEL: number;
  /** CL from total present days: ceil(totalPresent / 35) */
  totalCL: number;
  /** FL from total present days: floor(totalPresent / 60) */
  totalFL: number;
  totalLeave: number;
  remarks: string;
}

export interface LeaveRegisterChecklistData {
  calendarYear: number;
  periodFromDisplay: string;
  periodToDisplay: string;
  orderNumber: string;
  /** Left header — company (bold line) */
  companyName: string;
  officeLine: string;
  correspondingLine: string;
  natureLocationOfWork: string;
  contractorPartyText: string;
  principalEmployerText: string;
  rows: LeaveRegisterRow[];
}

export interface LeaveRegisterFooterTotals {
  perMonthPresent: number[];
  sumTotalPresent: number;
  sumEL: number;
  sumCL: number;
  sumFL: number;
  sumTotalLeave: number;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** dd-mm-yyyy */
export function formatLeaveRegisterPeriodDate(day: number, month: number, year: number): string {
  return `${pad2(day)}-${pad2(month)}-${year}`;
}

export function calendarYearMonthSequence(
  calendarYear: number,
): { year: number; month: number; label: string }[] {
  const labels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return labels.map((label, i) => ({ year: calendarYear, month: i + 1, label }));
}

export function pickAttendanceForMonth(
  attendances: Attendance[],
  employeeId: string,
  year: number,
  month: number,
  workOrderId?: string,
): Attendance | null {
  const matches = attendances.filter(
    (a) => a.employee === employeeId && a.year === year && a.month === month,
  );
  if (matches.length === 0) return null;
  if (workOrderId) {
    const exact = matches.find((a) => a.workOrderHr === workOrderId);
    if (exact) return exact;
  }
  return matches.slice().sort((a, b) => a.id.localeCompare(b.id))[0];
}

function workManSortKey(no: string): number {
  const n = parseInt(no.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 999999;
}

export function computeLeaveRegisterFooterTotals(rows: LeaveRegisterRow[]): LeaveRegisterFooterTotals {
  if (rows.length === 0) {
    return {
      perMonthPresent: [],
      sumTotalPresent: 0,
      sumEL: 0,
      sumCL: 0,
      sumFL: 0,
      sumTotalLeave: 0,
    };
  }
  const n = rows[0].months.length;
  const perMonthPresent = Array.from({ length: n }, (_, i) => {
    let sum = 0;
    for (const r of rows) {
      sum += r.months[i]?.presentDays ?? 0;
    }
    return sum;
  });
  let sumTotalPresent = 0;
  let sumEL = 0;
  let sumCL = 0;
  let sumFL = 0;
  let sumTotalLeave = 0;
  for (const r of rows) {
    sumTotalPresent += r.totalPresent;
    sumEL += r.totalEL;
    sumCL += r.totalCL;
    sumFL += r.totalFL;
    sumTotalLeave += r.totalLeave;
  }
  return { perMonthPresent, sumTotalPresent, sumEL, sumCL, sumFL, sumTotalLeave };
}

export interface BuildLeaveRegisterChecklistParams {
  calendarYear: number;
  workOrderId?: string;
  employees: Employee[];
  workOrders: WorkOrder[];
  attendances: Attendance[];
}

export function buildLeaveRegisterChecklistData({
  calendarYear,
  workOrderId,
  employees,
  workOrders,
  attendances,
}: BuildLeaveRegisterChecklistParams): LeaveRegisterChecklistData {
  const yearAtt = attendances.filter((a) => a.year === calendarYear);
  const scoped = workOrderId
    ? yearAtt.filter((a) => a.workOrderHr === workOrderId)
    : yearAtt;

  const employeeIds = [...new Set(scoped.map((a) => a.employee))];

  const selectedWorkOrder = workOrderId
    ? workOrders.find((wo) => wo.id === workOrderId) ?? null
    : null;
  const orderNumber = selectedWorkOrder?.workOrderNumber?.trim() ?? "";

  const natureParts = [selectedWorkOrder?.jobDesc, selectedWorkOrder?.orderDesc].filter(
    (s): s is string => Boolean(s && String(s).trim()),
  );
  const natureLocationOfWork = natureParts.join(" — ");

  const monthSeq = calendarYearMonthSequence(calendarYear);
  const rows: LeaveRegisterRow[] = [];

  for (const employeeId of employeeIds) {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) continue;

    const months: LeaveRegisterMonthCell[] = [];
    let totalPresent = 0;

    for (const { month, label } of monthSeq) {
      const att = pickAttendanceForMonth(
        scoped,
        employeeId,
        calendarYear,
        month,
        workOrderId,
      );
      if (!att) {
        months.push({ month, label, presentDays: 0 });
        continue;
      }
      const pd = Number(att.presentDays) || 0;
      months.push({ month, label, presentDays: pd });
      totalPresent += pd;
    }

    const ent = computeLiveRegisterLeaveEntitlements(totalPresent);
    const totalEL = ent.earnedLeave;
    const totalCL = ent.casualLeave;
    const totalFL = ent.festivalLeave;
    const totalLeave = totalEL + totalCL + totalFL;
    rows.push({
      employeeId,
      workManNo: emp.workManNo?.trim() || "—",
      employeeName: (emp.name ?? emp.code ?? "").trim() || "—",
      fathersName: (emp.fathersName ?? "").trim() || "—",
      sex: emp.sex ?? "—",
      months,
      totalPresent,
      totalEL,
      totalCL,
      totalFL,
      totalLeave,
      remarks: "",
    });
  }

  rows.sort(
    (a, b) =>
      workManSortKey(a.workManNo) - workManSortKey(b.workManNo) ||
      a.employeeName.localeCompare(b.employeeName),
  );

  return {
    calendarYear,
    periodFromDisplay: formatLeaveRegisterPeriodDate(1, 1, calendarYear),
    periodToDisplay: formatLeaveRegisterPeriodDate(31, 12, calendarYear),
    orderNumber,
    companyName: CONTRACTOR_NAME.replace(/,\s*$/, "").trim(),
    officeLine: CONTRACTOR_BONUS_OFFICE_LINE,
    correspondingLine: CONTRACTOR_BONUS_CORRESPONDING_LINE,
    natureLocationOfWork,
    contractorPartyText: LEAVE_MUSTER_CONTRACTOR_PARTY_TEXT,
    principalEmployerText: LEAVE_MUSTER_PRINCIPAL_EMPLOYER_TEXT,
    rows,
  };
}
