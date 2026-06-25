import { Workbook } from "exceljs";
import type { LeaveRegisterChecklistData } from "@/lib/buildLeaveRegisterChecklistData";
import {
  calendarYearMonthSequence,
  computeLeaveRegisterFooterTotals,
} from "@/lib/buildLeaveRegisterChecklistData";
import {
  applyTableBorders,
  CELL_STYLE,
  CENTER_CELL_STYLE,
  downloadExcel,
  HEADER_STYLE,
  RIGHT_CELL_STYLE,
} from "@/lib/excelUtils";

function fileName(prefix: string, calendarYear: number): string {
  return `${prefix}_${calendarYear}.xlsx`;
}

const THIN = {
  top: { style: "thin" as const },
  left: { style: "thin" as const },
  bottom: { style: "thin" as const },
  right: { style: "thin" as const },
};

const headerBandStyle = {
  font: { size: 9, name: "Times New Roman" },
  alignment: { vertical: "middle" as const, wrapText: true },
  border: THIN,
};

const titleCenterStyle = {
  font: { size: 14, bold: true, name: "Times New Roman", underline: true },
  alignment: { horizontal: "center" as const, vertical: "middle" as const, wrapText: true },
  border: THIN,
};

export async function generateLeaveChecklistExcel(
  data: LeaveRegisterChecklistData,
  filePrefix: string,
): Promise<void> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("LeaveChecklist", {
    views: [{ state: "frozen", ySplit: 7 }],
  });

  const monthSeq = data.rows[0]?.months ?? calendarYearMonthSequence(data.calendarYear);
  const monthCount = monthSeq.length;
  const fixedCols = 4;
  const tailCols = 6;
  const lastCol = fixedCols + monthCount + tailCols;
  const leftEnd = 7;
  const midEnd = 15;
  const rightStart = 16;

  const orderLine =
    data.orderNumber.trim() === "" ? "" : `\nOrder / contract ref.: ${data.orderNumber.trim()}`;
  const contractorBlock = [
    "Name and Address of the Contractor",
    "In under which contract is carried on",
    data.contractorPartyText,
    "Name & Address of the Principal Employer",
    data.principalEmployerText,
    orderLine,
  ]
    .filter((line) => line !== "")
    .join("\n");

  sheet.mergeCells(1, 1, 1, leftEnd);
  sheet.getCell(1, 1).value = data.companyName;
  sheet.getCell(1, 1).style = {
    ...headerBandStyle,
    font: { size: 11, bold: true, name: "Times New Roman" },
    alignment: { horizontal: "left", vertical: "middle", wrapText: true },
  };

  sheet.mergeCells(1, leftEnd + 1, 1, midEnd);
  sheet.getCell(1, leftEnd + 1).value = "MUSTER ROLL";
  sheet.getCell(1, leftEnd + 1).style = titleCenterStyle;

  sheet.mergeCells(1, rightStart, 1, lastCol);
  sheet.getCell(1, rightStart).value = "Page 1 of 1";
  sheet.getCell(1, rightStart).style = {
    ...headerBandStyle,
    alignment: { horizontal: "right", vertical: "top", wrapText: true },
  };

  sheet.mergeCells(2, 1, 2, leftEnd);
  sheet.getCell(2, 1).value = data.officeLine;
  sheet.getCell(2, 1).style = { ...headerBandStyle, alignment: { horizontal: "left", vertical: "middle", wrapText: true } };

  sheet.mergeCells(2, leftEnd + 1, 2, midEnd);
  sheet.getCell(2, leftEnd + 1).value = `Leave Register from ${data.periodFromDisplay} To ${data.periodToDisplay}`;
  sheet.getCell(2, leftEnd + 1).style = {
    ...headerBandStyle,
    alignment: { horizontal: "center", vertical: "middle", wrapText: true },
  };

  sheet.mergeCells(2, rightStart, 3, lastCol);
  sheet.getCell(2, rightStart).value = contractorBlock;
  sheet.getCell(2, rightStart).style = {
    ...headerBandStyle,
    alignment: { horizontal: "right", vertical: "top", wrapText: true },
  };

  sheet.mergeCells(3, 1, 3, leftEnd);
  sheet.getCell(3, 1).value = data.correspondingLine;
  sheet.getCell(3, 1).style = { ...headerBandStyle, alignment: { horizontal: "left", vertical: "middle", wrapText: true } };

  sheet.mergeCells(3, leftEnd + 1, 3, midEnd);
  sheet.getCell(3, leftEnd + 1).value = "";
  sheet.getCell(3, leftEnd + 1).style = headerBandStyle;

  sheet.mergeCells(4, 1, 4, midEnd);
  sheet.getCell(4, 1).value = `Nature & Location of Work    ${data.natureLocationOfWork || ""}`;
  sheet.getCell(4, 1).style = { ...headerBandStyle, alignment: { horizontal: "left", vertical: "middle", wrapText: true } };

  sheet.mergeCells(4, rightStart, 4, lastCol);
  sheet.getCell(4, rightStart).value = "";
  sheet.getCell(4, rightStart).style = headerBandStyle;

  sheet.mergeCells(5, 1, 5, lastCol);
  sheet.getCell(5, 1).value = "";
  sheet.getCell(5, 1).style = { border: THIN };

  const headerRowIndex = 6;
  const subHeaderRow = 7;

  for (let col = 1; col <= fixedCols; col += 1) {
    sheet.mergeCells(headerRowIndex, col, subHeaderRow, col);
  }
  for (let mi = 0; mi < monthCount; mi += 1) {
    const col = fixedCols + 1 + mi;
    sheet.mergeCells(headerRowIndex, col, subHeaderRow, col);
  }
  sheet.mergeCells(headerRowIndex, fixedCols + monthCount + 1, subHeaderRow, fixedCols + monthCount + 1);

  const leaveGroupStart = fixedCols + monthCount + 2;
  sheet.mergeCells(headerRowIndex, leaveGroupStart, headerRowIndex, leaveGroupStart + 3);
  sheet.getCell(headerRowIndex, leaveGroupStart).value = "TOTAL LEAVE";
  sheet.getCell(headerRowIndex, leaveGroupStart).style = HEADER_STYLE;

  sheet.mergeCells(headerRowIndex, lastCol, subHeaderRow, lastCol);

  const h = sheet.getRow(headerRowIndex);
  h.getCell(1).value = "Sl.N";
  h.getCell(2).value = "Name of Worker";
  h.getCell(3).value = "Father's Name";
  h.getCell(4).value = "Sex";
  let c = fixedCols + 1;
  for (const m of monthSeq) {
    h.getCell(c++).value = m.label;
  }
  h.getCell(c++).value = "Total Attn.";
  h.getCell(lastCol).value = "Remarks";

  const sh = sheet.getRow(subHeaderRow);
  sh.getCell(leaveGroupStart).value = "EL";
  sh.getCell(leaveGroupStart + 1).value = "CL";
  sh.getCell(leaveGroupStart + 2).value = "FL";
  sh.getCell(leaveGroupStart + 3).value = "Total";

  for (let col = 1; col <= lastCol; col += 1) {
    const cell = sheet.getCell(headerRowIndex, col);
    if (col < leaveGroupStart || col === fixedCols + monthCount + 1 || col === lastCol) {
      cell.style = HEADER_STYLE;
    }
  }
  for (let col = leaveGroupStart; col <= leaveGroupStart + 3; col += 1) {
    sheet.getCell(subHeaderRow, col).style = HEADER_STYLE;
  }

  let rowIndex = subHeaderRow + 1;
  const footer = computeLeaveRegisterFooterTotals(data.rows);

  for (let i = 0; i < data.rows.length; i += 1) {
    const r = data.rows[i];
    const row = sheet.getRow(rowIndex);
    c = 1;
    row.getCell(c++).value = i + 1;
    row.getCell(c++).value = r.employeeName;
    row.getCell(c++).value = r.fathersName;
    row.getCell(c++).value = r.sex;
    for (const m of r.months) {
      row.getCell(c++).value = m.presentDays;
    }
    row.getCell(c++).value = r.totalPresent;
    row.getCell(c++).value = r.totalEL;
    row.getCell(c++).value = r.totalCL;
    row.getCell(c++).value = r.totalFL;
    row.getCell(c++).value = r.totalLeave;
    row.getCell(c++).value = r.remarks ?? "";

    for (let col = 1; col <= lastCol; col += 1) {
      const cell = sheet.getCell(rowIndex, col);
      if (col === 1) cell.style = CENTER_CELL_STYLE;
      else if (col <= fixedCols) cell.style = CELL_STYLE;
      else if (col === lastCol) cell.style = CELL_STYLE;
      else cell.style = RIGHT_CELL_STYLE;
    }
    rowIndex += 1;
  }

  if (data.rows.length > 0) {
    const tRow = sheet.getRow(rowIndex);
    c = 1;
    tRow.getCell(c++).value = "";
    tRow.getCell(c++).value = "Total";
    tRow.getCell(c++).value = "";
    tRow.getCell(c++).value = "";
    for (let mi = 0; mi < monthCount; mi += 1) {
      tRow.getCell(c++).value = footer.perMonthPresent[mi] ?? 0;
    }
    tRow.getCell(c++).value = footer.sumTotalPresent;
    tRow.getCell(c++).value = footer.sumEL;
    tRow.getCell(c++).value = footer.sumCL;
    tRow.getCell(c++).value = footer.sumFL;
    tRow.getCell(c++).value = footer.sumTotalLeave;
    tRow.getCell(c++).value = "";
    for (let col = 1; col <= lastCol; col += 1) {
      sheet.getCell(rowIndex, col).style = HEADER_STYLE;
    }
    rowIndex += 1;
  }

  applyTableBorders(sheet, 1, 5, 1, lastCol);
  applyTableBorders(sheet, headerRowIndex, Math.max(headerRowIndex, rowIndex - 1), 1, lastCol);

  sheet.getColumn(lastCol).width = 36;

  await downloadExcel(workbook, fileName(filePrefix, data.calendarYear));
}
