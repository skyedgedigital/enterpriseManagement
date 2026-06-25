import { Workbook } from "exceljs";
import type { BonusRegisterData } from "@/lib/buildBonusRegisterData";
import { computeBonusRegisterFooterTotals } from "@/lib/buildBonusRegisterData";
import {
  applyTableBorders,
  downloadExcel,
  HEADER_STYLE,
  RIGHT_CELL_STYLE,
} from "@/lib/excelUtils";

function bonusRegisterExcelFileName(prefix: string, fyEndYear: number): string {
  const y0 = fyEndYear - 1;
  return `${prefix}_FY${y0}-${fyEndYear}.xlsx`;
}

const COLS = 16;
const HEADER_TOP_LAST = 3;
const TABLE_HEADER_ROW1 = 5;
const TABLE_HEADER_ROW2 = 6;
const DATA_START_ROW = 7;

const FORM_LEFT = `FORM C
Under Rule 4(d) of the Payment of Bonus Rules, 1965`;

export async function generateBonusRegisterExcel(
  data: BonusRegisterData,
  filePrefix: string,
): Promise<void> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("FormCBonusRegister", {
    views: [{ state: "frozen", ySplit: DATA_START_ROW - 1 }],
  });

  sheet.mergeCells(1, 1, HEADER_TOP_LAST, 5);
  sheet.getCell(1, 1).value = `${FORM_LEFT}\nBonus Paid to Employees for the Accounting Year ending on the ${data.periodToDisplay}`;
  sheet.getCell(1, 1).style = {
    ...HEADER_STYLE,
    alignment: { ...HEADER_STYLE.alignment, horizontal: "left", vertical: "top", wrapText: true },
  };

  sheet.mergeCells(1, 6, HEADER_TOP_LAST, 11);
  sheet.getCell(1, 6).value = `Name of Establishment\n${data.contractorName}\nOffice Add.-${data.contractorOfficeLine}`;
  sheet.getCell(1, 6).style = {
    ...HEADER_STYLE,
    alignment: { ...HEADER_STYLE.alignment, horizontal: "center", vertical: "middle", wrapText: true },
    font: { ...(HEADER_STYLE.font ?? {}), bold: true },
  };

  const orderText = data.orderNumber.trim() || "";
  sheet.mergeCells(1, 12, HEADER_TOP_LAST, COLS);
  sheet.getCell(1, 12).value = {
    richText: [
      { text: "BONUS REGISTER", font: { bold: true, underline: true, size: 11 } },
      {
        text: `\nFrom Date: ${data.periodFromDisplay}\nTo Date: ${data.periodToDisplay}\nOrder No.: ${orderText}`,
        font: { bold: true, size: 11 },
      },
    ],
  };
  sheet.getCell(1, 12).style = {
    ...HEADER_STYLE,
    alignment: { ...HEADER_STYLE.alignment, horizontal: "right", vertical: "top", wrapText: true },
  };

  sheet.getRow(4).height = 4;

  for (let c = 1; c <= 8; c += 1) {
    sheet.mergeCells(TABLE_HEADER_ROW1, c, TABLE_HEADER_ROW2, c);
  }
  sheet.mergeCells(TABLE_HEADER_ROW1, 9, TABLE_HEADER_ROW1, 11);
  for (let c = 12; c <= COLS; c += 1) {
    sheet.mergeCells(TABLE_HEADER_ROW1, c, TABLE_HEADER_ROW2, c);
  }

  const h1: Record<number, string> = {
    1: "Sl. No.",
    2: "Employee Name",
    3: "Father's Name",
    4: "Whether he has completed 15 of Age at the beginning of the Accounting Year",
    5: "Desig",
    6: "No. of Days Worked in the Year",
    7: "Total Salary or Wages in Respect of the Acc. Year",
    8: "Amount of Bonus Payable under Sec 10 & Sec. 11 as the case may be",
    9: "DEDUCTION",
    12: "Total Sum Deducted Col. 9, 10, 11",
    13: "Net Payable Amount Col 8 minus Col 10",
    14: "Amount Actually Paid",
    15: "Date on which paid",
    16: "Signature or Thumb Impression of the Employee",
  };

  for (let c = 1; c <= COLS; c += 1) {
    const text = h1[c];
    if (text !== undefined) {
      const cell = sheet.getCell(TABLE_HEADER_ROW1, c);
      cell.value = text;
      cell.style = { ...HEADER_STYLE, alignment: { ...HEADER_STYLE.alignment, wrapText: true } };
    }
  }

  const dedSub: Record<number, string> = {
    9: "Puja Bonus or Other Customary Bonus paid during the Acc. Year",
    10: "Interim Bonus Bonus Paid in Advance",
    11: "Deduction on A/c of Financial Loss if any Caused by Misconduct of the Emp.",
  };
  for (const c of [9, 10, 11] as const) {
    const cell = sheet.getCell(TABLE_HEADER_ROW2, c);
    cell.value = dedSub[c];
    cell.style = { ...HEADER_STYLE, alignment: { ...HEADER_STYLE.alignment, wrapText: true } };
  }

  data.rows.forEach((row) => {
    sheet.addRow([
      row.slNo,
      row.employeeName,
      row.fathersName,
      row.completed15YearsAtFyStart,
      row.designation,
      row.daysWorkedYear,
      row.totalSalaryOrWages,
      row.amountOfBonusPayable,
      row.deductionPujaOrCustomary,
      row.deductionInterimBonus,
      row.deductionFinancialLoss,
      row.totalSumDeducted,
      row.netPayableAmount,
      row.netPayableAmount,
      "",
      "",
    ]);
  });

  const footer = computeBonusRegisterFooterTotals(data.rows);
  sheet.addRow([
    "",
    "Total",
    "",
    "",
    "",
    footer.sumDaysWorkedYear,
    footer.sumTotalSalaryOrWages,
    footer.sumBonusPayable,
    footer.sumDeductionPujaOrCustomary,
    footer.sumDeductionInterimBonus,
    footer.sumDeductionFinancialLoss,
    footer.sumTotalDeducted,
    footer.sumNetPayable,
    footer.sumNetPayable,
    "",
    "",
  ]);

  const widths = [5, 18, 18, 14, 12, 10, 16, 16, 14, 14, 14, 14, 14, 14, 12, 14];
  widths.forEach((width, i) => {
    sheet.getColumn(i + 1).width = width;
  });

  const dataEndRow = DATA_START_ROW + data.rows.length + 1;
  applyTableBorders(sheet, TABLE_HEADER_ROW1, dataEndRow, 1, COLS);

  const numericCols = [1, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  for (let r = DATA_START_ROW; r <= dataEndRow; r += 1) {
    numericCols.forEach((col) => {
      const cell = sheet.getCell(r, col);
      cell.style = { ...cell.style, ...RIGHT_CELL_STYLE };
    });
    sheet.getCell(r, 7).numFmt = "#,##0.00";
    for (const col of [8, 9, 10, 11, 12, 13, 14]) {
      sheet.getCell(r, col).numFmt = "#,##0.00";
    }
  }

  sheet.getRow(1).height = 48;
  sheet.getRow(TABLE_HEADER_ROW1).height = 72;
  sheet.getRow(TABLE_HEADER_ROW2).height = 54;

  await downloadExcel(workbook, bonusRegisterExcelFileName(filePrefix, data.fyEndYear));
}
