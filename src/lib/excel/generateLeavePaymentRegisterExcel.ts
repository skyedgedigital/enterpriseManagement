import { Workbook } from "exceljs";
import type { LeavePaymentRegisterData } from "@/lib/buildLeavePaymentRegisterData";
import {
  CELL_STYLE,
  CENTER_CELL_STYLE,
  downloadExcel,
  HEADER_STYLE,
  RIGHT_CELL_STYLE,
} from "@/lib/excelUtils";
import { formatMoney2, formatMoneyWhole } from "@/lib/moneyRounding";

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

/** Physical columns matching PDF (19). */
const COLS = 19;

export async function generateLeavePaymentRegisterExcel(
  data: LeavePaymentRegisterData,
  filePrefix: string,
): Promise<void> {
  const workbook = new Workbook();
  const periodLine = `From ${data.periodFromDisplay} To ${data.periodToDisplay}`;

  const sheet = workbook.addWorksheet("LeavePaymentRegister", {
    views: [{ state: "frozen", ySplit: 15 }],
  });

  sheet.mergeCells(1, 1, 1, COLS);
  sheet.getCell(1, 1).value = `Name and Address Of Contractor:\n${data.companyName}`;
  sheet.getCell(1, 1).style = {
    ...headerBandStyle,
    font: { size: 11, bold: true, name: "Times New Roman" },
    alignment: { horizontal: "left" as const, vertical: "top" as const, wrapText: true },
  };

  sheet.mergeCells(2, 1, 2, COLS);
  sheet.getCell(2, 1).value = data.officeLine;
  sheet.getCell(2, 1).style = headerBandStyle;

  sheet.mergeCells(3, 1, 3, COLS);
  sheet.getCell(3, 1).value = data.correspondingLine;
  sheet.getCell(3, 1).style = headerBandStyle;

  sheet.mergeCells(4, 1, 4, COLS);
  sheet.getCell(4, 1).value = "FORM XVII";
  sheet.getCell(4, 1).style = {
    ...titleCenterStyle,
    font: { size: 16, bold: true, name: "Times New Roman" },
  };

  sheet.mergeCells(5, 1, 5, COLS);
  sheet.getCell(5, 1).value = "[See Rule 78 (2) (a)]";
  sheet.getCell(5, 1).style = {
    ...headerBandStyle,
    alignment: { horizontal: "center" as const, vertical: "middle" as const },
  };

  sheet.mergeCells(6, 1, 6, COLS);
  sheet.getCell(6, 1).value = "REGISTER OF LEAVE PAYMENT";
  sheet.getCell(6, 1).style = titleCenterStyle;

  sheet.mergeCells(7, 1, 7, COLS);
  sheet.getCell(7, 1).value = periodLine;
  sheet.getCell(7, 1).style = {
    ...headerBandStyle,
    font: { size: 11, bold: true, name: "Times New Roman" },
    alignment: { horizontal: "center" as const, vertical: "middle" as const },
  };

  sheet.mergeCells(8, 1, 8, 10);
  sheet.getCell(8, 1).value =
    "Name and Address of Establishment In/Under which contract is carried on:\n" +
    (data.establishmentNameAddress || "—");
  sheet.getCell(8, 1).style = headerBandStyle;

  sheet.mergeCells(8, 11, 8, COLS);
  sheet.getCell(8, 11).value =
    "Name and Address of Principal Employer:\n" + (data.principalEmployerNameAddress || "—");
  sheet.getCell(8, 11).style = headerBandStyle;

  sheet.mergeCells(9, 1, 9, COLS);
  sheet.getCell(9, 1).value = `Nature & Location of Work: ${data.natureLocationOfWork.trim() || "—"}`;
  sheet.getCell(9, 1).style = headerBandStyle;

  sheet.mergeCells(10, 1, 10, COLS);
  sheet.getCell(10, 1).value = `Work Order No.: ${data.workOrderNumber.trim() || "—"}`;
  sheet.getCell(10, 1).style = headerBandStyle;

  const rNum = 11;
  const nums = [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
    "13",
    "13",
    "13",
    "14",
    "15",
    "16",
    "17",
  ];
  for (let c = 0; c < COLS; c++) {
    sheet.getCell(rNum, c + 1).value = nums[c];
    sheet.getCell(rNum, c + 1).style = HEADER_STYLE;
  }

  const rMain = 12;
  const set = (r: number, c1: number, c2: number, v: string) => {
    sheet.mergeCells(r, c1, r, c2);
    sheet.getCell(r, c1).value = v;
    sheet.getCell(r, c1).style = HEADER_STYLE;
  };
  set(rMain, 1, 1, "Sl. No.");
  set(rMain, 2, 2, "Name of Workman");
  set(rMain, 3, 3, "Serial No. in the Reg. of Workman");
  set(rMain, 4, 4, "Designation\nNature of Work Done");
  set(rMain, 5, 5, "No. of Days Worked");
  set(rMain, 6, 6, "Unit\nUnits Work Done");
  set(rMain, 7, 7, "Daily Rate\nPiece Rate");
  set(rMain, 8, 11, "AMOUNT OF WAGES");
  set(rMain, 12, 12, "Total");
  set(rMain, 13, 15, "Deduction if any\n(Indicate nature)");
  set(rMain, 16, 16, "Net Amount Paid");
  set(rMain, 17, 17, "Sig/Thumb Impression\nWork Man");
  set(rMain, 18, 18, "Initial Of Cont.\nor his Represen.");
  set(rMain, 19, 19, "Remarks");

  const rSub = 13;
  for (let c = 1; c <= 7; c++) {
    sheet.getCell(rSub, c).value = "";
    sheet.getCell(rSub, c).style = HEADER_STYLE;
  }
  const subLabels = [
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "Basic Wages",
    "DA",
    "Over Time",
    "Other Cash Payment",
    "",
    "PF",
    "ESI",
    "Others",
    "",
    "",
    "",
    "",
  ];
  for (let c = 0; c < COLS; c++) {
    sheet.getCell(rSub, c + 1).value = subLabels[c] ?? "";
    sheet.getCell(rSub, c + 1).style = HEADER_STYLE;
  }

  let r = 14;
  data.rows.forEach((row, idx) => {
    const leaveCell =
      `Cl  ${formatMoneyWhole(row.daysCl)}\nEl  ${formatMoneyWhole(row.daysEl)}\nFl  ${formatMoneyWhole(row.daysFl)}\n———\n${formatMoneyWhole(row.daysLeaveTotal)}`;
    const rateCell =
      `${formatMoney2(row.basicRate)}\n${formatMoney2(row.daRate)}\n———\n${formatMoney2(row.rateTotal)}`;

    const vals: (string | number)[] = [
      idx + 1,
      row.employeeName,
      row.workmanNo,
      row.designationNature,
      leaveCell,
      "",
      rateCell,
      formatMoney2(row.sumBasicWages),
      formatMoney2(row.sumDa),
      formatMoney2(row.sumOvertime),
      formatMoneyWhole(row.sumOtherCashPayment),
      formatMoney2(row.sumTotalWages),
      formatMoneyWhole(row.sumPf),
      formatMoneyWhole(row.sumEsi),
      formatMoneyWhole(row.sumOthersDeduction),
      formatMoneyWhole(row.sumNetPaid),
      "",
      "",
      row.remarks ?? "",
    ];

    vals.forEach((v, ci) => {
      const cell = sheet.getCell(r, ci + 1);
      cell.value = v;
      if (ci === 0) cell.style = CENTER_CELL_STYLE;
      else if (ci === 4 || ci === 6) cell.style = CENTER_CELL_STYLE;
      else if (ci >= 7 && ci <= 15) cell.style = RIGHT_CELL_STYLE;
      else if (ci === 5) cell.style = CENTER_CELL_STYLE;
      else cell.style = CELL_STYLE;
    });
    r++;
  });

  const f0 = r + 1;
  sheet.mergeCells(f0, 1, f0, 4);
  sheet.getCell(f0, 1).value = "Paid\n\nUnpaid";
  sheet.getCell(f0, 1).style = {
    ...CELL_STYLE,
    alignment: { vertical: "top" as const, wrapText: true },
  };

  sheet.mergeCells(f0, 5, f0, COLS);
  sheet.getCell(f0, 5).value =
    "Certified that the amount shown in\nColumn No. 14 has been paid to the workman concerned in my presence on\n\n______________________________\n\nPersonal Manager";
  sheet.getCell(f0, 5).style = {
    ...CELL_STYLE,
    alignment: { horizontal: "left" as const, vertical: "top" as const, wrapText: true },
  };

  sheet.columns = Array.from({ length: COLS }, (_, i) => ({
    width:
      i === 1
        ? 20
        : i === 3
          ? 14
          : i === 4 || i === 6
            ? 11
            : i === 18
              ? 14
              : i >= 16
                ? 10
                : 9,
  }));

  await downloadExcel(workbook, `${filePrefix}_${data.calendarYear}.xlsx`);
}
