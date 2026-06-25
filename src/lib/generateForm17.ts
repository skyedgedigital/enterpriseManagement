import { createElement } from "react";
import type { Attendance, Designation, Employee, Wages, WorkOrder } from "@/types";
import { openPDFInNewTab } from "./pdfUtils";
import { Form17PDF, type Form17Row } from "@/components/pdf/Form17PDF";
import { buildWagesPaySlipData } from "./generateWagesPaySlip";
import { getWeeklyAllowanceSummaryFromAttendance } from "./paymentCalculation";
import { getAttendanceSliceForWorkOrder } from "./attendanceSlice";

export interface GenerateForm17Params {
  employees: Employee[];
  wages: Wages[];
  attendances: Attendance[];
  workOrders: WorkOrder[];
  designations: Designation[];
  month: number;
  year: number;
  workOrderId: string;
  location: string;
  employer: string;
}

export interface Form17Data {
  rows: Form17Row[];
  establishmentNameAddress: string;
  workNameLocation: string;
  principalEmployerNameAddress: string;
  month: number;
  year: number;
}

function getDesignationName(employee: Employee, designations: Designation[]): string {
  const designation = employee.designation
    ? designations.find((d) => d.id === employee.designation) ?? null
    : null;
  return designation?.designation?.trim() || "-";
}

export async function generateForm17({
  employees,
  wages,
  attendances,
  workOrders,
  designations,
  month,
  year,
  workOrderId,
  location,
  employer,
}: GenerateForm17Params): Promise<void> {
  const data = buildForm17Data({
    employees,
    wages,
    attendances,
    workOrders,
    designations,
    month,
    year,
    workOrderId,
    location,
    employer,
  });
  await openPDFInNewTab(createElement(Form17PDF, data));
}

export function buildForm17Data({
  employees,
  wages,
  attendances,
  workOrders,
  designations,
  month,
  year,
  workOrderId,
  location,
  employer,
}: GenerateForm17Params): Form17Data {
  const wagesForPeriod = wages.filter(
    (w) => w.year === year && w.month === month && w.workOrderHr === workOrderId,
  );

  const rows: Form17Row[] = [];

  for (const w of wagesForPeriod) {
    const employee = employees.find((e) => e.id === w.employee);
    if (!employee) continue;

    const attendance =
      attendances.find(
        (a) => a.employee === employee.id && a.year === year && a.month === month,
      ) ?? null;

    const workOrder = workOrders.find((wo) => wo.id === workOrderId) ?? null;
    const slice = getAttendanceSliceForWorkOrder(attendance, workOrderId);
    const weeklyAllowanceAmount =
      slice.days.length && attendance?.year != null && attendance?.month != null
        ? getWeeklyAllowanceSummaryFromAttendance(
            slice.days,
            attendance.year,
            attendance.month,
          ).weeklyAllowanceAmount
        : 0;
    const slip = buildWagesPaySlipData({
      employee,
      wages: w,
      attendance,
      workOrder,
      designations,
      month,
      year,
      newPfApplicable: workOrder?.newPfApplicable ?? false,
    });

    rows.push({
      employeeName: slip.employeeName,
      workmanNo: slip.workmanNo,
      designation: getDesignationName(employee, designations),
      daysWorked: slip.daysWorked,
      basicRate: slip.basicRate,
      daRate: slip.daRate,
      basicAmount: slip.basicAmount,
      daAmount: slip.daAmount,
      otherCash: slip.otherCash,
      allowances: Math.round((w.allowances ?? 0) + weeklyAllowanceAmount),
      incentiveAmount: Math.round(slip.incentiveAmount ?? 0),
      grossWages: slip.grossWages,
      pf: slip.pf,
      esi: slip.esi,
      otherDeduction: Math.round(w.otherDeduction ?? 0),
      netAmountPaid: slip.netAmountPaid,
    });
  }

  rows.sort((a, b) => a.employeeName.localeCompare(b.employeeName));

  const selectedWorkOrder = workOrders.find((wo) => wo.id === workOrderId) ?? null;

  return {
    rows,
    establishmentNameAddress: selectedWorkOrder?.workOrderNumber ?? "",
    workNameLocation: location,
    principalEmployerNameAddress: employer,
    month,
    year,
  };
}
