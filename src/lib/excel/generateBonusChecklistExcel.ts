import { Workbook } from "exceljs";
import type { BonusChecklistData } from "@/lib/buildBonusChecklistData";
import {
  computeBonusChecklistFooterTotals,
  financialYearMonthSequence,
} from "@/lib/buildBonusChecklistData";
import {
  applyTableBorders,
  downloadExcel,
  HEADER_STYLE,
  RIGHT_CELL_STYLE,
} from "@/lib/excelUtils";

function fmtDays(n: number): string {
  if (n === 0) return "0";
  return Number.isInteger(n) ? String(n) : String(n);
}

function fmtAmountGrouped(n: number): string {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function bonusExcelFileName(prefix: string, fyEndYear: number): string {
  const y0 = fyEndYear - 1;
  return `${prefix}_FY${y0}-${fyEndYear}.xlsx`;
}

function chunkBy<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

const FIXED_COLS = 3;
const TAIL_COLS = 4;
const MONTH_PAIR = 2;

/** Month–amount pairs in summary block (5 pairs × 2 cols = 10). Uses cols 1–10 below main table. */
const SUMMARY_COLS = 10;

export async function generateBonusChecklistExcel(
  data: BonusChecklistData,
  sheetTitle: string,
  filePrefix: string,
): Promise<void> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("BonusChecklist", {
    views: [{ state: "frozen", ySplit: 5 }],
  });

  const monthSeq =
    data.rows[0]?.months ?? financialYearMonthSequence(data.fyEndYear);
  const monthCount = monthSeq.length;
  const lastCol = FIXED_COLS + monthCount * MONTH_PAIR + TAIL_COLS;

  const leftEnd = Math.min(10, Math.max(6, lastCol - 14));
  const midEnd = Math.min(leftEnd + 12, lastCol - 5);
  const rightStart = midEnd + 1;

  const headerMetaStyle = {
    font: { size: 10, name: "Times New Roman" },
    alignment: { vertical: "middle" as const, wrapText: true },
  };

  sheet.mergeCells(1, 1, 1, leftEnd);
  sheet.getCell(1, 1).value = data.contractorName;
  sheet.getCell(1, 1).style = {
    ...headerMetaStyle,
    font: { size: 11, bold: true, name: "Times New Roman" },
    alignment: { horizontal: "left", vertical: "middle", wrapText: true },
  };

  sheet.mergeCells(1, leftEnd + 1, 1, midEnd);
  sheet.getCell(1, leftEnd + 1).value = sheetTitle;
  sheet.getCell(1, leftEnd + 1).style = {
    font: { size: 12, bold: true, name: "Times New Roman", underline: true },
    alignment: { horizontal: "center", vertical: "middle", wrapText: true },
  };

  sheet.mergeCells(1, rightStart, 1, lastCol);
  sheet.getCell(1, rightStart).value = "Page 1 of 1";
  sheet.getCell(1, rightStart).style = {
    ...headerMetaStyle,
    alignment: { horizontal: "right", vertical: "top", wrapText: true },
  };

  sheet.mergeCells(2, 1, 2, leftEnd);
  sheet.getCell(2, 1).value = data.contractorOfficeLine;
  sheet.getCell(2, 1).style = { ...headerMetaStyle, alignment: { horizontal: "left", vertical: "middle" } };

  sheet.mergeCells(2, leftEnd + 1, 2, midEnd);
  sheet.getCell(2, leftEnd + 1).value = `From Date    ${data.periodFromDisplay}`;
  sheet.getCell(2, leftEnd + 1).style = {
    ...headerMetaStyle,
    alignment: { horizontal: "center", vertical: "middle" },
  };

  const orderExcel = data.orderNumber.trim() === "" ? "" : data.orderNumber;
  sheet.mergeCells(2, rightStart, 2, lastCol);
  sheet.getCell(2, rightStart).value = `Order Number    ${orderExcel}`;
  sheet.getCell(2, rightStart).style = {
    ...headerMetaStyle,
    alignment: { horizontal: "right", vertical: "middle" },
  };

  sheet.mergeCells(3, 1, 3, leftEnd);
  sheet.getCell(3, 1).value = data.contractorCorrespondingLine;
  sheet.getCell(3, 1).style = { ...headerMetaStyle, alignment: { horizontal: "left", vertical: "middle" } };

  sheet.mergeCells(3, leftEnd + 1, 3, midEnd);
  sheet.getCell(3, leftEnd + 1).value = `To Date      ${data.periodToDisplay}`;
  sheet.getCell(3, leftEnd + 1).style = {
    ...headerMetaStyle,
    alignment: { horizontal: "center", vertical: "middle" },
  };

  sheet.mergeCells(3, rightStart, 3, lastCol);
  sheet.getCell(3, rightStart).value = `FY ${data.fyLabel}`;
  sheet.getCell(3, rightStart).style = {
    ...headerMetaStyle,
    alignment: { horizontal: "right", vertical: "middle" },
  };

  const headerRow = 4;
  const subHeaderRow = 5;
  for (let col = 1; col <= 3; col += 1) {
    sheet.mergeCells(headerRow, col, subHeaderRow, col);
  }
  sheet.getCell(headerRow, 1).value = "Sl.No";
  sheet.getCell(headerRow, 2).value = "W.No.";
  sheet.getCell(headerRow, 3).value = "Employee Name";

  let c = FIXED_COLS + 1;
  for (let mi = 0; mi < monthCount; mi += 1) {
    const label = monthSeq[mi]?.label ?? `M${mi + 1}`;
    sheet.mergeCells(headerRow, c, headerRow, c + 1);
    sheet.getCell(headerRow, c).value = label;
    sheet.getCell(subHeaderRow, c).value = "Days";
    sheet.getCell(subHeaderRow, c + 1).value = "Amount";
    c += 2;
  }

  sheet.mergeCells(headerRow, c, subHeaderRow, c);
  sheet.getCell(headerRow, c).value = "Arrear";
  c += 1;
  sheet.mergeCells(headerRow, c, subHeaderRow, c);
  sheet.getCell(headerRow, c).value = "Total";
  c += 1;
  sheet.mergeCells(headerRow, c, subHeaderRow, c);
  sheet.getCell(headerRow, c).value = "PayRate";
  c += 1;
  sheet.mergeCells(headerRow, c, subHeaderRow, c);
  sheet.getCell(headerRow, c).value = "Days worked";

  for (let col = 1; col <= lastCol; col += 1) {
    sheet.getCell(headerRow, col).style = HEADER_STYLE;
    sheet.getCell(subHeaderRow, col).style = HEADER_STYLE;
  }

  let dataRow = subHeaderRow + 1;
  for (let i = 0; i < data.rows.length; i += 1) {
    const row = data.rows[i];
    const r = sheet.getRow(dataRow);
    r.getCell(1).value = i + 1;
    r.getCell(2).value = row.workManNo;
    r.getCell(3).value = row.employeeName;
    let col = FIXED_COLS + 1;
    for (const m of row.months) {
      r.getCell(col).value = fmtDays(m.days);
      r.getCell(col + 1).value = m.amount;
      col += 2;
    }
    r.getCell(col).value = row.arrear;
    r.getCell(col + 1).value = row.total;
    r.getCell(col + 2).value = row.payRate;
    r.getCell(col + 3).value = fmtDays(row.daysWorkedYear);
    dataRow += 1;
  }

  const totalsRow = dataRow;

  if (data.rows.length > 0) {
    const foot = computeBonusChecklistFooterTotals(data.rows);
    const tr = sheet.getRow(totalsRow);
    tr.getCell(1).value = "";
    tr.getCell(2).value = "";
    tr.getCell(3).value = "Total";
    let col = FIXED_COLS + 1;
    for (let mi = 0; mi < monthCount; mi += 1) {
      const t = foot.perMonth[mi] ?? { days: 0, amount: 0 };
      tr.getCell(col).value = fmtDays(t.days);
      tr.getCell(col + 1).value = "";
      col += 2;
    }
    tr.getCell(col).value = "";
    tr.getCell(col + 1).value = "";
    tr.getCell(col + 2).value = "";
    tr.getCell(col + 3).value = fmtDays(foot.sumDaysWorkedYear);
    for (let cc = 1; cc <= lastCol; cc += 1) {
      tr.getCell(cc).font = { ...(tr.getCell(cc).font ?? {}), bold: true };
    }

    sheet.getRow(totalsRow + 1).height = 8;

    const summaryStartRow = totalsRow + 2;
    let sr = summaryStartRow;

    const monthPairs = monthSeq.map((m, mi) => ({
      label: m.label,
      amount: foot.perMonth[mi]?.amount ?? 0,
    }));

    for (const group of chunkBy(monthPairs, 5)) {
      const sumR = sheet.getRow(sr);
      let sc = 1;
      for (const p of group) {
        sumR.getCell(sc).value = p.label;
        sumR.getCell(sc).font = { size: 10 };
        sumR.getCell(sc + 1).value = fmtAmountGrouped(p.amount);
        sumR.getCell(sc + 1).font = { size: 10, bold: true };
        sumR.getCell(sc + 1).alignment = { horizontal: "right", vertical: "middle" };
        sc += 2;
      }
      sr += 1;
    }

    const grandR = sheet.getRow(sr);
    grandR.getCell(1).value = "Arrear";
    grandR.getCell(1).font = { size: 10, bold: true };
    grandR.getCell(2).value = fmtAmountGrouped(foot.sumArrear);
    grandR.getCell(2).font = { size: 10, bold: true };
    grandR.getCell(2).alignment = { horizontal: "right", vertical: "middle" };
    grandR.getCell(3).value = "Total";
    grandR.getCell(3).font = { size: 10, bold: true };
    grandR.getCell(4).value = fmtAmountGrouped(foot.sumPaidExcludingArrear);
    grandR.getCell(4).font = { size: 10, bold: true };
    grandR.getCell(4).alignment = { horizontal: "right", vertical: "middle" };

    const summaryEndRow = sr;
    for (let rr = summaryStartRow; rr <= summaryEndRow; rr += 1) {
      for (let cc = 1; cc <= SUMMARY_COLS; cc += 1) {
        const cell = sheet.getCell(rr, cc);
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      }
    }
  }

  const dataEndRow = data.rows.length > 0 ? totalsRow : subHeaderRow;
  applyTableBorders(sheet, headerRow, dataEndRow, 1, lastCol);

  for (let r = headerRow; r <= dataEndRow; r += 1) {
    for (let col = FIXED_COLS + 1; col <= lastCol; col += 1) {
      const cell = sheet.getCell(r, col);
      cell.style = { ...cell.style, ...RIGHT_CELL_STYLE };
    }
  }

  if (data.rows.length > 0) {
    for (let r = subHeaderRow + 1; r <= totalsRow - 1; r += 1) {
      for (let col = FIXED_COLS + 1; col <= FIXED_COLS + monthCount * MONTH_PAIR; col += 1) {
        const cell = sheet.getCell(r, col);
        if (col % 2 === 0) {
          cell.numFmt = "#,##0.00";
        }
      }
    }
  }

  sheet.getColumn(1).width = 5;
  sheet.getColumn(2).width = 8;
  sheet.getColumn(3).width = 22;
  for (let i = 0; i < monthCount * 2; i += 1) {
    sheet.getColumn(FIXED_COLS + 1 + i).width = i % 2 === 0 ? 6 : 10;
  }
  sheet.getColumn(lastCol - 3).width = 10;
  sheet.getColumn(lastCol - 2).width = 10;
  sheet.getColumn(lastCol - 1).width = 9;
  sheet.getColumn(lastCol).width = 10;

  await downloadExcel(workbook, bonusExcelFileName(filePrefix, data.fyEndYear));
}
