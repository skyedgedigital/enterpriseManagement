import { formatMoney2, formatMoneyWhole, roundHalfUp2, roundNearestInteger } from './moneyRounding';

export type ReportColumnKind = 'money' | 'wholeMoney' | 'days' | 'rate' | 'identifier' | 'signature' | 'initial';
export interface ReportColumn {
  key: string;
  kind: ReportColumnKind;
}

export const SIGNING = { pdfSignature: 90, pdfInitial: 60, excelSignature: 24, excelInitial: 16, rowHeight: 32 };

export function reportValue(value: number, kind: ReportColumnKind): number {
  return kind === 'wholeMoney' ? roundNearestInteger(value) : roundHalfUp2(value);
}

export function reportText(value: number, kind: ReportColumnKind): string {
  return kind === 'wholeMoney' ? formatMoneyWhole(value) : kind === 'days' ? String(roundHalfUp2(value)) : formatMoney2(value);
}

/** Sum individually displayed values, never round the raw aggregate. */
export function reportTotals<T>(rows: readonly T[], columns: readonly ReportColumn[]): Record<string, number> {
  return Object.fromEntries(columns.filter(c => ['money', 'wholeMoney', 'days'].includes(c.kind)).map(c => [
    c.key, roundHalfUp2(rows.reduce((sum, row) => sum + reportValue(Number((row as Record<string, unknown>)[c.key] ?? 0), c.kind), 0)),
  ]));
}

/** The 19 physical columns in Form XVII and the arrear register. */
export const wageRegisterColumns: ReportColumn[] = [
  { key: 'serialNo', kind: 'identifier' }, { key: 'employeeName', kind: 'identifier' },
  { key: 'workmanNo', kind: 'identifier' }, { key: 'designation', kind: 'identifier' },
  { key: 'daysWorked', kind: 'days' }, { key: 'units', kind: 'identifier' }, { key: 'payRate', kind: 'rate' },
  ...['basicAmount', 'daAmount', 'overtime', 'otherCash', 'grossWages'].map(key => ({ key, kind: 'money' as const })),
  { key: 'esi', kind: 'wholeMoney' }, { key: 'pf', kind: 'wholeMoney' }, { key: 'otherDeduction', kind: 'money' },
  { key: 'netAmountPaid', kind: 'wholeMoney' }, { key: 'thumb', kind: 'signature' },
  { key: 'initial', kind: 'initial' }, { key: 'sign', kind: 'signature' },
];

export const esiReportColumns: ReportColumn[] = [
  { key: 'slNo', kind: 'identifier' }, { key: 'ipNumber', kind: 'identifier' },
  { key: 'ipName', kind: 'identifier' }, { key: 'daysPaid', kind: 'days' }, { key: 'totalMonthlyWage', kind: 'money' },
];

export const musterColumns: ReportColumn[] = [
  { key: 'serialNo', kind: 'identifier' }, { key: 'name', kind: 'identifier' },
  { key: 'fatherName', kind: 'identifier' }, { key: 'sex', kind: 'identifier' },
  ...Array.from({ length: 31 }, (_, i) => ({ key: `day${i + 1}`, kind: 'identifier' as const })),
  { key: 'totalAttendance', kind: 'days' }, { key: 'remarks', kind: 'identifier' },
];

export const pfReportColumns: ReportColumn[] = [
  { key: 'uan', kind: 'identifier' }, { key: 'employeeName', kind: 'identifier' },
  ...['epfWagesGross', 'epfWages', 'epsWages', 'edliWages'].map(key => ({ key, kind: 'money' as const })),
  { key: 'pf', kind: 'wholeMoney' }, { key: 'epfAmount', kind: 'money' }, { key: 'ppfAmount', kind: 'money' },
  { key: 'ncpDays', kind: 'days' }, { key: 'lastColumn', kind: 'identifier' },
];

export const allowanceColumns: ReportColumn[] = [
  { key: 'slNo', kind: 'identifier' }, { key: 'employeeName', kind: 'identifier' }, { key: 'employeeCode', kind: 'identifier' },
  { key: 'presentDays', kind: 'days' }, { key: 'nh', kind: 'days' },
  ...['hra', 'monthlyMobileAllowance', 'monthlyIncumbentAllowance', 'earnedOtherCash', 'performanceBonus', 'washingAllowance', 'conveyanceAllowance', 'medicalAllowance', 'siteSpecificAllowance', 'otherAllowance', 'grandTotal'].map(key => ({ key, kind: 'money' as const })),
];

export const leavePaymentColumns: ReportColumn[] = [
  { key: 'slNo', kind: 'identifier' }, { key: 'employeeName', kind: 'identifier' },
  { key: 'workmanNo', kind: 'identifier' }, { key: 'designationNature', kind: 'identifier' },
  { key: 'daysLeaveTotal', kind: 'days' }, { key: 'units', kind: 'identifier' }, { key: 'rateTotal', kind: 'rate' },
  ...['sumBasicWages', 'sumDa', 'sumOvertime', 'sumOtherCashPayment', 'sumTotalWages'].map(key => ({ key, kind: 'money' as const })),
  { key: 'sumPf', kind: 'wholeMoney' }, { key: 'sumEsi', kind: 'wholeMoney' }, { key: 'sumOthersDeduction', kind: 'money' },
  { key: 'sumNetPaid', kind: 'wholeMoney' }, { key: 'signature', kind: 'signature' },
  { key: 'initial', kind: 'initial' }, { key: 'remarks', kind: 'identifier' },
];

/** Allocate signing space first and scale the other columns to the remaining paper width. */
export function signingWidths(widths: number[], totalWidth: number, signatures: number[], initials: number[] = []): number[] {
  const signing = new Set([...signatures, ...initials]);
  const reserved = signatures.length * SIGNING.pdfSignature + initials.length * SIGNING.pdfInitial;
  const remaining = widths.reduce((sum, width, i) => sum + (signing.has(i) ? 0 : width), 0);
  return widths.map((width, i) => signatures.includes(i) ? SIGNING.pdfSignature : initials.includes(i) ? SIGNING.pdfInitial : width / remaining * (totalWidth - reserved));
}
