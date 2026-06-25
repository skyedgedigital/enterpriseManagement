import { Workbook } from "exceljs";
import type { ArrearData } from "@/lib/generateArrear";
import {
  applyTableBorders,
  downloadExcel,
  HEADER_STYLE,
  RIGHT_CELL_STYLE,
} from "@/lib/excelUtils";

export async function generateArrearExcel(data: ArrearData): Promise<void> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("Arrear");

  const TOTAL_COLS = 19;

  const fromLabel = `${data.fromYear}-${String(data.fromMonth).padStart(2, "0")}`;
  const toLabel = `${data.toYear}-${String(data.toMonth).padStart(2, "0")}`;

  /* ── Row 1: Title ── */
  sheet.mergeCells(1, 1, 1, TOTAL_COLS);
  sheet.getCell(1, 1).value = `FORM XVII - REGISTER OF WAGES (Arrear ${fromLabel} to ${toLabel})`;
  sheet.getCell(1, 1).style = {
    ...HEADER_STYLE,
    font: { ...(HEADER_STYLE.font ?? {}), size: 14 },
  };

  /* ── Row 2: Establishment / Work Location ── */
  sheet.mergeCells(2, 1, 2, 10);
  sheet.getCell(2, 1).value = `Establishment: ${data.establishmentNameAddress || "-"}`;
  sheet.mergeCells(2, 11, 2, TOTAL_COLS);
  sheet.getCell(2, 11).value = `Work Location: ${data.workNameLocation || "-"}`;

  /* ── Row 3: Principal Employer ── */
  sheet.mergeCells(3, 1, 3, TOTAL_COLS);
  sheet.getCell(3, 1).value = `Principal Employer: ${data.principalEmployerNameAddress || "-"}`;

  /* ── Row 4: Group header row ── */
  const individualCols: [number, string][] = [
    [1, "Sl. No."],
    [2, "Name of Workman"],
    [3, "Serial No. in Register of Workman"],
    [4, "Designation/ nature of Work done"],
    [5, "No. of days worked"],
    [6, "Units of work done"],
    [7, "Daily rate of wages/ Piece rate"],
  ];
  for (const [col, label] of individualCols) {
    sheet.mergeCells(4, col, 5, col);
    sheet.getCell(4, col).value = label;
    sheet.getCell(4, col).style = HEADER_STYLE;
  }

  sheet.mergeCells(4, 8, 4, 12);
  sheet.getCell(4, 8).value = "AMOUNT OF WAGES EARNED";
  sheet.getCell(4, 8).style = HEADER_STYLE;

  sheet.mergeCells(4, 13, 4, 15);
  sheet.getCell(4, 13).value = "Deduction if any (indicate nature)";
  sheet.getCell(4, 13).style = HEADER_STYLE;

  const individualColsRight: [number, string][] = [
    [16, "Amount Paid"],
    [17, "Signature/Thumb impression of workman"],
    [18, "Initial of contractor or his representative"],
    [19, "Signature of contractor or his representative"],
  ];
  for (const [col, label] of individualColsRight) {
    sheet.mergeCells(4, col, 5, col);
    sheet.getCell(4, col).value = label;
    sheet.getCell(4, col).style = HEADER_STYLE;
  }

  /* ── Row 5: Sub-column headers under groups ── */
  const wageSubHeaders: [number, string][] = [
    [8, "Basic Wages"],
    [9, "Dearness Allowance"],
    [10, "Overtime"],
    [11, "Other Cash payment"],
    [12, "Total"],
  ];
  for (const [col, label] of wageSubHeaders) {
    sheet.getCell(5, col).value = label;
    sheet.getCell(5, col).style = HEADER_STYLE;
  }

  const deductionSubHeaders: [number, string][] = [
    [13, "E.S.I"],
    [14, "P.F"],
    [15, "Others"],
  ];
  for (const [col, label] of deductionSubHeaders) {
    sheet.getCell(5, col).value = label;
    sheet.getCell(5, col).style = HEADER_STYLE;
  }

  /* ── Row 6: Column numbers 1–17 ── */
  const numRow = 6;
  for (let i = 1; i <= 12; i++) {
    sheet.getCell(numRow, i).value = i;
    sheet.getCell(numRow, i).style = HEADER_STYLE;
  }
  sheet.mergeCells(numRow, 13, numRow, 15);
  sheet.getCell(numRow, 13).value = 13;
  sheet.getCell(numRow, 13).style = HEADER_STYLE;
  for (let logical = 14; logical <= 17; logical++) {
    const physCol = logical + 2;
    sheet.getCell(numRow, physCol).value = logical;
    sheet.getCell(numRow, physCol).style = HEADER_STYLE;
  }

  /* ── Data rows (starting row 7) ── */
  data.rows.forEach((row, index) => {
    sheet.addRow([
      index + 1,
      row.employeeName,
      row.workmanNo || "-",
      row.designation || "-",
      row.daysWorked,
      "-",
      `${Math.round(row.basicRate)}+${Math.round(row.daRate)}`,
      row.basicAmount,
      row.daAmount,
      0,
      row.otherCash,
      row.grossWages,
      row.esi,
      row.pf,
      row.otherDeduction,
      row.netAmountPaid,
      "",
      "",
      "",
    ]);
  });

  /* ── Column widths ── */
  const widths = [
    6, 22, 12, 16, 8, 8, 12,
    10, 12, 8, 14, 10,
    8, 8, 8,
    12, 16, 14, 14,
  ];
  widths.forEach((width, i) => {
    sheet.getColumn(i + 1).width = width;
  });

  /* ── Borders ── */
  const dataStartRow = 7;
  const dataEndRow = Math.max(dataStartRow, 6 + data.rows.length);
  applyTableBorders(sheet, 4, dataEndRow, 1, TOTAL_COLS);

  /* ── Right-align numeric data cells ── */
  const rightAlignCols = [1, 5, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  for (let r = dataStartRow; r <= dataEndRow; r += 1) {
    rightAlignCols.forEach((col) => {
      sheet.getCell(r, col).style = {
        ...sheet.getCell(r, col).style,
        ...RIGHT_CELL_STYLE,
      };
    });
  }

  await downloadExcel(workbook, `Arrear_${fromLabel}_to_${toLabel}.xlsx`);
}
