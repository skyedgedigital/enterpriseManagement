import { pdf } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { MONTHS } from "./constants";
import { formatMoney2 } from "./moneyRounding";
import type { AttendanceStatus } from "@/types";

/** Type that @react-pdf/renderer pdf() expects (Document element). */
type PDFDocumentElement = Parameters<typeof pdf>[0];

/**
 * Render any @react-pdf/renderer <Document> to a blob and open it
 * in a new browser tab. The browser's built-in PDF viewer provides
 * print and download controls.
 */
export async function openPDFInNewTab(document: ReactElement): Promise<void> {
  const blob = await pdf(document as PDFDocumentElement).toBlob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

/** Format a number to 2 decimal places (e.g. 1866.97). Uses shared half-up rounding. */
export function formatINR(amount: number | undefined | null): string {
  return formatMoney2(Number(amount ?? 0));
}

/** Returns "FEBRUARY  2025" style string. */
export function formatMonthYear(month: number, year: number): string {
  const m = MONTHS.find((entry) => entry.value === month);
  return `${(m?.label ?? "").toUpperCase()}  ${year}`;
}

const STATUS_CODE_MAP: Record<AttendanceStatus, string> = {
  Present: "P",
  Absent: "A",
  "Half Day": "HD",
  NH: "NH",
  "Not Paid": "O",
  "Earned Leave": "EL",
  "Casual Leave": "CL",
  "Festival Leave": "FL",
};

/** Map a full AttendanceStatus to its short PDF code (P, A, HD, O, NH, EL, CL, FL). */
export function attendanceStatusToCode(status: AttendanceStatus): string {
  return STATUS_CODE_MAP[status] ?? "";
}

const REMARK_KEYS = ["P", "A", "O", "EL", "CL", "FL", "HD", "NH"] as const;

/** Build a summary string like "P: 8, A: 16, O: 4, EL: 0, CL: 0, FL: 0, HD: 0, NH: 0". */
export function buildAttendanceRemarks(dayCodes: string[]): string {
  const counts: Record<string, number> = {};
  for (const k of REMARK_KEYS) counts[k] = 0;
  for (const code of dayCodes) {
    if (code && code in counts) counts[code]++;
  }
  return REMARK_KEYS.map((k) => `${k}: ${counts[k]}`).join(", ");
}

/** Number of calendar days in a given month (1-indexed month). */
export function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}
