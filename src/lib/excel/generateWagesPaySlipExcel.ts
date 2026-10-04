import { formatMoney2 } from "@/lib/moneyRounding";
import { Workbook } from "exceljs";
import type { WagesPaySlipData } from "@/components/pdf/WagesPaySlipPDF";
import {
  downloadExcel,
  HEADER_STYLE,
  monthLabel,
  reportFileName,
  RIGHT_CELL_STYLE,
} from "@/lib/excelUtils";

export async function generateWagesPaySlipExcel(data: WagesPaySlipData): Promise<void> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("WagesPaySlip");

  sheet.columns = [
    { width: 38 },
    { width: 28 },
  ];

  sheet.mergeCells("A1:B1");
  sheet.getCell("A1").value = "FORM XIX - WAGES SLIP";
  sheet.getCell("A1").style = {
    ...HEADER_STYLE,
    font: { ...(HEADER_STYLE.font ?? {}), size: 14 },
  };

  const monthYear = `${monthLabel(data.month)} ${data.year}`;
  const rows: [string, string | number][] = [
    ["Employee Name", data.employeeName],
    ["Workman No", data.workmanNo || "-"],
    ["Account Number", data.accountNumber || "-"],
    ["UAN", data.uan || "-"],
    ["ESIC No", data.esicNo || "-"],
    ["Nature of Work", data.natureOfWork || "-"],
    ["Month", monthYear],
    ["No. of Days Worked", data.daysWorked],
    ["Rate of Daily Wages (Basic + DA)", `${formatMoney2(data.basicRate)} + ${formatMoney2(data.daRate)} = ${formatMoney2(data.payRate)}`],
    ["Basic Amount", data.basicAmount],
    ["DA Amount", data.daAmount],
    ["Other Cash", data.otherCash],
    ["Gross Wages", data.grossWages],
    ["Advance Deduction", data.advanceDeduction],
    ["Damage Deduction", data.damageDeduction],
    ["PF Deduction", data.pf],
    ["ESI Deduction", data.esi],
    ["Incentive Amount", data.incentiveAmount ?? "NA"],
    ["Net Amount Paid", data.netAmountPaid],
  ];

  let rowIndex = 3;
  for (const [label, value] of rows) {
    sheet.getCell(rowIndex, 1).value = label;
    sheet.getCell(rowIndex, 1).style = HEADER_STYLE;
    sheet.getCell(rowIndex, 2).value = value;
    sheet.getCell(rowIndex, 2).style =
      typeof value === "number" ? RIGHT_CELL_STYLE : { ...RIGHT_CELL_STYLE, alignment: { vertical: "middle" } };
    if (typeof value === "number") sheet.getCell(rowIndex, 2).numFmt = ["PF Deduction", "ESI Deduction", "Net Amount Paid"].includes(label) ? "0" : label === "No. of Days Worked" ? "0.##" : "0.00";
    rowIndex += 1;
  }

  await downloadExcel(workbook, reportFileName("WagesPaySlip", data.month, data.year));
}
