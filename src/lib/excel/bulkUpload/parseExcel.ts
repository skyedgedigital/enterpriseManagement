import * as XLSX from "xlsx";

import { normalizeRow } from "./utils";

/** Primary data tab in bulk upload workbooks (see generateTemplate.ts). */
export const BULK_UPLOAD_DATA_SHEET = "Data";

export function resolveBulkUploadSheetName(sheetNames: string[]): string | undefined {
  if (sheetNames.length === 0) return undefined;
  const dataSheet = sheetNames.find(
    (name) => name.trim().toLowerCase() === BULK_UPLOAD_DATA_SHEET.toLowerCase(),
  );
  if (dataSheet) return dataSheet;
  const nonInstructions = sheetNames.find(
    (name) => name.trim().toLowerCase() !== "instructions",
  );
  return nonInstructions ?? sheetNames[0];
}

/** Drop trailing blank rows that Excel often includes. */
export function filterNonEmptyRows(
  rows: Record<string, string>[],
): Record<string, string>[] {
  return rows.filter((row) => Object.values(row).some((v) => v.trim() !== ""));
}

export async function parseExcelFile(file: File): Promise<Record<string, string>[]> {
  const workbook = await parseExcelWorkbook(file);
  const sheetName = resolveBulkUploadSheetName(workbook.SheetNames);
  if (!sheetName) return [];
  const rows = workbook.sheets[sheetName] ?? [];
  return filterNonEmptyRows(rows);
}

export interface ParsedExcelWorkbook {
  SheetNames: string[];
  sheets: Record<string, Record<string, string>[]>;
}

export async function parseExcelWorkbook(file: File): Promise<ParsedExcelWorkbook> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheets: Record<string, Record<string, string>[]> = {};

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });
    sheets[sheetName] = rows.map(normalizeRow);
  }

  return { SheetNames: wb.SheetNames, sheets };
}
