import { Workbook } from "exceljs";
import type { FormXVIData } from "@/components/pdf/FormXVIPDF";
import {
  applyTableBorders,
  CENTER_CELL_STYLE,
  downloadExcel,
  HEADER_STYLE,
  reportFileName,
} from "@/lib/excelUtils";

export async function generateFormXVIExcel(data: FormXVIData): Promise<void> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("FormXVI");

  const lastCol = 37; // A..AK
  sheet.mergeCells(1, 1, 1, lastCol);
  sheet.getCell(1, 1).value = "FORM XVI - MUSTER ROLL";
  sheet.getCell(1, 1).style = {
    ...HEADER_STYLE,
    font: { ...(HEADER_STYLE.font ?? {}), size: 14 },
  };

  sheet.mergeCells(2, 1, 2, 18);
  sheet.getCell(2, 1).value = `Name and Location of Work: ${data.location}`;
  sheet.mergeCells(2, 19, 2, lastCol);
  sheet.getCell(2, 19).value = `Principal Employer: ${data.employer}`;

  sheet.mergeCells(3, 1, 3, lastCol);
  sheet.getCell(3, 1).value = `Month/Year: ${String(data.month).padStart(2, "0")}/${data.year}`;
  sheet.getCell(3, 1).style = CENTER_CELL_STYLE;

  const headers = [
    "Sl No",
    "Name",
    "Father Name",
    "Sex",
    ...Array.from({ length: 31 }, (_, i) => String(i + 1)),
    "Total Attendance",
    "Remarks",
  ];

  sheet.addRow(headers);
  const headerRow = sheet.getRow(4);
  headerRow.eachCell((cell) => {
    cell.style = HEADER_STYLE;
  });

  for (const row of data.rows) {
    sheet.addRow([
      row.serialNo,
      row.name,
      row.fatherName,
      row.sex,
      ...Array.from({ length: 31 }, (_, i) => row.days[i] ?? ""),
      row.totalAttendance,
      row.remarks,
    ]);
  }

  const colWidths: number[] = [
    8, 22, 20, 8,
    ...Array.from({ length: 31 }, () => 4),
    14, 32,
  ];
  colWidths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });

  const startDataRow = 5;
  const endDataRow = Math.max(startDataRow, 4 + data.rows.length);
  applyTableBorders(sheet, 4, endDataRow, 1, lastCol);
  for (let r = startDataRow; r <= endDataRow; r += 1) {
    for (let c = 1; c <= lastCol; c += 1) {
      const cell = sheet.getCell(r, c);
      if (c === 1 || c === 4 || (c >= 5 && c <= 35) || c === 36) {
        cell.style = { ...cell.style, ...CENTER_CELL_STYLE };
      }
    }
  }

  await downloadExcel(workbook, reportFileName("FormXVI", data.month, data.year));
}
