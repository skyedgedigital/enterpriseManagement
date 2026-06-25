import { createElement } from "react";
import type { Attendance, Designation, Employee, Wages, WorkOrder } from "@/types";
import { openPDFInNewTab } from "./pdfUtils";
import { ArrearPDF, type ArrearRow } from "@/components/pdf/ArrearPDF";
import { computePayment } from "./paymentCalculation";

export interface GenerateArrearParams {
  employees: Employee[];
  wages: Wages[];
  attendances: Attendance[];
  workOrders: WorkOrder[];
  designations: Designation[];
  workOrderId: string;
  fromMonth: number;
  fromYear: number;
  toMonth: number;
  toYear: number;
  location: string;
  employer: string;
}

export interface ArrearData {
  rows: ArrearRow[];
  establishmentNameAddress: string;
  workNameLocation: string;
  principalEmployerNameAddress: string;
  fromMonth: number;
  fromYear: number;
  toMonth: number;
  toYear: number;
}

/** A per-employee aggregate of the arrear delta across the selected month range. */
export interface ArrearAccumEntry {
  employee: Employee;
  desig: Designation;
  totalDays: number;
  basicDiffAmount: number;
  daDiffAmount: number;
  basicDiffRate: number;
  daDiffRate: number;
  newPfApplicable: boolean;
}

/**
 * Optional per-row filter applied to each attendance / wages row before it
 * contributes to the accumulator. Used by the ESIC report to layer a state
 * filter on top of the work-order filter.
 */
export type ArrearRowFilter = (
  row: { workOrderHr?: string },
  workOrders: WorkOrder[],
) => boolean;

export interface BuildArrearAccumulatorOptions {
  rowFilter?: ArrearRowFilter;
}

function getDesignation(employee: Employee, designations: Designation[]): Designation | null {
  return employee.designation
    ? designations.find((d) => d.id === employee.designation) ?? null
    : null;
}

function getDesignationName(employee: Employee, designations: Designation[]): string {
  return getDesignation(employee, designations)?.designation?.trim() || "-";
}

function parseRate(value: string | undefined): number {
  return Number(value) || 0;
}

/**
 * Iterates each (year, month) pair from fromYear/fromMonth to toYear/toMonth inclusive.
 */
function* eachMonth(
  fromYear: number,
  fromMonth: number,
  toYear: number,
  toMonth: number,
): Generator<{ year: number; month: number }> {
  let y = fromYear;
  let m = fromMonth;
  while (y < toYear || (y === toYear && m <= toMonth)) {
    yield { year: y, month: m };
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
}

/**
 * Build a per-employee accumulator of arrear amounts across the selected month range.
 *
 * Shared by the Arrear register (`buildArrearData`) and the arrear PF / ESIC / Bank
 * statement builders. Attendance rows take priority over wages rows for the same
 * (employee, year, month) combination.
 */
export function buildArrearAccumulator(
  params: GenerateArrearParams,
  options: BuildArrearAccumulatorOptions = {},
): { entries: Map<string, ArrearAccumEntry>; workOrder: WorkOrder | null } {
  const {
    employees,
    wages,
    attendances,
    workOrders,
    designations,
    workOrderId,
    fromMonth,
    fromYear,
    toMonth,
    toYear,
  } = params;
  const { rowFilter } = options;

  const filterByWorkOrder = workOrderId !== "";
  const workOrder = filterByWorkOrder
    ? workOrders.find((wo) => wo.id === workOrderId) ?? null
    : null;
  const newPfApplicable = workOrder?.newPfApplicable ?? false;

  const entries = new Map<string, ArrearAccumEntry>();

  for (const period of eachMonth(fromYear, fromMonth, toYear, toMonth)) {
    const { year, month } = period;
    const seen = new Set<string>();

    const attForPeriod = attendances.filter(
      (a) =>
        a.year === year &&
        a.month === month &&
        (!filterByWorkOrder || a.workOrderHr === workOrderId) &&
        (!rowFilter || rowFilter({ workOrderHr: a.workOrderHr }, workOrders)),
    );

    for (const att of attForPeriod) {
      const employee = employees.find((e) => e.id === att.employee);
      if (!employee) continue;
      if (seen.has(employee.id)) continue;
      seen.add(employee.id);

      const desig = getDesignation(employee, designations);
      if (!desig) continue;

      const daysWorked = att.presentDays ?? 0;
      const basicDiffRate = parseRate(desig.basic) - parseRate(desig.oldBasic);
      const daDiffRate = parseRate(desig.da) - parseRate(desig.oldDa);

      const existing = entries.get(employee.id);
      if (existing) {
        existing.totalDays += daysWorked;
        existing.basicDiffAmount += basicDiffRate * daysWorked;
        existing.daDiffAmount += daDiffRate * daysWorked;
      } else {
        entries.set(employee.id, {
          employee,
          desig,
          totalDays: daysWorked,
          basicDiffAmount: basicDiffRate * daysWorked,
          daDiffAmount: daDiffRate * daysWorked,
          basicDiffRate,
          daDiffRate,
          newPfApplicable,
        });
      }
    }

    const wagesForPeriod = wages.filter(
      (w) =>
        w.year === year &&
        w.month === month &&
        (!filterByWorkOrder || w.workOrderHr === workOrderId) &&
        (!rowFilter || rowFilter({ workOrderHr: w.workOrderHr }, workOrders)),
    );

    for (const w of wagesForPeriod) {
      if (seen.has(w.employee)) continue;
      seen.add(w.employee);

      const employee = employees.find((e) => e.id === w.employee);
      if (!employee) continue;

      const desig = getDesignation(employee, designations);
      if (!desig) continue;

      const daysWorked = w.attendance ?? 0;
      const basicDiffRate = parseRate(desig.basic) - parseRate(desig.oldBasic);
      const daDiffRate = parseRate(desig.da) - parseRate(desig.oldDa);

      const existing = entries.get(employee.id);
      if (existing) {
        existing.totalDays += daysWorked;
        existing.basicDiffAmount += basicDiffRate * daysWorked;
        existing.daDiffAmount += daDiffRate * daysWorked;
      } else {
        entries.set(employee.id, {
          employee,
          desig,
          totalDays: daysWorked,
          basicDiffAmount: basicDiffRate * daysWorked,
          daDiffAmount: daDiffRate * daysWorked,
          basicDiffRate,
          daDiffRate,
          newPfApplicable,
        });
      }
    }
  }

  return { entries, workOrder };
}

export function buildArrearData(params: GenerateArrearParams): ArrearData {
  const {
    designations,
    fromMonth,
    fromYear,
    toMonth,
    toYear,
    location,
    employer,
  } = params;
  const { entries, workOrder } = buildArrearAccumulator(params);

  const rows: ArrearRow[] = [];

  for (const { employee, desig: _desig, totalDays, basicDiffAmount, daDiffAmount, basicDiffRate, daDiffRate, newPfApplicable } of entries.values()) {
    void _desig;
    const payment = computePayment(
      totalDays,
      basicDiffRate,
      daDiffRate,
      0,
      0,
      0,
      0,
      newPfApplicable,
    );

    rows.push({
      employeeName: employee.name?.trim() || "-",
      workmanNo: employee.workManNo ?? "",
      designation: getDesignationName(employee, designations),
      daysWorked: totalDays,
      basicRate: basicDiffRate,
      daRate: daDiffRate,
      basicAmount: Math.round(basicDiffAmount),
      daAmount: Math.round(daDiffAmount),
      otherCash: 0,
      grossWages: Math.round(payment.resultant2),
      pf: Math.round(payment.pf),
      esi: Math.round(payment.esi),
      otherDeduction: 0,
      netAmountPaid: Math.round(payment.netPayment),
    });
  }

  rows.sort((a, b) => a.employeeName.localeCompare(b.employeeName));

  return {
    rows,
    establishmentNameAddress: workOrder?.workOrderNumber ?? "",
    workNameLocation: location,
    principalEmployerNameAddress: employer,
    fromMonth,
    fromYear,
    toMonth,
    toYear,
  };
}

export async function generateArrearPDF(params: GenerateArrearParams): Promise<void> {
  const data = buildArrearData(params);
  await openPDFInNewTab(createElement(ArrearPDF, data));
}
