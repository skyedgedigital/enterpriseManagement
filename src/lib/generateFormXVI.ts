import { createElement } from "react";
import type { Employee, Attendance } from "@/types";
import {
  openPDFInNewTab,
  attendanceStatusToCode,
  buildAttendanceRemarks,
  daysInMonth,
} from "./pdfUtils";
import { getAttendanceSliceForWorkOrder } from "./attendanceSlice";
import { FormXVIPDF } from "@/components/pdf/FormXVIPDF";
import type { FormXVIRow, FormXVIData } from "@/components/pdf/FormXVIPDF";

export interface GenerateFormXVIParams {
  employees: Employee[];
  attendances: Attendance[];
  workOrderId: string;
  location: string;
  employer: string;
  month: number;
  year: number;
}

export function buildFormXVIData({
  employees,
  attendances,
  workOrderId,
  location,
  employer,
  month,
  year,
}: GenerateFormXVIParams): FormXVIData {
  const period = `${String(month).padStart(2, "0")}-${year}`;
  const totalDays = daysInMonth(month, year);

  const filtered = employees.filter((emp) => {
    const woList = emp.workOrderHr ?? [];
    return woList.some(
      (wo) => wo.workOrderHr === workOrderId && wo.period === period,
    );
  });

  const rows: FormXVIRow[] = filtered.map((emp, idx) => {
    const att =
      attendances.find(
        (a) => a.employee === emp.id && a.year === year && a.month === month,
      ) ?? null;

    // Only render the days attributed to this work order; other WOs' days appear blank so
    // each Form XVI reflects attendance under one contract/work order only.
    const slice = getAttendanceSliceForWorkOrder(att, workOrderId);
    const dayMap = new Map(slice.days.map((d) => [d.day, d.status]));

    const dayCodes: string[] = Array.from({ length: 31 }, (_, i) => {
      const dayNum = i + 1;
      if (dayNum > totalDays) return "";
      const status = dayMap.get(dayNum);
      return status ? attendanceStatusToCode(status) : "";
    });

    const totalAttendance = slice.presentDays;

    return {
      serialNo: idx + 1,
      name: emp.name ?? emp.code,
      fatherName: emp.fathersName ?? "",
      sex: emp.sex === "Male" ? "M" : emp.sex === "Female" ? "F" : emp.sex === "Other" ? "O" : "",
      days: dayCodes,
      totalAttendance,
      remarks: buildAttendanceRemarks(dayCodes),
    };
  });

  const data: FormXVIData = {
    location,
    employer,
    month,
    year,
    rows,
  };

  return data;
}

export async function generateFormXVI(params: GenerateFormXVIParams): Promise<void> {
  const data = buildFormXVIData(params);
  await openPDFInNewTab(createElement(FormXVIPDF, { data }));
}
