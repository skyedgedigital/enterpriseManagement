import { Workbook } from "exceljs";
import type { FullAndFinalData } from "@/lib/buildFullAndFinalData";
import { applyTableBorders, downloadExcel, HEADER_STYLE } from "@/lib/excelUtils";
import { formatMoneyWhole } from "@/lib/moneyRounding";

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function fmt2(n: number): string {
  return (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2);
}

function todayDdMmYyyy(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1,
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

export async function generateFullAndFinalExcel(
  data: FullAndFinalData,
  filePrefix = "FullAndFinal",
): Promise<void> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("Full & Final", {
    views: [{ state: "frozen", ySplit: 0 }],
  });

  const TOTAL_COLS = 14; // Year/Month | 12 months | Total

  const thinBorder = {
    top: { style: "thin" as const },
    left: { style: "thin" as const },
    bottom: { style: "thin" as const },
    right: { style: "thin" as const },
  };

  const boldFont = { bold: true, size: 10 as number };
  const normalFont = { size: 10 as number };
  const headerFont = { bold: true, size: 11 as number };

  let row = 1;

  // =========================================================================
  // Workman Details
  // =========================================================================
  sheet.mergeCells(row, 1, row, TOTAL_COLS);
  sheet.getCell(row, 1).value = "Workman Details";
  sheet.getCell(row, 1).font = headerFont;
  sheet.getCell(row, 1).alignment = { horizontal: "left", vertical: "middle" };
  row += 1;

  const rateDisplay =
    data.ratePayTotal > 0
      ? `₹ ${fmt2(data.ratePayTotal)} (${fmt2(data.ratePayBasic)} + ${fmt2(data.ratePayDa)})`
      : "—";

  const detailsPairs: [string, string][] = [
    ["Workman Name", data.employeeName],
    ["Service Period", `${data.servicePeriodFrom} - ${data.servicePeriodTo}`],
    ["Vendor Code", data.vendorCode],
    ["Date of Joining Vendor (dd/MM/yyyy)", data.dateOfEmployment],
    ["Rate of Pay (Basic+VDA)", rateDisplay],
    ["Workman Designation", data.workmanDesignation],
    ["Previous Year Leave?", data.previousYearLeaveCleared ? "Yes" : "No"],
    ["Previous Year Bonus?", data.previousYearBonusCleared ? "Yes" : "No"],
    ["Make Balance Attendance Entry?", data.makeBalanceAttendanceEntry ? "Yes" : "No"],
    ["Mode of Separation", data.modeOfSeparation || "—"],
  ];

  // Two pairs per row (label1, value1 merged; label2, value2 merged)
  const halfCols = TOTAL_COLS / 2;
  const labelW = 3;
  for (let i = 0; i < detailsPairs.length; i += 2) {
    const left = detailsPairs[i];
    const right = detailsPairs[i + 1];

    if (left) {
      sheet.mergeCells(row, 1, row, labelW);
      sheet.getCell(row, 1).value = left[0];
      sheet.getCell(row, 1).font = boldFont;
      sheet.getCell(row, 1).border = thinBorder;
      sheet.mergeCells(row, labelW + 1, row, halfCols);
      sheet.getCell(row, labelW + 1).value = left[1];
      sheet.getCell(row, labelW + 1).font = normalFont;
      sheet.getCell(row, labelW + 1).border = thinBorder;
    }

    if (right) {
      sheet.mergeCells(row, halfCols + 1, row, halfCols + labelW);
      sheet.getCell(row, halfCols + 1).value = right[0];
      sheet.getCell(row, halfCols + 1).font = boldFont;
      sheet.getCell(row, halfCols + 1).border = thinBorder;
      sheet.mergeCells(row, halfCols + labelW + 1, row, TOTAL_COLS);
      sheet.getCell(row, halfCols + labelW + 1).value = right[1];
      sheet.getCell(row, halfCols + labelW + 1).font = normalFont;
      sheet.getCell(row, halfCols + labelW + 1).border = thinBorder;
    }
    row += 1;
  }

  row += 1; // spacer

  // =========================================================================
  // Attendance Details
  // =========================================================================
  sheet.mergeCells(row, 1, row, TOTAL_COLS);
  sheet.getCell(row, 1).value = "Attendance Details";
  sheet.getCell(row, 1).font = headerFont;
  sheet.getCell(row, 1).alignment = { horizontal: "left", vertical: "middle" };
  row += 1;

  writeMonthTable(
    sheet,
    row,
    TOTAL_COLS,
    "Year/Month",
    data.years.map((y) => ({
      label: y.label,
      values: y.months.map((m) => Math.round(m.daysWorked)),
      total: Math.round(y.totalDays),
    })),
    thinBorder,
    boldFont,
    normalFont,
    "int",
  );
  row += 2 + Math.max(1, data.years.length);
  row += 1; // spacer

  // =========================================================================
  // Gross Wages
  // =========================================================================
  sheet.mergeCells(row, 1, row, TOTAL_COLS);
  sheet.getCell(row, 1).value = "Gross Wages (Basic+VDA)";
  sheet.getCell(row, 1).font = headerFont;
  sheet.getCell(row, 1).alignment = { horizontal: "left", vertical: "middle" };
  row += 1;

  writeMonthTable(
    sheet,
    row,
    TOTAL_COLS,
    "Year/Month",
    data.years.map((y) => ({
      label: y.label,
      values: y.months.map((m) => Math.round((m.gross + Number.EPSILON) * 100) / 100),
      total: Math.round((y.totalGross + Number.EPSILON) * 100) / 100,
    })),
    thinBorder,
    boldFont,
    normalFont,
    "money",
  );
  row += 2 + Math.max(1, data.years.length);
  row += 1;

  // =========================================================================
  // Component calculation table
  // =========================================================================
  const compRows: {
    component: string;
    definition: string;
    eligibility: string;
    amount: number;
  }[] = [
    {
      component: "Unpaid Wages",
      definition: "Wage calculation for working days for current month",
      eligibility: `Days Worked in Current Month: ${Math.round(
        data.unpaidWagesDays,
      )}`,
      amount: data.unpaidWages,
    },
    {
      component: "Leave",
      definition:
        "Earned leave calculated in current calendar year after deducting availed earned leave in the calendar year. Earned leave is 1 for every 20 days worked in a calendar year",
      eligibility:
        `Days worked in Calendar Year: ${Math.round(data.grandTotalDays)}\n` +
        `No. of earned leave eligible: ${Math.round(data.elTotal)}\n` +
        `No. of EL availed: ${Math.round(data.leaveAvailedDays)}\n` +
        `Balance EL: ${Math.round(data.balanceLeaveDays)}`,
      amount: data.leaveAmountMonetary,
    },
    {
      component: "Bonus",
      definition:
        "Bonus eligibility of current financial year is to be auto-calculated as 8.33% of total Basic+VDA of current FY in case employee has worked minimum 30 days in a FY; else system to calculate bonus eligibility as nil. In case of employee having gross wages more than Rs.21,000 p.m. bonus is not applicable.",
      eligibility:
        `No of days worked in FY: ${Math.round(data.currentFYDaysWorked)}\n` +
        `8.33% of gross wages payable`,
      amount: data.bonusAmount,
    },
    {
      component: "Previous FY Bonus",
      definition:
        "Bonus eligibility of previous financial year is to be auto-calculated as 8.33% of total Basic+VDA of previous FY in case employee has worked minimum 30 days in a FY; else system to calculate bonus eligibility as nil. In case of employee having gross wages more than Rs.21,000 p.m. bonus is not applicable.",
      eligibility:
        `No of days worked in FY: ${Math.round(data.previousFYDaysWorked)}\n` +
        `8.33% of gross wages payable`,
      amount: data.previousFYBonusAmount,
    },
    {
      component: "Gratuity",
      definition:
        "A contract worker who must work continuously 5 years, within 5 years last year if he worked for 240 days should also be considered as a completed year-will be eligible for gratuity payment. Gratuity is thus calculated for every completed year as last drawn (Basic + DA) * 15 days",
      eligibility: `Gratuity payable for ${
        data.gratuityYears > 0 ? data.gratuityYears : "N/A"
      } years`,
      amount: data.gratuityAmount,
    },
    {
      component: "Retrenchment",
      definition:
        "Retrenchment benefit is calculated as:\n(i) In any completed year if contract worker worked more than 240 days, he will be eligible for 15 days retrenchment benefit for every completed year.\n(ii) Meaning of 240 days- working days, any type of leave (including CL/FL/PL), any authorised sick leave without pay (excluding LWP) are to be considered as days worked.\n(iii) In 240 days completion; the encashment of no. of days of leave should also be included.\n(iv) If last completed year, the contract worker has worked for more than 6 months but not completed 12 months of service and if in first 6 months; he has completed 120 days; he will be eligible for 15 days retrenchment benefit.",
      eligibility: `Completed Years of Service: ${
        data.completedYearsOfService > 0 ? data.completedYearsOfService : "N/A"
      }`,
      amount: data.retrenchmentAmount,
    },
    {
      component: "Notice Pay",
      definition:
        "Notice pay is payable in lieu of notice as defined in the Industrial Disputes Act. An employer is required to give at least one month's advance notice or payment in lieu thereof to a worker who has completed at least one year of continuous service before termination. It is to be nil in case mode of separation is 'Resignation by workman' else notice pay to be calculated as 26 days (in case total no. of working days is 240 from DOJ) else 3 days of (Basic+VDA) amount of last drawn wages.",
      eligibility:
        `Mode of Separation: ${data.modeOfSeparation || "N/A"}\n` +
        `No of days worked: ${Math.round(data.grandTotalDays)}`,
      amount: data.noticePay,
    },
  ];

  // Header
  const compStart = row;
  const compHeaders = ["Component", "Definition", "Eligibility (No of days)", "Final Amount (₹)"];
  const compWidths = [2, 7, 3, 2]; // proportion in 14 columns
  let c = 1;
  compHeaders.forEach((h, i) => {
    sheet.mergeCells(row, c, row, c + compWidths[i] - 1);
    sheet.getCell(row, c).value = h;
    sheet.getCell(row, c).font = boldFont;
    sheet.getCell(row, c).alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    sheet.getCell(row, c).fill = HEADER_STYLE.fill!;
    sheet.getCell(row, c).border = thinBorder;
    c += compWidths[i];
  });
  row += 1;

  for (const r of compRows) {
    c = 1;
    const values = [r.component, r.definition, r.eligibility, r.amount];
    values.forEach((v, i) => {
      sheet.mergeCells(row, c, row, c + compWidths[i] - 1);
      const cell = sheet.getCell(row, c);
      cell.value = v;
      cell.font = i === 3 ? boldFont : normalFont;
      cell.alignment = {
        vertical: "middle",
        wrapText: true,
        horizontal: i === 3 ? "right" : i === 0 ? "center" : "left",
      };
      cell.border = thinBorder;
      if (i === 3) cell.numFmt = '"₹ "#,##0.00';
      c += compWidths[i];
    });
    sheet.getRow(row).height = 46;
    row += 1;
  }

  // Grand total
  sheet.mergeCells(row, 1, row, compWidths[0] + compWidths[1] + compWidths[2]);
  sheet.getCell(row, 1).value = "Total amount towards Full & Final Settlement";
  sheet.getCell(row, 1).font = boldFont;
  sheet.getCell(row, 1).alignment = { horizontal: "center", vertical: "middle" };
  sheet.getCell(row, 1).border = thinBorder;
  const ffCol = compWidths[0] + compWidths[1] + compWidths[2] + 1;
  sheet.mergeCells(row, ffCol, row, TOTAL_COLS);
  sheet.getCell(row, ffCol).value = `₹ ${formatMoneyWhole(data.totalFullAndFinal)}`;
  sheet.getCell(row, ffCol).font = boldFont;
  sheet.getCell(row, ffCol).alignment = { horizontal: "right", vertical: "middle" };
  sheet.getCell(row, ffCol).border = thinBorder;
  applyTableBorders(sheet, compStart, row, 1, TOTAL_COLS);
  row += 2;

  // =========================================================================
  // Deductions
  // =========================================================================
  if (data.deductionLines.length > 0) {
    sheet.mergeCells(row, 1, row, TOTAL_COLS);
    sheet.getCell(row, 1).value = "Deductions";
    sheet.getCell(row, 1).font = headerFont;
    row += 1;

    for (const d of data.deductionLines) {
      sheet.mergeCells(row, 1, row, 9);
      sheet.getCell(row, 1).value = d.label;
      sheet.getCell(row, 1).font = normalFont;
      sheet.getCell(row, 1).border = thinBorder;

      sheet.mergeCells(row, 10, row, TOTAL_COLS);
      sheet.getCell(row, 10).value = d.amount;
      sheet.getCell(row, 10).numFmt = '"₹ "#,##0.00';
      sheet.getCell(row, 10).alignment = { horizontal: "right" };
      sheet.getCell(row, 10).border = thinBorder;
      row += 1;
    }

    sheet.mergeCells(row, 1, row, 9);
    sheet.getCell(row, 1).value = "Total Deductions";
    sheet.getCell(row, 1).font = boldFont;
    sheet.getCell(row, 1).border = thinBorder;

    sheet.mergeCells(row, 10, row, TOTAL_COLS);
    sheet.getCell(row, 10).value = data.totalDeductions;
    sheet.getCell(row, 10).numFmt = '"₹ "#,##0.00';
    sheet.getCell(row, 10).font = boldFont;
    sheet.getCell(row, 10).alignment = { horizontal: "right" };
    sheet.getCell(row, 10).border = thinBorder;
    row += 2;
  }

  // =========================================================================
  // Workman Declaration
  // =========================================================================
  addParagraphBlock(sheet, row, TOTAL_COLS, "Workman Declaration:", [
    `Received a sum of ₹ ${fmt2(
      data.netPayable,
    )} (post deduction of ₹ ${fmt2(data.totalDeductions)}) on ${todayDdMmYyyy()} as Full and Final Settlement for my service with M/s ${data.contractorName.toUpperCase()} for the working period ${data.servicePeriodFrom}-${data.servicePeriodTo}.`,
    "",
    "Sign/L.T.I. of workman",
    data.employeeName.toUpperCase(),
  ]);
  row += 5;

  // =========================================================================
  // Acknowledgement
  // =========================================================================
  addParagraphBlock(sheet, row, TOTAL_COLS, "Acknowledgement:", [
    `I the under signed................... Proprietor of the firm ${data.contractorName.toUpperCase()} (${data.vendorCode}) guarantee that the calculation sheet of final settlement of each of my employee generated through CLM has been thoroughly validated with the records available with us. Any discrepancy in future in form of any complaint of the concerned employee will be settled by us.`,
  ]);
  row += 2;

  // =========================================================================
  // Indemnity Bond
  // =========================================================================
  addParagraphBlock(sheet, row, TOTAL_COLS, "INDEMNITY BOND-CUM-DECLARATION:", [
    `M/s. ${data.contractorName.toUpperCase()} hereby unconditionally & irrevocably agrees to indemnify M/s. Tata Steel Ltd. against liabilities of Mr./Ms. ${data.employeeName.toUpperCase()} towards payment of gratuity for the period during he/she was associated with us and the same is not disclosed to M/s Tata Steel Ltd. We also indemnify M/s Tata Steel Ltd. against any further liability and/or penalty & action by whatever name it may be called arising out of any demand for or on behalf of him/her by any statutory authorities and/or any action or proceeding thereunder.`,
    "I the under signed am responsible to pay for all such dues in a timely manner.",
    "",
    `Date: (${todayDdMmYyyy()})`,
    `Signature: (${data.contractorName.toUpperCase()})`,
    "Sign of contractor with seal",
  ]);
  row += 7;

  // =========================================================================
  // Disclaimer
  // =========================================================================
  addParagraphBlock(sheet, row, TOTAL_COLS, "Disclaimer:", [
    "The above amount is an approximate settlement amount calculated by the system. This amount may vary from the actual dues payable to the employee. Contractor/Vendor is requested to verify the same.",
  ]);

  // --- Column widths ---
  sheet.getColumn(1).width = 14;
  for (let i = 2; i <= TOTAL_COLS; i += 1) sheet.getColumn(i).width = 10;

  const periodLabel = data.years.map((y) => y.year).join("-") || "period";
  await downloadExcel(
    workbook,
    `${filePrefix}_${data.employeeName.replace(/\s+/g, "_")}_${periodLabel}.xlsx`,
  );
}

// ---------------------------------------------------------------------------
// Small helpers for the sheet layout
// ---------------------------------------------------------------------------

type MonthTableRow = {
  label: string;
  values: number[];
  total: number;
};

function writeMonthTable(
  sheet: import("exceljs").Worksheet,
  startRow: number,
  totalCols: number,
  headerLabel: string,
  rows: MonthTableRow[],
  thinBorder: {
    top: { style: "thin" };
    left: { style: "thin" };
    bottom: { style: "thin" };
    right: { style: "thin" };
  },
  boldFont: { bold: boolean; size: number },
  normalFont: { size: number },
  format: "int" | "money",
): void {
  const labelCol = 1;
  const firstMonthCol = 2;
  const totalCol = totalCols;

  // Header
  sheet.getCell(startRow, labelCol).value = headerLabel;
  sheet.getCell(startRow, labelCol).font = boldFont;
  sheet.getCell(startRow, labelCol).alignment = { horizontal: "center", vertical: "middle" };
  sheet.getCell(startRow, labelCol).fill = HEADER_STYLE.fill!;
  sheet.getCell(startRow, labelCol).border = thinBorder;

  for (let i = 0; i < 12; i += 1) {
    const c = firstMonthCol + i;
    sheet.getCell(startRow, c).value = MONTH_SHORT[i];
    sheet.getCell(startRow, c).font = boldFont;
    sheet.getCell(startRow, c).alignment = { horizontal: "center", vertical: "middle" };
    sheet.getCell(startRow, c).fill = HEADER_STYLE.fill!;
    sheet.getCell(startRow, c).border = thinBorder;
  }
  sheet.getCell(startRow, totalCol).value = "Total";
  sheet.getCell(startRow, totalCol).font = boldFont;
  sheet.getCell(startRow, totalCol).alignment = { horizontal: "center", vertical: "middle" };
  sheet.getCell(startRow, totalCol).fill = HEADER_STYLE.fill!;
  sheet.getCell(startRow, totalCol).border = thinBorder;

  // Body
  rows.forEach((r, ri) => {
    const row = startRow + 1 + ri;
    sheet.getCell(row, labelCol).value = r.label;
    sheet.getCell(row, labelCol).font = boldFont;
    sheet.getCell(row, labelCol).alignment = { horizontal: "center" };
    sheet.getCell(row, labelCol).border = thinBorder;

    for (let i = 0; i < 12; i += 1) {
      const cell = sheet.getCell(row, firstMonthCol + i);
      cell.value = r.values[i] ?? 0;
      cell.numFmt = format === "money" ? "#,##0.00" : "0";
      cell.alignment = { horizontal: "right" };
      cell.font = normalFont;
      cell.border = thinBorder;
    }

    const tCell = sheet.getCell(row, totalCol);
    tCell.value = r.total;
    tCell.numFmt = format === "money" ? "#,##0.00" : "0";
    tCell.font = boldFont;
    tCell.alignment = { horizontal: "right" };
    tCell.border = thinBorder;
  });
}

function addParagraphBlock(
  sheet: import("exceljs").Worksheet,
  startRow: number,
  totalCols: number,
  heading: string,
  paragraphs: string[],
): void {
  sheet.mergeCells(startRow, 1, startRow, totalCols);
  const head = sheet.getCell(startRow, 1);
  head.value = heading;
  head.font = { bold: true, size: 10, underline: true };
  head.alignment = { horizontal: "left" };

  paragraphs.forEach((p, i) => {
    const r = startRow + 1 + i;
    sheet.mergeCells(r, 1, r, totalCols);
    const cell = sheet.getCell(r, 1);
    cell.value = p;
    cell.font = { size: 10, bold: i === 0 };
    cell.alignment = { horizontal: "left", vertical: "top", wrapText: true };
    sheet.getRow(r).height = Math.min(120, Math.max(20, Math.ceil(p.length / 100) * 18));
  });
}
