import { Workbook } from "exceljs";

import { HEADER_STYLE, CELL_STYLE, downloadExcel } from "@/lib/excelUtils";
import type { BulkUploadColumn, BulkUploadSheetSpec } from "./types";

function addDataSheet(
  workbook: Workbook,
  sheetName: string,
  columns: BulkUploadColumn[],
): void {
  const dataSheet = workbook.addWorksheet(sheetName);
  dataSheet.addRow(columns.map((col) => col.header));
  dataSheet.addRow(columns.map((col) => col.example));

  dataSheet.getRow(1).eachCell((cell) => {
    Object.assign(cell, HEADER_STYLE);
  });
  dataSheet.getRow(2).eachCell((cell) => {
    Object.assign(cell, CELL_STYLE);
  });

  dataSheet.columns.forEach((column, index) => {
    const header = columns[index]?.header ?? "";
    const example = columns[index]?.example ?? "";
    column.width = Math.min(40, Math.max(14, header.length, example.length) + 2);
  });
}

function addInstructionsSheet(
  workbook: Workbook,
  entityName: string,
  columns: BulkUploadColumn[],
  additionalSheets: BulkUploadSheetSpec[],
): void {
  const instructionsSheet = workbook.addWorksheet("Instructions");
  instructionsSheet.addRow([`${entityName} — Bulk Upload Instructions`]);
  instructionsSheet.getRow(1).font = { bold: true, size: 14 };
  instructionsSheet.addRow([]);

  if (additionalSheets.length > 0) {
    instructionsSheet.addRow(["IMPORTANT — Array / nested fields"]);
    instructionsSheet.getRow(instructionsSheet.rowCount).font = { bold: true };
    instructionsSheet.addRow([
      "The Data sheet only has flat (single-value) columns.",
    ]);
    instructionsSheet.addRow([
      "Array fields are on separate tabs below — one row per array item, linked by Employee Code.",
    ]);
    instructionsSheet.addRow([]);
    instructionsSheet.addRow(["Firebase field", "Excel sheet", "How to fill"]);
    instructionsSheet.getRow(instructionsSheet.rowCount).eachCell((cell) => {
      Object.assign(cell, HEADER_STYLE);
    });
    additionalSheets.forEach((spec) => {
      instructionsSheet.addRow([
        spec.firebaseField ?? spec.sheetName,
        spec.sheetName,
        "One row per item; repeat Employee Code for multiple entries",
      ]);
    });
    instructionsSheet.addRow([]);
  }

  instructionsSheet.addRow(["Sheets in this workbook (tabs at the bottom):"]);
  instructionsSheet.getRow(instructionsSheet.rowCount).font = { bold: true };
  instructionsSheet.addRow(["Instructions", "This guide"]);
  instructionsSheet.addRow(["Data", "Primary flat fields (one employee per row)"]);
  additionalSheets.forEach((spec) => {
    instructionsSheet.addRow([
      spec.sheetName,
      spec.firebaseField
        ? `Array: ${spec.firebaseField}`
        : spec.optional
          ? "Optional supplementary data"
          : "Supplementary data",
    ]);
  });
  instructionsSheet.addRow([]);
  instructionsSheet.addRow(["Data sheet columns"]);
  instructionsSheet.addRow(["Column", "Required", "Example", "Notes"]);
  instructionsSheet.getRow(instructionsSheet.rowCount).eachCell((cell) => {
    Object.assign(cell, HEADER_STYLE);
  });

  columns.forEach((col) => {
    instructionsSheet.addRow([
      col.header,
      col.required ? "Yes" : "No",
      col.example,
      col.hint ?? "",
    ]);
  });

  for (const spec of additionalSheets) {
    instructionsSheet.addRow([]);
    instructionsSheet.addRow([`${spec.sheetName} sheet columns`]);
    if (spec.firebaseField) {
      instructionsSheet.addRow([`Maps to: ${spec.firebaseField}`]);
    }
    instructionsSheet.addRow(["Column", "Required", "Example", "Notes"]);
    instructionsSheet.getRow(instructionsSheet.rowCount).eachCell((cell) => {
      Object.assign(cell, HEADER_STYLE);
    });
    spec.columns.forEach((col) => {
      instructionsSheet.addRow([
        col.header,
        col.required ? "Yes" : "No",
        col.example,
        col.hint ?? "",
      ]);
    });
  }

  instructionsSheet.addRow([]);
  instructionsSheet.addRow(["Tips:"]);
  instructionsSheet.addRow(["1. Do not change column headers or sheet names."]);
  instructionsSheet.addRow(["2. Fill one record per row starting from row 2 on each sheet."]);
  instructionsSheet.addRow(["3. Delete or replace the example row before uploading."]);
  instructionsSheet.addRow(["4. For Yes/No fields use: Yes or No."]);
  instructionsSheet.addRow(["5. For dates use format: YYYY-MM-DD (e.g. 2024-01-15)."]);
  if (additionalSheets.length > 0) {
    instructionsSheet.addRow([
      "6. Array sheets: same Employee Code can appear on multiple rows (e.g. bonus for 2022, 2023).",
    ]);
  }

  instructionsSheet.getColumn(1).width = 32;
  instructionsSheet.getColumn(2).width = 18;
  instructionsSheet.getColumn(3).width = 24;
  instructionsSheet.getColumn(4).width = 44;
}

export async function generateBulkUploadTemplate(
  entityName: string,
  fileName: string,
  columns: BulkUploadColumn[],
  additionalSheets: BulkUploadSheetSpec[] = [],
): Promise<void> {
  const workbook = new Workbook();

  // Instructions first so it opens by default in Excel / Office on the web
  addInstructionsSheet(workbook, entityName, columns, additionalSheets);
  addDataSheet(workbook, "Data", columns);
  for (const spec of additionalSheets) {
    addDataSheet(workbook, spec.sheetName, spec.columns);
  }

  await downloadExcel(workbook, fileName);
}
