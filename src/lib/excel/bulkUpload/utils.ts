import { format, parse, isValid } from "date-fns";

import { ATTENDANCE_STATUSES } from "@/lib/constants";
import type { AttendanceStatus, Employee, WorkOrder } from "@/types";

import type { BulkUploadColumn } from "./types";

export function cellToString(value: unknown): string {
  if (value == null || value === "") return "";
  if (value instanceof Date) return format(value, "yyyy-MM-dd");
  return String(value).trim();
}

export function normalizeRow(row: Record<string, unknown>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, val] of Object.entries(row)) {
    normalized[key.trim()] = cellToString(val);
  }
  return normalized;
}

export function parseBool(value: string): boolean | undefined {
  const v = value.trim().toLowerCase();
  if (!v) return undefined;
  if (["yes", "y", "true", "1"].includes(v)) return true;
  if (["no", "n", "false", "0"].includes(v)) return false;
  return undefined;
}

export function parseRequiredBool(value: string, field: string): { value?: boolean; error?: string } {
  if (!value.trim()) return { value: undefined };
  const parsed = parseBool(value);
  if (parsed === undefined) {
    return { error: `${field} must be Yes or No` };
  }
  return { value: parsed };
}

export function isRowEmpty(row: Record<string, string>, columns: { header: string }[]): boolean {
  return columns.every((col) => !row[col.header]?.trim());
}

export function findByName<T extends { id: string }>(
  items: T[],
  name: string,
  getName: (item: T) => string,
): T | undefined {
  const target = name.trim().toLowerCase();
  if (!target) return undefined;
  return items.find((item) => getName(item).trim().toLowerCase() === target);
}

export function parseOptionalDate(value: string): Date | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = parse(trimmed, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : undefined;
}

export function parseRequiredDate(
  value: string,
  field: string,
): { value?: Date; error?: string } {
  if (!value.trim()) return { error: `${field} is required` };
  const parsed = parseOptionalDate(value);
  if (!parsed) return { error: `${field} must be YYYY-MM-DD` };
  return { value: parsed };
}

export function parsePositiveNumber(
  value: string,
  field: string,
): { value?: number; error?: string } {
  const trimmed = value.trim();
  if (!trimmed) return { error: `${field} is required` };
  const n = Number(trimmed);
  if (Number.isNaN(n) || n <= 0) {
    return { error: `${field} must be greater than 0` };
  }
  return { value: n };
}

export function parseFuelType(value: string): "petrol" | "diesel" | undefined {
  const v = value.trim().toLowerCase();
  if (v === "petrol" || v === "diesel") return v;
  return undefined;
}

export function findVehicleByNumber<T extends { id: string; vehicleNumber: string }>(
  vehicles: T[],
  vehicleNumber: string,
): T | undefined {
  const target = vehicleNumber.trim().toLowerCase();
  if (!target) return undefined;
  return vehicles.find((v) => v.vehicleNumber.trim().toLowerCase() === target);
}

export function findEmployeeByCode(
  employees: Employee[],
  code: string,
): Employee | undefined {
  const target = code.trim().toLowerCase();
  if (!target) return undefined;
  return employees.find((e) => e.code.trim().toLowerCase() === target);
}

export function findWorkOrderByNumber(
  workOrders: WorkOrder[],
  number: string,
): WorkOrder | undefined {
  const target = number.trim().toLowerCase();
  if (!target) return undefined;
  return workOrders.find(
    (wo) => wo.workOrderNumber.trim().toLowerCase() === target,
  );
}

const ATTENDANCE_STATUS_ALIASES: Record<string, AttendanceStatus> = {
  present: "Present",
  p: "Present",
  absent: "Absent",
  a: "Absent",
  "half day": "Half Day",
  hd: "Half Day",
  nh: "NH",
  "not paid": "Not Paid",
  np: "Not Paid",
  "earned leave": "Earned Leave",
  el: "Earned Leave",
  "casual leave": "Casual Leave",
  cl: "Casual Leave",
  "festival leave": "Festival Leave",
  fl: "Festival Leave",
};

export function parseAttendanceStatus(raw: string): AttendanceStatus | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const lower = trimmed.toLowerCase();
  if (ATTENDANCE_STATUS_ALIASES[lower]) return ATTENDANCE_STATUS_ALIASES[lower];
  return ATTENDANCE_STATUSES.find((s) => s.toLowerCase() === lower);
}

export function buildDayColumns(): BulkUploadColumn[] {
  return Array.from({ length: 31 }, (_, i) => ({
    header: `Day ${i + 1}`,
    required: false,
    example: i === 0 ? "Present" : "",
    hint: "Present, Absent, Half Day, NH, Not Paid, Earned Leave, Casual Leave, Festival Leave",
  }));
}

export function parseOptionalNumber(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

export function parseRequiredNumber(
  raw: string,
  field: string,
): { value?: number; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { error: `${field} is required` };
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return { error: `${field} must be a number` };
  return { value: n };
}

export function parseMonth(raw: string): { value?: number; error?: string } {
  const parsed = parseRequiredNumber(raw, "Month");
  if (parsed.error) return parsed;
  if (parsed.value! < 1 || parsed.value! > 12) {
    return { error: "Month must be between 1 and 12" };
  }
  return parsed;
}

export function parseYear(raw: string): { value?: number; error?: string } {
  const parsed = parseRequiredNumber(raw, "Year");
  if (parsed.error) return parsed;
  if (parsed.value! < 1900 || parsed.value! > 2100) {
    return { error: "Year must be a 4-digit year" };
  }
  return parsed;
}
