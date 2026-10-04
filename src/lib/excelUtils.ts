import type { Borders, Fill, Font, Workbook, Worksheet } from "exceljs";
import { MONTHS } from "./constants";
import { reportValue, SIGNING, type ReportColumnKind } from './reportPolicy';
import { roundHalfUp2 } from './moneyRounding';

export interface ExcelReportColumn { column: number; kind: ReportColumnKind }

/** Finalize an explicitly declared report table without guessing from numeric identifiers. */
export function finishReportTable(sheet: Worksheet, start: number, end: number, columns: ExcelReportColumn[], totalRow: number, labelColumn = 2): void {
  const total = sheet.getRow(totalRow);
  total.getCell(labelColumn).value = 'Total';
  for (const { column, kind } of columns) {
    const signing = kind === 'signature' || kind === 'initial';
    if (signing) sheet.getColumn(column).width = kind === 'signature' ? SIGNING.excelSignature : SIGNING.excelInitial;
    let sum = 0;
    for (let r = start; r <= end; r++) {
      const row = sheet.getRow(r);
      if (signing) row.height = Math.max(row.height ?? 0, SIGNING.rowHeight);
      const cell = row.getCell(column);
      if (['money', 'wholeMoney', 'rate', 'days'].includes(kind)) {
        const numeric = typeof cell.value === 'number' ? cell.value : typeof cell.value === 'string' && cell.value.trim() !== '' ? Number(cell.value) : NaN;
        if (Number.isFinite(numeric)) { cell.value = reportValue(numeric, kind); sum += cell.value; }
        cell.numFmt = kind === 'wholeMoney' ? '0' : kind === 'days' ? '0.##' : '0.00';
      }
    }
    if (['money', 'wholeMoney', 'days'].includes(kind)) {
      total.getCell(column).value = roundHalfUp2(sum);
      total.getCell(column).numFmt = kind === 'wholeMoney' ? '0' : kind === 'days' ? '0.##' : '0.00';
    } else if (column !== labelColumn) total.getCell(column).value = '';
  }
  total.eachCell({ includeEmpty: true }, cell => { cell.border = THIN_BORDER_DEF; cell.font = { ...BODY_FONT_DEF, bold: true }; });
}

const THIN_BORDER_DEF: Partial<Borders> = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

const HEADER_FILL_DEF: Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFEEF2FF" },
};

const TITLE_FONT_DEF: Partial<Font> = {
  bold: true,
  size: 14,
};

const HEADER_FONT_DEF: Partial<Font> = {
  bold: true,
  size: 11,
};

const BODY_FONT_DEF: Partial<Font> = {
  size: 10,
};

export const TITLE_STYLE = {
  font: TITLE_FONT_DEF,
  alignment: { horizontal: "center" as const, vertical: "middle" as const },
};

export const HEADER_STYLE = {
  font: HEADER_FONT_DEF,
  fill: HEADER_FILL_DEF,
  border: THIN_BORDER_DEF,
  alignment: {
    horizontal: "center" as const,
    vertical: "middle" as const,
    wrapText: true,
  },
};

export const CELL_STYLE = {
  font: BODY_FONT_DEF,
  border: THIN_BORDER_DEF,
  alignment: { vertical: "middle" as const },
};

export const RIGHT_CELL_STYLE = {
  ...CELL_STYLE,
  alignment: { ...CELL_STYLE.alignment, horizontal: "right" as const },
};

export const CENTER_CELL_STYLE = {
  ...CELL_STYLE,
  alignment: { ...CELL_STYLE.alignment, horizontal: "center" as const },
};

export async function downloadExcel(workbook: Workbook, filename: string): Promise<void> {
  const safeFilename = filename.toLowerCase().endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  const bytes = new Uint8Array(buffer);
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeFilename;
  a.click();
  URL.revokeObjectURL(url);
}

export function autoFitColumns(worksheet: Worksheet, min = 10, max = 60): void {
  worksheet.columns.forEach((column) => {
    let width = min;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const raw = cell.value;
      const value =
        typeof raw === "string"
          ? raw
          : typeof raw === "number"
            ? String(raw)
            : raw && typeof raw === "object" && "richText" in raw
              ? (raw.richText ?? []).map((r) => r.text).join("")
              : "";
      width = Math.max(width, value.length + 2);
    });
    column.width = Math.min(max, width);
  });
}

export function applyTableBorders(
  worksheet: Worksheet,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
): void {
  for (let r = startRow; r <= endRow; r += 1) {
    for (let c = startCol; c <= endCol; c += 1) {
      const cell = worksheet.getCell(r, c);
      cell.border = THIN_BORDER_DEF;
    }
  }
}

export function monthLabel(month: number): string {
  return MONTHS.find((m) => m.value === month)?.label ?? String(month);
}

export function reportFileName(prefix: string, month: number, year: number): string {
  const shortMonth = monthLabel(month).slice(0, 3);
  return `${prefix}_${shortMonth}${year}.xlsx`;
}
