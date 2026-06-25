import { Workbook } from "exceljs";
import type { PFReportRow } from "@/lib/generatePFReport";
import {
  applyTableBorders,
  downloadExcel,
  HEADER_STYLE,
  reportFileName,
  RIGHT_CELL_STYLE,
} from "@/lib/excelUtils";

interface GeneratePFReportExcelParams {
  rows: PFReportRow[];
  year: number;
  month: number;
  departmentName?: string;
}

export async function generatePFReportExcel({
  rows,
  year,
  month,
  departmentName,
}: GeneratePFReportExcelParams): Promise<void> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("PFReport");

  const headers = [
    "UAN",
    "Employee Name",
    "EPF Wages (Gross)",
    "EPF Wages",
    "EPS Wages",
    "EDLI Wages",
    "PF Amount",
    "EPF Amount",
    "PPF Amount",
    "NCP Days",
    "Last Column",
  ];

  sheet.mergeCells(1, 1, 1, headers.length);
  sheet.getCell(1, 1).value = `PF REPORT - ${String(month).padStart(2, "0")}/${year}${departmentName ? ` - ${departmentName}` : ""}`;
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
      row.uan,
      row.employeeName,
      row.epfWagesGross,
      row.epfWages,
      row.epsWages,
      row.edliWages,
      row.pf,
      row.epfAmount,
      row.ppfAmount,
      row.ncpDays,
      row.lastColumn,
    ]);
  });

  const widths = [18, 28, 16, 14, 14, 14, 12, 12, 12, 10, 10];
  widths.forEach((width, i) => {
    sheet.getColumn(i + 1).width = width;
  });

  const startRow = 2;
  const endRow = Math.max(startRow + 1, 2 + rows.length);
  applyTableBorders(sheet, startRow, endRow, 1, headers.length);
  for (let r = 3; r <= endRow; r += 1) {
    for (let c = 3; c <= headers.length; c += 1) {
      sheet.getCell(r, c).style = { ...sheet.getCell(r, c).style, ...RIGHT_CELL_STYLE };
    }
  }

  await downloadExcel(workbook, reportFileName("PFReport", month, year));
}
