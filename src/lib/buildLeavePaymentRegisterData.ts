import type { Attendance, Designation, Employee, Wages, WorkOrder } from "@/types";
import {
  CONTRACTOR_BONUS_CORRESPONDING_LINE,
  CONTRACTOR_BONUS_OFFICE_LINE,
  CONTRACTOR_NAME,
  LEAVE_MUSTER_CONTRACTOR_PARTY_TEXT,
  LEAVE_MUSTER_PRINCIPAL_EMPLOYER_TEXT,
} from "@/lib/constants";
import { buildWagesPaySlipData } from "@/lib/generateWagesPaySlip";
import { getWeeklyAllowanceSummaryFromAttendance } from "@/lib/paymentCalculation";
import { roundNearestInteger, roundHalfUp2 } from "@/lib/moneyRounding";
import {
  calendarYearMonthSequence,
  formatLeaveRegisterPeriodDate,
  pickAttendanceForMonth,
} from "@/lib/buildLeaveRegisterChecklistData";
import { computeLiveRegisterLeaveEntitlements } from "@/lib/liveRegisterLeaveEntitlements";

export interface LeavePaymentRegisterRow {
  employeeId: string;
  employeeName: string;
  workmanNo: string;
  designationNature: string;
  daysCl: number;
  daysEl: number;
  daysFl: number;
  daysLeaveTotal: number;
  basicRate: number;
  daRate: number;
  rateTotal: number;
  sumBasicWages: number;
  sumDa: number;
  sumOvertime: number;
  sumOtherCashPayment: number;
  sumTotalWages: number;
  sumPf: number;
  sumEsi: number;
  sumOthersDeduction: number;
  sumNetPaid: number;
  /** Column 17 — left blank for manual entry. */
  remarks: string;
}

export interface LeavePaymentRegisterData {
  calendarYear: number;
  periodFromDisplay: string;
  periodToDisplay: string;
  companyName: string;
  officeLine: string;
  correspondingLine: string;
  natureLocationOfWork: string;
  workOrderNumber: string;
  establishmentNameAddress: string;
  principalEmployerNameAddress: string;
  rows: LeavePaymentRegisterRow[];
}

function workManSortKey(no: string): number {
  const n = parseInt(no.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 999999;
}

function getDesignationName(employee: Employee, designations: Designation[]): string {
  const designation = employee.designation
    ? designations.find((d) => d.id === employee.designation) ?? null
    : null;
  return designation?.designation?.trim() || "—";
}

function pickWageForMonth(
  wagesList: Wages[],
  employeeId: string,
  year: number,
  month: number,
  workOrderId?: string,
): Wages | null {
  const matches = wagesList.filter(
    (w) => w.employee === employeeId && w.year === year && w.month === month,
  );
  if (matches.length === 0) return null;
  if (workOrderId) {
    const exact = matches.find((w) => w.workOrderHr === workOrderId);
    if (exact) return exact;
  }
  return matches.slice().sort((a, b) => a.id.localeCompare(b.id))[0];
}

/** Same disambiguation as Form17: match wage row work order, then any row for that month. */
function pickAttendanceForWageRow(
  attendances: Attendance[],
  employeeId: string,
  year: number,
  month: number,
  wageWorkOrderHr?: string | null,
): Attendance | null {
  if (wageWorkOrderHr) {
    const exact = attendances.find(
      (a) =>
        a.employee === employeeId &&
        a.year === year &&
        a.month === month &&
        a.workOrderHr === wageWorkOrderHr,
    );
    if (exact) return exact;
  }
  return (
    attendances.find(
      (a) => a.employee === employeeId && a.year === year && a.month === month,
    ) ?? null
  );
}

export interface BuildLeavePaymentRegisterParams {
  calendarYear: number;
  workOrderId?: string;
  employees: Employee[];
  workOrders: WorkOrder[];
  designations: Designation[];
  wages: Wages[];
  attendances: Attendance[];
}

export function buildLeavePaymentRegisterData({
  calendarYear,
  workOrderId,
  employees,
  workOrders,
  designations,
  wages,
  attendances,
}: BuildLeavePaymentRegisterParams): LeavePaymentRegisterData {
  const yearWages = wages.filter((w) => w.year === calendarYear);
  const scopedWages = workOrderId
    ? yearWages.filter((w) => w.workOrderHr === workOrderId)
    : yearWages;

  const employeeIds = [...new Set(scopedWages.map((w) => w.employee))];

  const yearAttendances = attendances.filter((a) => a.year === calendarYear);
  const scopedAtt = workOrderId
    ? yearAttendances.filter((a) => a.workOrderHr === workOrderId)
    : yearAttendances;

  const selectedWorkOrder = workOrderId
    ? workOrders.find((wo) => wo.id === workOrderId) ?? null
    : null;

  const natureParts = [selectedWorkOrder?.jobDesc, selectedWorkOrder?.orderDesc].filter(
    (s): s is string => Boolean(s && String(s).trim()),
  );
  const natureLocationOfWork = natureParts.join(" — ");
  const workOrderNumber = selectedWorkOrder?.workOrderNumber?.trim() ?? "";

  const monthSeq = calendarYearMonthSequence(calendarYear);
  const rows: LeavePaymentRegisterRow[] = [];

  for (const employeeId of employeeIds) {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) continue;

    let totalDaysForLeave = 0;
    for (const { year, month } of monthSeq) {
      const att = pickAttendanceForMonth(scopedAtt, employeeId, year, month, workOrderId);
      totalDaysForLeave += Number(att?.presentDays) || 0;
    }
    const leaveEnt = computeLiveRegisterLeaveEntitlements(totalDaysForLeave);
    const daysEl = leaveEnt.earnedLeave;
    const daysCl = leaveEnt.casualLeave;
    const daysFl = leaveEnt.festivalLeave;
    const daysLeaveTotal = daysEl + daysCl + daysFl;

    let sumBasicWages = 0;
    let sumDa = 0;
    let sumOtherCashPayment = 0;
    let sumTotalWages = 0;
    let sumPf = 0;
    let sumEsi = 0;
    let sumOthersDeduction = 0;
    let sumNetPaid = 0;

    let latestMonth = 0;
    let basicRateLast = 0;
    let daRateLast = 0;

    for (const { year, month } of monthSeq) {
      const w = pickWageForMonth(scopedWages, employeeId, year, month, workOrderId);
      if (!w) continue;

      const woId = w.workOrderHr ?? workOrderId ?? "";
      const workOrder = woId ? workOrders.find((wo) => wo.id === woId) ?? null : null;

      const attendance = pickAttendanceForWageRow(
        yearAttendances,
        employeeId,
        year,
        month,
        w.workOrderHr,
      );

      const weeklyAllowanceAmount =
        attendance?.weeklyAllowanceAmount ??
        (attendance?.days?.length && attendance.year != null && attendance.month != null
          ? getWeeklyAllowanceSummaryFromAttendance(
              attendance.days,
              attendance.year,
              attendance.month,
            ).weeklyAllowanceAmount
          : 0);

      const slip = buildWagesPaySlipData({
        employee: emp,
        wages: w,
        attendance,
        workOrder,
        designations,
        month,
        year,
        newPfApplicable: workOrder?.newPfApplicable ?? false,
      });

      sumBasicWages += slip.basicAmount;
      sumDa += slip.daAmount;
      sumOtherCashPayment +=
        slip.raw.otherCash +
        ((w.allowances ?? 0) + weeklyAllowanceAmount) +
        (slip.incentiveAmount ?? 0);
      sumTotalWages += slip.grossWages;
      sumPf += slip.raw.pf;
      sumEsi += slip.raw.esi;
      sumOthersDeduction += w.otherDeduction ?? 0;
      sumNetPaid += slip.raw.netAmountPaid;

      if (month >= latestMonth) {
        latestMonth = month;
        basicRateLast = slip.basicRate;
        daRateLast = slip.daRate;
      }
    }

    rows.push({
      employeeId,
      employeeName: (emp.name ?? emp.code ?? "").trim() || "—",
      workmanNo: emp.workManNo?.trim() || "—",
      designationNature: getDesignationName(emp, designations),
      daysCl,
      daysEl,
      daysFl,
      daysLeaveTotal,
      basicRate: basicRateLast,
      daRate: daRateLast,
      rateTotal: basicRateLast + daRateLast,
      sumBasicWages: roundHalfUp2(sumBasicWages),
      sumDa: roundHalfUp2(sumDa),
      sumOvertime: 0,
      sumOtherCashPayment: roundNearestInteger(sumOtherCashPayment),
      sumTotalWages: roundHalfUp2(sumTotalWages),
      sumPf: roundNearestInteger(sumPf),
      sumEsi: roundNearestInteger(sumEsi),
      sumOthersDeduction: roundNearestInteger(sumOthersDeduction),
      sumNetPaid: roundNearestInteger(sumNetPaid),
      remarks: "",
    });
  }

  rows.sort(
    (a, b) =>
      workManSortKey(a.workmanNo) - workManSortKey(b.workmanNo) ||
      a.employeeName.localeCompare(b.employeeName),
  );

  return {
    calendarYear,
    periodFromDisplay: formatLeaveRegisterPeriodDate(1, 1, calendarYear),
    periodToDisplay: formatLeaveRegisterPeriodDate(31, 12, calendarYear),
    companyName: CONTRACTOR_NAME.replace(/,\s*$/, "").trim(),
    officeLine: CONTRACTOR_BONUS_OFFICE_LINE,
    correspondingLine: CONTRACTOR_BONUS_CORRESPONDING_LINE,
    natureLocationOfWork,
    workOrderNumber,
    establishmentNameAddress: LEAVE_MUSTER_CONTRACTOR_PARTY_TEXT,
    principalEmployerNameAddress: LEAVE_MUSTER_PRINCIPAL_EMPLOYER_TEXT,
    rows,
  };
}
