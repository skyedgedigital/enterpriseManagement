import type { Borders, Fill, Font, Workbook, Worksheet } from "exceljs";
import { MONTHS } from "./constants";

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
