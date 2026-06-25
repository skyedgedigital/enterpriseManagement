import { ATTENDANCE_STATUSES } from '@/lib/constants';
import { attendanceService } from '@/services/attendance.service';
import { wagesService } from '@/services/wages.service';
import type {
  Attendance,
  AttendanceDay,
  Designation,
  Employee,
  Wages,
  WorkOrder,
} from '@/types';

import type { BulkUploadColumn, BulkUploadConfig, BulkUploadRowResult } from './types';
import {
  buildDayColumns,
  findByName,
  findEmployeeByCode,
  findWorkOrderByNumber,
  isRowEmpty,
  parseAttendanceStatus,
  parseMonth,
  parseOptionalNumber,
  parseRequiredBool,
  parseRequiredNumber,
  parseYear,
} from './utils';

// ============================================================
// Attendance — wide format (Day 1 … Day 31)
// ============================================================

export interface AttendanceBulkContext {
  employees: Employee[];
  workOrders: WorkOrder[];
}

const attendanceSummaryColumns: BulkUploadColumn[] = [
  {
    header: 'Employee Code',
    required: true,
    example: 'EMP0001',
    hint: 'Must match existing employee code',
  },
  { header: 'Year', required: true, example: '2024' },
  { header: 'Month', required: true, example: '1', hint: '1–12' },
  {
    header: 'Work Order Number',
    required: false,
    example: 'WO-2024-001',
    hint: 'Must match existing work order',
  },
  {
    header: 'Present Days',
    required: false,
    example: '26',
    hint: 'Auto-calculated from Day columns if left blank',
  },
  { header: 'Earned Leaves', required: false, example: '0' },
  { header: 'Casual Leaves', required: false, example: '0' },
  { header: 'Festival Leaves', required: false, example: '0' },
  { header: 'Continuous Weeks', required: false, example: '0' },
  { header: 'Weekly Allowance Days', required: false, example: '0' },
  { header: 'Weekly Allowance Amount', required: false, example: '0' },
];

export const attendanceBulkColumns: BulkUploadColumn[] = [
  ...attendanceSummaryColumns,
  ...buildDayColumns(),
];

function countLeaveDays(days: AttendanceDay[]): {
  presentDays: number;
  earnedLeaves: number;
  casualLeaves: number;
  festivalLeaves: number;
} {
  let presentDays = 0;
  let earnedLeaves = 0;
  let casualLeaves = 0;
  let festivalLeaves = 0;

  for (const d of days) {
    switch (d.status) {
      case 'Present':
        presentDays += 1;
        break;
      case 'Half Day':
        presentDays += 0.5;
        break;
      case 'Earned Leave':
        earnedLeaves += 1;
        break;
      case 'Casual Leave':
        casualLeaves += 1;
        break;
      case 'Festival Leave':
        festivalLeaves += 1;
        break;
      default:
        break;
    }
  }

  return { presentDays, earnedLeaves, casualLeaves, festivalLeaves };
}

function parseAttendanceDays(
  row: Record<string, string>,
  rowIndex: number,
  year: number,
  month: number,
  workOrderId?: string,
): { days: AttendanceDay[]; errors: string[] } {
  const errors: string[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  const days: AttendanceDay[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const raw = row[`Day ${day}`]?.trim() ?? '';
    if (!raw) continue;
    const status = parseAttendanceStatus(raw);
    if (!status) {
      errors.push(
        `Row ${rowIndex}: Day ${day} has invalid status "${raw}". Use: ${ATTENDANCE_STATUSES.join(', ')}`,
      );
      continue;
    }
    const entry: AttendanceDay = { day, status };
    if (workOrderId) entry.workOrderHr = workOrderId;
    days.push(entry);
  }

  return { days, errors };
}

function validateAttendanceRow(
  row: Record<string, string>,
  rowIndex: number,
  context: AttendanceBulkContext,
): BulkUploadRowResult<Omit<Attendance, 'id'>> {
  const result: BulkUploadRowResult<Omit<Attendance, 'id'>> = {
    rowIndex,
    errors: [],
  };
  if (isRowEmpty(row, attendanceBulkColumns)) return result;

  const code = row['Employee Code'].trim();
  if (!code) {
    result.errors.push('Employee Code is required');
    return result;
  }

  const employee = findEmployeeByCode(context.employees, code);
  if (!employee) {
    result.errors.push(`Employee "${code}" not found`);
    return result;
  }

  const yearParsed = parseYear(row['Year']);
  if (yearParsed.error) result.errors.push(yearParsed.error);
  const monthParsed = parseMonth(row['Month']);
  if (monthParsed.error) result.errors.push(monthParsed.error);

  const woNumber = row['Work Order Number'].trim();
  let workOrderId: string | undefined;
  if (woNumber) {
    const wo = findWorkOrderByNumber(context.workOrders, woNumber);
    if (!wo) {
      result.errors.push(`Work Order "${woNumber}" not found`);
    } else {
      workOrderId = wo.id;
    }
  }

  if (result.errors.length > 0 || yearParsed.value == null || monthParsed.value == null) {
    return result;
  }

  const { days, errors: dayErrors } = parseAttendanceDays(
    row,
    rowIndex,
    yearParsed.value,
    monthParsed.value,
    workOrderId,
  );
  result.errors.push(...dayErrors);

  const computed = countLeaveDays(days);
  const presentRaw = row['Present Days'].trim();
  const presentDays = presentRaw
    ? parseOptionalNumber(presentRaw) ?? computed.presentDays
    : computed.presentDays;

  if (result.errors.length > 0) return result;

  result.data = {
    employee: employee.id,
    year: yearParsed.value,
    month: monthParsed.value,
    days,
    presentDays,
    earnedLeaves: parseOptionalNumber(row['Earned Leaves']) ?? computed.earnedLeaves,
    casualLeaves: parseOptionalNumber(row['Casual Leaves']) ?? computed.casualLeaves,
    festivalLeaves: parseOptionalNumber(row['Festival Leaves']) ?? computed.festivalLeaves,
    continuousWeeks: parseOptionalNumber(row['Continuous Weeks']),
    weeklyAllowanceDays: parseOptionalNumber(row['Weekly Allowance Days']),
    weeklyAllowanceAmount: parseOptionalNumber(row['Weekly Allowance Amount']),
    workOrderHr: workOrderId,
  };
  return result;
}

export function createAttendanceBulkConfig(): BulkUploadConfig<
  Omit<Attendance, 'id'>,
  AttendanceBulkContext
> {
  return {
    entityName: 'Attendance',
    templateFileName: 'Attendance_Bulk_Upload_Template.xlsx',
    columns: attendanceBulkColumns,
    validateRow: (row, rowIndex, ctx) =>
      validateAttendanceRow(row, rowIndex, ctx),
    async importRows(rows) {
      const result = await attendanceService.createMany(rows);
      return {
        success: result.success,
        failed: rows.length - result.success,
        errors: result.errors,
      };
    },
  };
}

// ============================================================
// Wages
// ============================================================

export interface WagesBulkContext {
  employees: Employee[];
  designations: Designation[];
  workOrders: WorkOrder[];
}

export const wagesBulkColumns: BulkUploadColumn[] = [
  {
    header: 'Employee Code',
    required: true,
    example: 'EMP0001',
    hint: 'Must match existing employee code',
  },
  { header: 'Year', required: true, example: '2024' },
  { header: 'Month', required: true, example: '1', hint: '1–12' },
  {
    header: 'Designation',
    required: true,
    example: 'Helper',
    hint: 'Must match existing designation name',
  },
  {
    header: 'Work Order Number',
    required: false,
    example: 'WO-2024-001',
    hint: 'Must match existing work order',
  },
  { header: 'Total Working Days', required: true, example: '26' },
  { header: 'Attendance', required: true, example: '24' },
  { header: 'Basic', required: false, example: '8000' },
  { header: 'DA', required: false, example: '2000' },
  { header: 'Pay Rate', required: false, example: '10000' },
  { header: 'Allowances', required: false, example: '500' },
  { header: 'Other Cash', required: false, example: '0' },
  { header: 'Other Cash Description', required: false, example: '' },
  { header: 'Total', required: true, example: '10500' },
  {
    header: 'Incentive Applicable',
    required: false,
    example: 'No',
    hint: 'Yes or No',
  },
  { header: 'Incentive Days', required: false, example: '0' },
  { header: 'Incentive Amount', required: false, example: '0' },
  { header: 'Other Deduction', required: false, example: '0' },
  { header: 'Other Deduction Description', required: false, example: '' },
  { header: 'Advance Deduction', required: false, example: '0' },
  { header: 'Damage Deduction', required: false, example: '0' },
  {
    header: 'Is Advance Deduction',
    required: false,
    example: 'No',
    hint: 'Yes or No',
  },
  {
    header: 'Is Damage Deduction',
    required: false,
    example: 'No',
    hint: 'Yes or No',
  },
  { header: 'Net Amount Paid', required: true, example: '10000' },
];

function validateWagesRow(
  row: Record<string, string>,
  rowIndex: number,
  context: WagesBulkContext,
): BulkUploadRowResult<Omit<Wages, 'id'>> {
  const result: BulkUploadRowResult<Omit<Wages, 'id'>> = {
    rowIndex,
    errors: [],
  };
  if (isRowEmpty(row, wagesBulkColumns)) return result;

  const code = row['Employee Code'].trim();
  if (!code) {
    result.errors.push('Employee Code is required');
    return result;
  }

  const employee = findEmployeeByCode(context.employees, code);
  if (!employee) {
    result.errors.push(`Employee "${code}" not found`);
    return result;
  }

  const yearParsed = parseYear(row['Year']);
  if (yearParsed.error) result.errors.push(yearParsed.error);
  const monthParsed = parseMonth(row['Month']);
  if (monthParsed.error) result.errors.push(monthParsed.error);

  const desigName = row['Designation'].trim();
  const designation = desigName
    ? findByName(context.designations, desigName, (d) => d.designation)
    : undefined;
  if (!desigName) {
    result.errors.push('Designation is required');
  } else if (!designation) {
    result.errors.push(`Designation "${desigName}" not found`);
  }

  const woNumber = row['Work Order Number'].trim();
  let workOrderId: string | undefined;
  if (woNumber) {
    const wo = findWorkOrderByNumber(context.workOrders, woNumber);
    if (!wo) {
      result.errors.push(`Work Order "${woNumber}" not found`);
    } else {
      workOrderId = wo.id;
    }
  }

  const totalWorkingDays = parseRequiredNumber(row['Total Working Days'], 'Total Working Days');
  if (totalWorkingDays.error) result.errors.push(totalWorkingDays.error);
  const attendance = parseRequiredNumber(row['Attendance'], 'Attendance');
  if (attendance.error) result.errors.push(attendance.error);
  const total = parseRequiredNumber(row['Total'], 'Total');
  if (total.error) result.errors.push(total.error);
  const netAmountPaid = parseRequiredNumber(row['Net Amount Paid'], 'Net Amount Paid');
  if (netAmountPaid.error) result.errors.push(netAmountPaid.error);

  let incentiveApplicable: boolean | undefined;
  const incentiveApplicableRaw = row['Incentive Applicable'].trim();
  if (incentiveApplicableRaw) {
    const parsed = parseRequiredBool(incentiveApplicableRaw, 'Incentive Applicable');
    if (parsed.error) result.errors.push(parsed.error);
    else incentiveApplicable = parsed.value;
  }

  let isAdvanceDeduction: boolean | undefined;
  const advanceDedRaw = row['Is Advance Deduction'].trim();
  if (advanceDedRaw) {
    const parsed = parseRequiredBool(advanceDedRaw, 'Is Advance Deduction');
    if (parsed.error) result.errors.push(parsed.error);
    else isAdvanceDeduction = parsed.value;
  }

  let isDamageDeduction: boolean | undefined;
  const damageDedRaw = row['Is Damage Deduction'].trim();
  if (damageDedRaw) {
    const parsed = parseRequiredBool(damageDedRaw, 'Is Damage Deduction');
    if (parsed.error) result.errors.push(parsed.error);
    else isDamageDeduction = parsed.value;
  }

  if (
    result.errors.length > 0 ||
    yearParsed.value == null ||
    monthParsed.value == null ||
    !designation ||
    totalWorkingDays.value == null ||
    attendance.value == null ||
    total.value == null ||
    netAmountPaid.value == null
  ) {
    return result;
  }

  result.data = {
    employee: employee.id,
    designation: designation.id,
    month: monthParsed.value,
    year: yearParsed.value,
    workOrderHr: workOrderId,
    totalWorkingDays: totalWorkingDays.value,
    attendance: attendance.value,
    basic: parseOptionalNumber(row['Basic']),
    da: parseOptionalNumber(row['DA']),
    payRate: parseOptionalNumber(row['Pay Rate']),
    allowances: parseOptionalNumber(row['Allowances']),
    otherCash: parseOptionalNumber(row['Other Cash']),
    otherCashDescription: row['Other Cash Description'] || undefined,
    total: total.value,
    incentiveApplicable,
    incentiveDays: parseOptionalNumber(row['Incentive Days']),
    incentiveAmount: parseOptionalNumber(row['Incentive Amount']),
    otherDeduction: parseOptionalNumber(row['Other Deduction']),
    otherDeductionDescription: row['Other Deduction Description'] || undefined,
    advanceDeduction: parseOptionalNumber(row['Advance Deduction']),
    damageDeduction: parseOptionalNumber(row['Damage Deduction']),
    isAdvanceDeduction,
    isDamageDeduction,
    netAmountPaid: netAmountPaid.value,
  };
  return result;
}

export function createWagesBulkConfig(): BulkUploadConfig<
  Omit<Wages, 'id'>,
  WagesBulkContext
> {
  return {
    entityName: 'Wages',
    templateFileName: 'Wages_Bulk_Upload_Template.xlsx',
    columns: wagesBulkColumns,
    validateRow: (row, rowIndex, ctx) => validateWagesRow(row, rowIndex, ctx),
    async importRows(rows) {
      const result = await wagesService.createMany(rows);
      return {
        success: result.success,
        failed: rows.length - result.success,
        errors: result.errors,
      };
    },
  };
}
