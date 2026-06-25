import { createElement } from "react";
import type { Attendance, Designation, Employee, Wages, WorkOrder } from "@/types";
import { openPDFInNewTab } from "./pdfUtils";
import { WagesSlipBundlePDF } from "@/components/pdf/WagesSlipBundlePDF";
import { buildWagesPaySlipData } from "./generateWagesPaySlip";
import type { WagesPaySlipData } from "@/components/pdf/WagesPaySlipPDF";

export interface GenerateWagesRegisterParams {
  employees: Employee[];
  wages: Wages[];
  attendances: Attendance[];
  workOrders: WorkOrder[];
  designations: Designation[];
  month: number;
  year: number;
}

export function buildWagesRegisterData({
  employees,
  wages,
  attendances,
  workOrders,
  designations,
  month,
  year,
}: GenerateWagesRegisterParams): WagesPaySlipData[] {
  const wagesForPeriod = wages.filter((w) => w.year === year && w.month === month);
  const slips: WagesPaySlipData[] = [];

  for (const w of wagesForPeriod) {
    const emp = employees.find((e) => e.id === w.employee);
    if (!emp) continue;

    const attendance =
      attendances.find(
        (a) => a.employee === emp.id && a.year === year && a.month === month,
      ) ?? null;
    const workOrder = w.workOrderHr
      ? workOrders.find((wo) => wo.id === w.workOrderHr) ?? null
      : null;

    slips.push(
      buildWagesPaySlipData({
        employee: emp,
        wages: w,
        attendance,
        workOrder,
        designations,
        month,
        year,
        newPfApplicable: workOrder?.newPfApplicable ?? false,
      }),
    );
  }

  slips.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  return slips;
}

export async function generateWagesRegister(params: GenerateWagesRegisterParams): Promise<void> {
  const slips = buildWagesRegisterData(params);
  await openPDFInNewTab(
    createElement(WagesSlipBundlePDF, {
      slips,
    }),
  );
}
