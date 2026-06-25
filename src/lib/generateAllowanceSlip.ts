import { createElement } from "react";
import type { Attendance, Employee, Wages, WorkOrder } from "@/types";
import { CONTRACTOR_ADDRESS, CONTRACTOR_NAME } from "./constants";
import { roundHalfUp2, roundNearestInteger } from "./moneyRounding";
import { openPDFInNewTab } from "./pdfUtils";
import { AllowanceSlipPDF } from "@/components/pdf/AllowanceSlipPDF";
import type { AllowanceSlipRow } from "@/components/pdf/AllowanceSlipPDF";
import { getAttendanceSliceForWorkOrder } from "./attendanceSlice";

export interface GenerateAllowanceSlipParams {
  employees: Employee[];
  wages: Wages[];
  attendances: Attendance[];
  workOrders: WorkOrder[];
  month: number;
  year: number;
  workOrderId?: string;
}

export interface AllowanceSlipData {
  month: number;
  year: number;
  contractorNameAddress: string;
  establishmentNameAddress: string;
  workNameLocation: string;
  principalEmployerNameAddress: string;
  rows: AllowanceSlipRow[];
}

function getNhDays(days: Attendance["days"] | undefined): number {
  if (!days?.length) return 0;
  return days.reduce((sum, day) => sum + (day.status === "NH" ? 1 : 0), 0);
}

export async function generateAllowanceSlip({
  employees,
  wages,
  attendances,
  workOrders,
  month,
  year,
  workOrderId,
}: GenerateAllowanceSlipParams): Promise<void> {
  const data = buildAllowanceSlipData({
    employees,
    wages,
    attendances,
    workOrders,
    month,
    year,
    workOrderId,
  });
  await openPDFInNewTab(createElement(AllowanceSlipPDF, { data }));
}

export function buildAllowanceSlipData({
  employees,
  wages,
  attendances,
  workOrders,
  month,
  year,
  workOrderId,
}: GenerateAllowanceSlipParams): AllowanceSlipData {
  const relevantWages = wages.filter((w) => {
    if (w.year !== year || w.month !== month) return false;
    if (!workOrderId) return true;
    return w.workOrderHr === workOrderId;
  });

  const rows: AllowanceSlipRow[] = relevantWages
    .map((w, index) => {
      const employee = employees.find((e) => e.id === w.employee);
      if (!employee) return null;

      const attendance =
        attendances.find(
          (a) => a.employee === employee.id && a.year === year && a.month === month,
        ) ?? null;

      // Slice the monthly attendance to the work order tied to this wages row. If the wages
      // row is not tied to a specific work order, fall back to the full month.
      const slice = getAttendanceSliceForWorkOrder(
        attendance,
        w.workOrderHr ?? null,
      );
      const presentDays = slice.days.length > 0 ? slice.presentDays : (w.attendance ?? 0);
      const nh = getNhDays(slice.days);
      const hra = roundHalfUp2(Number(employee.hra) || 0);
      const earnedOtherCash = roundNearestInteger(w.otherCash ?? 0);
      const otherAllowance = roundHalfUp2(w.allowances ?? 0);

      const row: AllowanceSlipRow = {
        slNo: index + 1,
        employeeName: employee.name || employee.code,
        employeeCode: employee.code,
        presentDays: roundHalfUp2(presentDays),
        nh: roundHalfUp2(nh),
        hra,
        monthlyMobileAllowance: 0,
        monthlyIncumbentAllowance: 0,
        earnedOtherCash,
        performanceBonus: 0,
        washingAllowance: 0,
        conveyanceAllowance: 0,
        medicalAllowance: 0,
        siteSpecificAllowance: 0,
        otherAllowance,
        grandTotal: roundHalfUp2(hra + earnedOtherCash + otherAllowance),
      };
      return row;
    })
    .filter((row): row is AllowanceSlipRow => !!row);

  const selectedWorkOrder = workOrderId
    ? workOrders.find((wo) => wo.id === workOrderId) ?? null
    : null;

  const establishmentNameAddress = selectedWorkOrder?.workOrderNumber ?? "";
  const workNameLocation = selectedWorkOrder?.jobDesc ?? "";
  const principalEmployerNameAddress = selectedWorkOrder?.orderDesc ?? "";

  return {
    month,
    year,
    contractorNameAddress: `${CONTRACTOR_NAME} ${CONTRACTOR_ADDRESS}`.trim(),
    establishmentNameAddress,
    workNameLocation,
    principalEmployerNameAddress,
    rows,
  };
}
