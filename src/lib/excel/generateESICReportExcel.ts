import { Workbook } from "exceljs";
import type { ESICReportRow } from "@/lib/generateESICReport";
import {
  applyTableBorders,
  downloadExcel,
  HEADER_STYLE,
  reportFileName,
  RIGHT_CELL_STYLE,
} from "@/lib/excelUtils";

interface GenerateESICReportExcelParams {
  rows: ESICReportRow[];
  year: number;
  month: number;
  stateName?: string;
}

export async function generateESICReportExcel({
  rows,
  year,
  month,
  stateName,
}: GenerateESICReportExcelParams): Promise<void> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("ESICReport");

  const headers = [
    "Sl No",
    "IP Number (10 Digits)",
    "IP Name",
    "Days Paid",
    "Total Monthly Wage",
  ];

  sheet.mergeCells(1, 1, 1, headers.length);
  sheet.getCell(1, 1).value = `ESIC REPORT - ${String(month).padStart(2, "0")}/${year}${stateName ? ` - ${stateName}` : ""}`;
  sheet.getCell(1, 1).style = {
    ...HEADER_STYLE,
    font: { ...(HEADER_STYLE.font ?? {}), size: 14 },
  };

  sheet.addRow(headers);
  sheet.getRow(2).eachCell((cell) => {
    cell.style = HEADER_STYLE;
  });

  rows.forEach((row) => {
    sheet.addRow([
      row.slNo,
      row.ipNumber,
      row.ipName,
      row.daysPaid,
      row.totalMonthlyWage,
    ]);
  });

  const widths = [10, 20, 34, 14, 20];
  widths.forEach((width, i) => {
    sheet.getColumn(i + 1).width = width;
  });

  const startRow = 2;
  const endRow = Math.max(startRow + 1, 2 + rows.length);
  applyTableBorders(sheet, startRow, endRow, 1, headers.length);
  for (let r = 3; r <= endRow; r += 1) {
    sheet.getCell(r, 1).style = { ...sheet.getCell(r, 1).style, ...RIGHT_CELL_STYLE };
    sheet.getCell(r, 4).style = { ...sheet.getCell(r, 4).style, ...RIGHT_CELL_STYLE };
    sheet.getCell(r, 5).style = { ...sheet.getCell(r, 5).style, ...RIGHT_CELL_STYLE };
  }

  await downloadExcel(workbook, reportFileName("ESICReport", month, year));
}
