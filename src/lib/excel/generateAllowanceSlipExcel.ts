import { Workbook } from "exceljs";
import type { AllowanceSlipData } from "@/lib/generateAllowanceSlip";
import {
  applyTableBorders,
  downloadExcel,
  HEADER_STYLE,
  reportFileName,
  RIGHT_CELL_STYLE,
} from "@/lib/excelUtils";

export async function generateAllowanceSlipExcel(data: AllowanceSlipData): Promise<void> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("AllowanceSlip");

  const headers = [
    "Sl No",
    "Employee Name",
    "Emp Code",
    "Present Days",
    "NH",
    "HRA",
    "Monthly Mobile Allowance",
    "Monthly Incumbent Allowance",
    "Earned Other Cash",
    "Performance Bonus",
    "Washing Allowance",
    "Conveyance Allowance",
    "Medical Allowance",
    "Site Specific Allowance",
    "Other Allowance",
    "Grand Total",
  ];

  sheet.mergeCells(1, 1, 1, headers.length);
  sheet.getCell(1, 1).value = "ALLOWANCE RECEIPT";
  sheet.getCell(1, 1).style = {
    ...HEADER_STYLE,
    font: { ...(HEADER_STYLE.font ?? {}), size: 14 },
  };

  sheet.mergeCells(2, 1, 2, 8);
  sheet.getCell(2, 1).value = `Contractor: ${data.contractorNameAddress}`;
  sheet.mergeCells(2, 9, 2, headers.length);
  sheet.getCell(2, 9).value = `Establishment: ${data.establishmentNameAddress}`;
  sheet.mergeCells(3, 1, 3, 8);
  sheet.getCell(3, 1).value = `Work Location: ${data.workNameLocation}`;
  sheet.mergeCells(3, 9, 3, headers.length);
  sheet.getCell(3, 9).value = `Principal Employer: ${data.principalEmployerNameAddress}`;

  sheet.addRow(headers);
  sheet.getRow(4).eachCell((cell) => {
    cell.style = HEADER_STYLE;
  });

  data.rows.forEach((row) => {
    sheet.addRow([
      row.slNo,
      row.employeeName,
      row.employeeCode,
      row.presentDays,
      row.nh,
      row.hra,
      row.monthlyMobileAllowance,
      row.monthlyIncumbentAllowance,
      row.earnedOtherCash,
      row.performanceBonus,
      row.washingAllowance,
      row.conveyanceAllowance,
      row.medicalAllowance,
      row.siteSpecificAllowance,
      row.otherAllowance,
      row.grandTotal,
    ]);
  });

  const widths = [8, 24, 12, 12, 8, 10, 16, 18, 16, 16, 16, 16, 16, 18, 14, 14];
  widths.forEach((width, i) => {
    sheet.getColumn(i + 1).width = width;
  });

  const dataStart = 5;
  const dataEnd = Math.max(dataStart, 4 + data.rows.length);
  applyTableBorders(sheet, 4, dataEnd, 1, headers.length);
  for (let r = dataStart; r <= dataEnd; r += 1) {
    for (let c = 1; c <= headers.length; c += 1) {
      if (c !== 2 && c !== 3) {
        sheet.getCell(r, c).style = { ...sheet.getCell(r, c).style, ...RIGHT_CELL_STYLE };
      }
    }
  }

  await downloadExcel(workbook, reportFileName("AllowanceSlip", data.month, data.year));
}
