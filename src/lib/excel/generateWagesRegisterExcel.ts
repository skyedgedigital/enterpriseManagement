import { Workbook } from "exceljs";
import type { WagesPaySlipData } from "@/components/pdf/WagesPaySlipPDF";
import {
  applyTableBorders,
  downloadExcel,
  HEADER_STYLE,
  reportFileName,
  RIGHT_CELL_STYLE,
} from "@/lib/excelUtils";

export async function generateWagesRegisterExcel(
  slips: WagesPaySlipData[],
  month: number,
  year: number,
): Promise<void> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("WagesRegister");

  const headers = [
    "Sl No",
    "Employee Name",
    "Workman No",
    "Days Worked",
    "Basic Rate",
    "DA Rate",
    "Basic Amount",
    "DA Amount",
    "Other Cash",
    "Gross Wages",
    "PF",
    "ESI",
    "Incentive",
    "Net Amount Paid",
  ];

  sheet.mergeCells(1, 1, 1, headers.length);
  sheet.getCell(1, 1).value = "WAGES REGISTER";
  sheet.getCell(1, 1).style = {
    ...HEADER_STYLE,
    font: { ...(HEADER_STYLE.font ?? {}), size: 14 },
  };
  sheet.mergeCells(2, 1, 2, headers.length);
  sheet.getCell(2, 1).value = `Period: ${String(month).padStart(2, "0")}/${year}`;

  sheet.addRow(headers);
  sheet.getRow(3).eachCell((cell) => {
    cell.style = HEADER_STYLE;
  });

  slips.forEach((slip, idx) => {
    sheet.addRow([
      idx + 1,
      slip.employeeName,
      slip.workmanNo,
      slip.daysWorked,
      slip.basicRate,
      slip.daRate,
      slip.basicAmount,
      slip.daAmount,
      slip.otherCash,
      slip.grossWages,
      slip.pf,
      slip.esi,
      slip.incentiveAmount ?? 0,
      slip.netAmountPaid,
    ]);
  });

  const widths = [8, 24, 14, 12, 12, 10, 12, 12, 12, 14, 10, 10, 12, 14];
  widths.forEach((width, i) => {
    sheet.getColumn(i + 1).width = width;
  });

  const dataStart = 4;
  const dataEnd = Math.max(dataStart, 3 + slips.length);
  applyTableBorders(sheet, 3, dataEnd, 1, headers.length);
  for (let r = dataStart; r <= dataEnd; r += 1) {
    for (let c = 1; c <= headers.length; c += 1) {
      if (c !== 2 && c !== 3) {
        sheet.getCell(r, c).style = { ...sheet.getCell(r, c).style, ...RIGHT_CELL_STYLE };
      }
    }
  }

  await downloadExcel(workbook, reportFileName("WagesRegister", month, year));
}
