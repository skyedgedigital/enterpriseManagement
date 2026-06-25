export interface BulkUploadColumn {
  header: string;
  required?: boolean;
  example: string;
  hint?: string;
}

/** Optional supplementary sheet in a multi-sheet bulk upload workbook. */
export interface BulkUploadSheetSpec {
  sheetName: string;
  columns: BulkUploadColumn[];
  /** When true, the sheet may be omitted from the uploaded file. */
  optional?: boolean;
  /** Firebase field path — documented on the Instructions sheet. */
  firebaseField?: string;
}

export interface BulkUploadRowResult<T> {
  rowIndex: number;
  data?: T;
  errors: string[];
}

export interface BulkUploadImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export interface BulkUploadConfig<T = unknown, C = unknown> {
  entityName: string;
  templateFileName: string;
  /** Primary sheet columns (sheet name: "Data"). */
  columns: BulkUploadColumn[];
  /** Extra sheets included in the template (e.g. WorkOrderHr, Bonus). */
  additionalSheets?: BulkUploadSheetSpec[];
  validateRow: (
    row: Record<string, string>,
    rowIndex: number,
    context: C,
  ) => BulkUploadRowResult<T>;
  /** When set, validates the full workbook (Data + additional sheets). */
  validateWorkbook?: (
    workbook: Record<string, Record<string, string>[]>,
    context: C,
  ) => BulkUploadRowResult<T>[];
  importRows: (rows: T[], context: C) => Promise<BulkUploadImportResult>;
}
