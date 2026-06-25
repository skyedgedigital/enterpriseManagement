import { createElement } from "react";
import type { Employee, Wages, WorkOrder, Designation, Attendance } from "@/types";
import {
  computePayment,
  getEarnedIncentive,
  getWeeklyAllowanceSummaryFromAttendance,
} from "./paymentCalculation";
import { getAttendanceSliceForWorkOrder } from "./attendanceSlice";
import { openPDFInNewTab } from "./pdfUtils";
import { WagesPaySlipPDF } from "@/components/pdf/WagesPaySlipPDF";
import type { WagesPaySlipData } from "@/components/pdf/WagesPaySlipPDF";

interface GenerateParams {
  employee: Employee;
  wages: Wages;
  attendance: Attendance | null;
  workOrder: WorkOrder | null;
  designations: Designation[];
  month: number;
  year: number;
  newPfApplicable?: boolean;
}

export function buildWagesPaySlipData({
  employee,
  wages,
  attendance,
  workOrder,
  designations,
  month,
  year,
  newPfApplicable = false,
}: GenerateParams): WagesPaySlipData {
  const designation = employee.designation
    ? designations.find((d) => d.id === employee.designation) ?? null
    : null;

  const basicRate = wages.basic ?? (designation ? Number(designation.basic) || 0 : 0);
  const daRate = wages.da ?? (designation ? Number(designation.da) || 0 : 0);
  const payRate = basicRate + daRate;
  const otherCash = wages.otherCash ?? 0;

  // The pay slip is always per (employee, work order, month). Slice the monthly attendance
  // record down to the days belonging to this work order so day counts and weekly allowance
  // are not inflated by days that were worked under a different work order.
  const workOrderIdForSlice = workOrder?.id ?? wages.workOrderHr ?? null;
  const slice = getAttendanceSliceForWorkOrder(attendance, workOrderIdForSlice);

  const weeklyAllowanceAmount =
    slice.days.length && attendance?.year != null && attendance.month != null
      ? getWeeklyAllowanceSummaryFromAttendance(
          slice.days,
          attendance.year,
          attendance.month,
        ).weeklyAllowanceAmount
      : 0;
  const allowances = (wages.allowances ?? 0) + weeklyAllowanceAmount;
  const otherDeduction = wages.otherDeduction ?? 0;
  const daysWorked = slice.days.length > 0 ? slice.presentDays : wages.attendance;
  const monthlyIncentive =
    wages.incentiveApplicable ? wages.incentiveAmount ?? 0 : 0;
  const incentiveEarned = getEarnedIncentive(monthlyIncentive, daysWorked);

  const breakdown = computePayment(
    daysWorked,
    basicRate,
    daRate,
    otherCash,
    allowances,
    incentiveEarned,
    otherDeduction,
    newPfApplicable,
  );

  return {
    employeeName: employee.name ?? employee.code,
    workmanNo: employee.workManNo ?? "",
    accountNumber: employee.accountNumber ?? "",
    uan: employee.uan ?? "",
    esicNo: employee.esicNo ?? "",
    natureOfWork: workOrder
      ? [workOrder.jobDesc, workOrder.orderDesc].filter(Boolean).join(" — ")
      : "",
    month,
    year,
    daysWorked,
    basicRate: Math.round(basicRate),
    daRate: Math.round(daRate),
    payRate: Math.round(payRate),
    basicAmount: Math.round(basicRate * daysWorked),
    daAmount: Math.round(daRate * daysWorked),
    otherCash: breakdown.otherCash,
    grossWages: breakdown.resultant2,
    advanceDeduction: Math.round(wages.advanceDeduction ?? 0),
    damageDeduction: Math.round(wages.damageDeduction ?? 0),
    pf: breakdown.pf,
    esi: breakdown.esi,
    incentiveAmount: wages.incentiveApplicable ? Math.round(incentiveEarned) : null,
    netAmountPaid: breakdown.netPayment,
    raw: {
      pf: breakdown.raw.pf,
      esi: breakdown.raw.esi,
      otherDeduction: breakdown.raw.otherDeduction,
      otherCash: breakdown.raw.otherCash,
      netAmountPaid: breakdown.raw.netPayment,
    },
  };
}

export async function generateWagesPaySlip(params: GenerateParams): Promise<void> {
  const data = buildWagesPaySlipData(params);
  await openPDFInNewTab(createElement(WagesPaySlipPDF, { data }));
}
