import { Workbook } from "exceljs";

import { CELL_STYLE, HEADER_STYLE, downloadExcel } from "@/lib/excelUtils";

import type { BulkUploadColumn, BulkUploadSheetSpec } from "./types";

export const FIREBASE_ID_HEADER = "Firebase ID";

export interface MasterDataExportConfig<T, C = null> {
  entityName: string;
  fileName: string;
  columns: BulkUploadColumn[];
  additionalSheets?: BulkUploadSheetSpec[];
  mapItemToRow: (item: T, context: C) => Record<string, string>;
  /** Defaults to `(item) => item.id` when items have an `id` field. */
  getItemId?: (item: T) => string;
  /** Used to resolve Firebase ID on supplementary rows (e.g. employee code). */
  getItemLookupKey?: (item: T) => string | undefined;
  /** Build rows for supplementary sheets keyed by sheet name. */
  buildAdditionalSheetRows?: (
    items: T[],
    context: C,
  ) => Record<string, Record<string, string>[]>;
}

export interface ExportMasterDataOptions {
  includeFirebaseId?: boolean;
}

function withFirebaseIdColumn(
  columns: BulkUploadColumn[],
  includeFirebaseId: boolean,
): BulkUploadColumn[] {
  if (!includeFirebaseId) return columns;
  return [
    {
      header: FIREBASE_ID_HEADER,
      required: false,
      example: "abc123firebaseId",
      hint: "Firestore document ID",
    },
    ...columns,
  ];
}

function prependFirebaseId(
  row: Record<string, string>,
  id: string,
  includeFirebaseId: boolean,
): Record<string, string> {
  if (!includeFirebaseId) return row;
  return { [FIREBASE_ID_HEADER]: id, ...row };
}

function defaultGetItemId<T>(item: T): string {
  return String((item as { id: string }).id ?? "");
}

function buildIdLookupMap<T>(
  items: T[],
  getItemId: (item: T) => string,
  getItemLookupKey?: (item: T) => string | undefined,
): Map<string, string> {
  const map = new Map<string, string>();
  if (!getItemLookupKey) return map;
  for (const item of items) {
    const key = getItemLookupKey(item)?.trim().toLowerCase();
    if (key) map.set(key, getItemId(item));
  }
  return map;
}

function addExportSheet(
  workbook: Workbook,
  sheetName: string,
  columns: BulkUploadColumn[],
  rows: Record<string, string>[],
): void {
  const sheet = workbook.addWorksheet(sheetName);
  sheet.addRow(columns.map((col) => col.header));
  sheet.getRow(1).eachCell((cell) => {
    Object.assign(cell, HEADER_STYLE);
  });

  for (const row of rows) {
    const dataRow = sheet.addRow(columns.map((col) => row[col.header] ?? ""));
    dataRow.eachCell((cell) => {
      Object.assign(cell, CELL_STYLE);
    });
  }

  sheet.columns.forEach((column, index) => {
    const header = columns[index]?.header ?? "";
    let maxLen = header.length;
    for (const row of rows) {
      const val = row[columns[index]?.header ?? ""] ?? "";
      maxLen = Math.max(maxLen, val.length);
    }
    column.width = Math.min(40, Math.max(14, maxLen + 2));
  });
}

export async function exportMasterDataToExcel<T, C>(
  items: T[],
  config: MasterDataExportConfig<T, C>,
  context: C,
  options: ExportMasterDataOptions = {},
): Promise<void> {
  const { includeFirebaseId = false } = options;
  const getItemId = config.getItemId ?? defaultGetItemId;
  const workbook = new Workbook();

  const dataRows = items.map((item) =>
    prependFirebaseId(
      config.mapItemToRow(item, context),
      getItemId(item),
      includeFirebaseId,
    ),
  );
  addExportSheet(
    workbook,
    "Data",
    withFirebaseIdColumn(config.columns, includeFirebaseId),
    dataRows,
  );

  if (config.additionalSheets?.length && config.buildAdditionalSheetRows) {
    const sheetRows = config.buildAdditionalSheetRows(items, context);
    const idByLookupKey = buildIdLookupMap(
      items,
      getItemId,
      config.getItemLookupKey,
    );

    for (const spec of config.additionalSheets) {
      const rows = (sheetRows[spec.sheetName] ?? []).map((row) => {
        if (!includeFirebaseId) return row;
        const lookup = row["Employee Code"]?.trim().toLowerCase() ?? "";
        return prependFirebaseId(row, idByLookupKey.get(lookup) ?? "", true);
      });

      addExportSheet(
        workbook,
        spec.sheetName,
        withFirebaseIdColumn(spec.columns, includeFirebaseId),
        rows,
      );
    }
  }

  await downloadExcel(workbook, config.fileName);
}
