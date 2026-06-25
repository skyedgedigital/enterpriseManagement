import { Workbook } from "exceljs";
import type { BankStatementPTAData } from "@/components/pdf/BankStatementPTAPDF";
import {
  applyTableBorders,
  downloadExcel,
  HEADER_STYLE,
  reportFileName,
  RIGHT_CELL_STYLE,
} from "@/lib/excelUtils";

export async function generateBankStatementPTAExcel(data: BankStatementPTAData): Promise<void> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("BankStatement");

  const headers = [
    "Sl. No.",
    "W. M. Sl. No.",
    "Name of Workman",
    "Bank A/c",
    "IFSC Code",
    "Net Amount",
  ];

  sheet.mergeCells(1, 1, 1, headers.length);
  sheet.getCell(1, 1).value = "BANK STATEMENT PTA";
  sheet.getCell(1, 1).style = {
    ...HEADER_STYLE,
    font: { ...(HEADER_STYLE.font ?? {}), size: 14 },
  };
  sheet.mergeCells(2, 1, 2, headers.length);
  sheet.getCell(2, 1).value = `Period: ${String(data.month).padStart(2, "0")}/${data.year}`;

  sheet.addRow(headers);
  sheet.getRow(3).eachCell((cell) => {
    cell.style = HEADER_STYLE;
  });

  data.rows.forEach((row) => {
    sheet.addRow([
      row.serialNo,
      row.workManNo,
      row.name,
      row.bankAccount,
      row.ifsc,
      row.netAmount,
    ]);
  });

  const totalRow = sheet.addRow(["", "", "", "", "Total", data.totalAmount]);
  totalRow.getCell(5).style = HEADER_STYLE;
  totalRow.getCell(6).style = RIGHT_CELL_STYLE;

  const widths = [10, 14, 30, 24, 16, 14];
  widths.forEach((width, i) => {
    sheet.getColumn(i + 1).width = width;
  });

  const startRow = 3;
  const endRow = 4 + data.rows.length;
  applyTableBorders(sheet, startRow, endRow, 1, headers.length);
  for (let r = 4; r <= 3 + data.rows.length; r += 1) {
    sheet.getCell(r, 1).style = { ...sheet.getCell(r, 1).style, ...RIGHT_CELL_STYLE };
    sheet.getCell(r, 2).style = { ...sheet.getCell(r, 2).style, ...RIGHT_CELL_STYLE };
    sheet.getCell(r, 6).style = { ...sheet.getCell(r, 6).style, ...RIGHT_CELL_STYLE };
  }

  await downloadExcel(workbook, reportFileName("BankStatementPTA", data.month, data.year));
}
