import {
  BANK_NAMES,
  INDIAN_STATES_AND_UTS,
  MARITAL_STATUS_OPTIONS,
  SEX_OPTIONS,
} from '@/lib/constants';
import { getBankDisplayName, toSanitizedKey } from '@/lib/sanitize';
import {
  bankSchema,
  departmentSchema,
  designationSchema,
  esiLocationSchema,
  siteSchema,
  workOrderSchema,
} from '@/lib/validators';
import { departmentService } from '@/services/department.service';
import { designationService } from '@/services/designation.service';
import { bankService } from '@/services/bank.service';
import { siteService } from '@/services/site.service';
import { esiLocationService } from '@/services/esiLocation.service';
import { employeeService } from '@/services/employee.service';
import { workOrderService } from '@/services/workOrder.service';
import { getNextEmployeeCodes } from '@/services/employeeCode.service';
import type {
  Bank,
  Department,
  Designation,
  Employee,
  EsiLocation,
  Site,
  WorkOrder,
  Bonus,
  Leave,
  DamageRegister,
  AdvanceRegister,
  EmployeeWorkOrder,
} from '@/types';

import type {
  BulkUploadConfig,
  BulkUploadRowResult,
  BulkUploadSheetSpec,
} from './types';
import {
  findByName,
  isRowEmpty,
  parseRequiredBool,
  parseRequiredNumber,
  findWorkOrderByNumber,
} from './utils';

// ============================================================
// Department
// ============================================================

export const departmentBulkConfig: BulkUploadConfig<
  Omit<Department, 'id'>,
  null
> = {
  entityName: 'Departments',
  templateFileName: 'Departments_Bulk_Upload_Template.xlsx',
  columns: [
    {
      header: 'Department Name',
      required: true,
      example: 'Production',
      hint: 'Unique department name',
    },
  ],
  validateRow(row, rowIndex) {
    const result: BulkUploadRowResult<Omit<Department, 'id'>> = {
      rowIndex,
      errors: [],
    };
    if (isRowEmpty(row, departmentBulkConfig.columns)) return result;

    const parsed = departmentSchema.safeParse({ name: row['Department Name'] });
    if (!parsed.success) {
      result.errors.push(
        parsed.error.issues[0]?.message ?? 'Invalid department',
      );
      return result;
    }
    result.data = parsed.data;
    return result;
  },
  async importRows(rows) {
    let success = 0;
    const errors: string[] = [];
    for (const row of rows) {
      try {
        await departmentService.create(row);
        success += 1;
      } catch (err) {
        errors.push(
          err instanceof Error ? err.message : 'Failed to create department',
        );
      }
    }
    return { success, failed: rows.length - success, errors };
  },
};

// ============================================================
// Designation
// ============================================================

export const designationBulkConfig: BulkUploadConfig<
  Omit<Designation, 'id'>,
  null
> = {
  entityName: 'Designations',
  templateFileName: 'Designations_Bulk_Upload_Template.xlsx',
  columns: [
    { header: 'Designation', required: true, example: 'Helper' },
    { header: 'Basic', required: true, example: '8000' },
    { header: 'Old Basic', required: true, example: '7500' },
    { header: 'DA', required: true, example: '2000' },
    { header: 'Old DA', required: true, example: '1800' },
    { header: 'Pay Rate', required: true, example: '10000' },
    { header: 'Basic 2', required: true, example: '8000' },
  ],
  validateRow(row, rowIndex) {
    const result: BulkUploadRowResult<Omit<Designation, 'id'>> = {
      rowIndex,
      errors: [],
    };
    if (isRowEmpty(row, designationBulkConfig.columns)) return result;

    const parsed = designationSchema.safeParse({
      designation: row['Designation'],
      basic: row['Basic'],
      oldBasic: row['Old Basic'],
      da: row['DA'],
      oldDa: row['Old DA'],
      payRate: row['Pay Rate'],
      basic2: row['Basic 2'],
    });
    if (!parsed.success) {
      result.errors.push(
        parsed.error.issues[0]?.message ?? 'Invalid designation',
      );
      return result;
    }
    result.data = parsed.data;
    return result;
  },
  async importRows(rows) {
    let success = 0;
    const errors: string[] = [];
    for (const row of rows) {
      try {
        await designationService.create(row);
        success += 1;
      } catch (err) {
        errors.push(
          err instanceof Error ? err.message : 'Failed to create designation',
        );
      }
    }
    return { success, failed: rows.length - success, errors };
  },
};

// ============================================================
// Bank
// ============================================================

function resolveBankName(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  // validate banke name from uploaded banks later

  // const byDisplay = BANK_NAMES.find(
  //   (name) => name.toLowerCase() === trimmed.toLowerCase(),
  // );
  // if (byDisplay) return toSanitizedKey(byDisplay);
  // const byKey = BANK_NAMES.find(
  //   (name) => toSanitizedKey(name) === trimmed.toLowerCase(),
  // );
  // return byKey ? toSanitizedKey(byKey) : undefined;

  // TODO: remove this if select bank name is implemented
  return trimmed;
}

export const bankBulkConfig: BulkUploadConfig<Omit<Bank, 'id'>, null> = {
  entityName: 'Banks',
  templateFileName: 'Banks_Bulk_Upload_Template.xlsx',
  columns: [
    {
      header: 'Bank Name',
      required: true,
      example: 'State Bank of India',
      hint: `Must match one of the predefined bank names (e.g. ${BANK_NAMES.slice(0, 3).join(', ')}, …)`,
    },
    { header: 'Branch', required: true, example: 'Main Branch' },
    {
      header: 'IFSC',
      required: true,
      example: 'SBIN0001234',
      hint: '11 characters',
    },
  ],
  validateRow(row, rowIndex) {
    const result: BulkUploadRowResult<Omit<Bank, 'id'>> = {
      rowIndex,
      errors: [],
    };
    if (isRowEmpty(row, bankBulkConfig.columns)) return result;

    const bankName = resolveBankName(row['Bank Name']);
    if (!bankName) {
      result.errors.push(
        `Invalid bank name "${row['Bank Name']}". Use exact bank name from master list.`,
      );
      return result;
    }

    const parsed = bankSchema.safeParse({
      name: bankName,
      branch: row['Branch'],
      ifsc: row['IFSC'],
    });
    if (!parsed.success) {
      result.errors.push(parsed.error.issues[0]?.message ?? 'Invalid bank');
      return result;
    }
    result.data = parsed.data;
    return result;
  },
  async importRows(rows) {
    let success = 0;
    const errors: string[] = [];
    for (const row of rows) {
      try {
        await bankService.create(row);
        success += 1;
      } catch (err) {
        errors.push(
          err instanceof Error ? err.message : 'Failed to create bank',
        );
      }
    }
    return { success, failed: rows.length - success, errors };
  },
};

// ============================================================
// Site
// ============================================================

export const siteBulkConfig: BulkUploadConfig<Omit<Site, 'id'>, null> = {
  entityName: 'Sites',
  templateFileName: 'Sites_Bulk_Upload_Template.xlsx',
  columns: [{ header: 'Site Name', required: true, example: 'Plant A' }],
  validateRow(row, rowIndex) {
    const result: BulkUploadRowResult<Omit<Site, 'id'>> = {
      rowIndex,
      errors: [],
    };
    if (isRowEmpty(row, siteBulkConfig.columns)) return result;

    const parsed = siteSchema.safeParse({ name: row['Site Name'] });
    if (!parsed.success) {
      result.errors.push(parsed.error.issues[0]?.message ?? 'Invalid site');
      return result;
    }
    result.data = parsed.data;
    return result;
  },
  async importRows(rows) {
    let success = 0;
    const errors: string[] = [];
    for (const row of rows) {
      try {
        await siteService.create(row);
        success += 1;
      } catch (err) {
        errors.push(
          err instanceof Error ? err.message : 'Failed to create site',
        );
      }
    }
    return { success, failed: rows.length - success, errors };
  },
};

// ============================================================
// ESI Location
// ============================================================

export const esiLocationBulkConfig: BulkUploadConfig<
  Omit<EsiLocation, 'id'>,
  null
> = {
  entityName: 'ESI Locations',
  templateFileName: 'ESI_Locations_Bulk_Upload_Template.xlsx',
  columns: [
    { header: 'Name', required: true, example: 'ESI Office Pune' },
    { header: 'Address', required: true, example: '123 MG Road, Pune' },
    { header: 'ESI No', required: true, example: '1234567890' },
    { header: 'Branch', required: true, example: 'Pune' },
  ],
  validateRow(row, rowIndex) {
    const result: BulkUploadRowResult<Omit<EsiLocation, 'id'>> = {
      rowIndex,
      errors: [],
    };
    if (isRowEmpty(row, esiLocationBulkConfig.columns)) return result;

    const parsed = esiLocationSchema.safeParse({
      name: row['Name'],
      address: row['Address'],
      esiNo: row['ESI No'],
      branch: row['Branch'],
    });
    if (!parsed.success) {
      result.errors.push(
        parsed.error.issues[0]?.message ?? 'Invalid ESI location',
      );
      return result;
    }
    result.data = parsed.data;
    return result;
  },
  async importRows(rows) {
    let success = 0;
    const errors: string[] = [];
    for (const row of rows) {
      try {
        await esiLocationService.create(row);
        success += 1;
      } catch (err) {
        errors.push(
          err instanceof Error ? err.message : 'Failed to create ESI location',
        );
      }
    }
    return { success, failed: rows.length - success, errors };
  },
};

// ============================================================
// Employee
// ============================================================

export interface EmployeeBulkContext {
  departments: Department[];
  designations: Designation[];
  sites: Site[];
  banks: Bank[];
  esiLocations: EsiLocation[];
  workOrders: WorkOrder[];
}

export const employeeAdditionalSheets: BulkUploadSheetSpec[] = [
  {
    sheetName: 'WorkOrderHr',
    firebaseField: 'employee.workOrderHr[]',
    optional: true,
    columns: [
      {
        header: 'Employee Code',
        required: true,
        example: 'EMP0001',
        hint: 'Must match Data sheet Employee Code',
      },
      {
        header: 'Period',
        required: true,
        example: '01-2024',
        hint: 'Format: MM-YYYY',
      },
      {
        header: 'Work Order Number',
        required: true,
        example: 'WO-2024-001',
        hint: 'Must match existing work order',
      },
      {
        header: 'Work Order Atten',
        required: false,
        example: '0',
        hint: 'Attendance days under this work order',
      },
    ],
  },
  {
    sheetName: 'Bonus',
    firebaseField: 'employee.bonus[]',
    optional: true,
    columns: [
      { header: 'Employee Code', required: true, example: 'EMP0001' },
      { header: 'Year', required: true, example: '2023' },
      {
        header: 'Paid',
        required: true,
        example: 'Yes',
        hint: 'Yes or No',
      },
    ],
  },
  {
    sheetName: 'Leave',
    firebaseField: 'employee.leave[]',
    optional: true,
    columns: [
      { header: 'Employee Code', required: true, example: 'EMP0001' },
      { header: 'Year', required: true, example: '2023' },
      {
        header: 'Encashed',
        required: true,
        example: 'No',
        hint: 'Yes or No',
      },
    ],
  },
  {
    sheetName: 'DamageRegister',
    firebaseField: 'employee.damageRegister[]',
    optional: true,
    columns: [
      { header: 'Employee Code', required: true, example: 'EMP0001' },
      { header: 'Particulars', required: true, example: 'Broken equipment' },
      {
        header: 'Date',
        required: true,
        example: '2024-03-15',
        hint: 'YYYY-MM-DD',
      },
      {
        header: 'Show Cause',
        required: true,
        example: 'Yes',
        hint: 'Yes or No',
      },
      { header: 'Person', required: true, example: 'Supervisor Name' },
      { header: 'Amount', required: true, example: '500' },
      { header: 'Installments', required: false, example: '1' },
      { header: 'Installments Left', required: false, example: '1' },
      { header: 'Remarks', required: false, example: '' },
    ],
  },
  {
    sheetName: 'AdvanceRegister',
    firebaseField: 'employee.advanceRegister[]',
    optional: true,
    columns: [
      { header: 'Employee Code', required: true, example: 'EMP0001' },
      { header: 'Amount', required: true, example: '2000' },
      {
        header: 'Date',
        required: true,
        example: '2024-02-01',
        hint: 'YYYY-MM-DD',
      },
      { header: 'Purpose', required: true, example: 'Medical emergency' },
      { header: 'Installments', required: false, example: '2' },
      { header: 'Installments Left', required: false, example: '2' },
      { header: 'Remarks', required: false, example: '' },
    ],
  },
];

export const employeeBulkColumns = [
  {
    header: 'Employee Code',
    required: false,
    example: '',
    hint: 'Leave blank for auto-generated code (EMP0001, …)',
  },
  { header: 'Workman No', required: false, example: 'WM001' },
  { header: 'Full Name', required: true, example: 'Ramesh Kumar' },
  { header: "Father's Name", required: false, example: 'Suresh Kumar' },
  {
    header: 'Gender',
    required: false,
    example: 'Male',
    hint: `One of: ${SEX_OPTIONS.join(', ')}`,
  },
  {
    header: 'Date of Birth',
    required: false,
    example: '1990-05-15',
    hint: 'YYYY-MM-DD',
  },
  {
    header: 'Marital Status',
    required: false,
    example: 'Married',
    hint: `One of: ${MARITAL_STATUS_OPTIONS.join(', ')}`,
  },
  { header: 'Address', required: false, example: '123 Main Street, Pune' },
  { header: 'Landline', required: false, example: '0201234567' },
  { header: 'Mobile', required: false, example: '9876543210' },
  { header: 'Aadhaar Number', required: false, example: '123456789012' },
  {
    header: 'Department',
    required: false,
    example: 'Production',
    hint: 'Must match existing department name',
  },
  {
    header: 'Site',
    required: false,
    example: 'Plant A',
    hint: 'Must match existing site name',
  },
  {
    header: 'Designation',
    required: false,
    example: 'Helper',
    hint: 'Must match existing designation name',
  },
  {
    header: 'Working Status',
    required: false,
    example: 'Yes',
    hint: 'Yes or No (default: Yes)',
  },
  {
    header: 'Appointment Date',
    required: false,
    example: '2024-01-01',
    hint: 'YYYY-MM-DD',
  },
  { header: 'Resign Date', required: false, example: '', hint: 'YYYY-MM-DD' },
  {
    header: 'Bank Name',
    required: false,
    example: 'State Bank of India',
    hint: 'Must match existing bank',
  },
  { header: 'Bank Branch', required: false, example: 'Main Branch' },
  { header: 'Bank IFSC', required: false, example: 'SBIN0001234' },
  { header: 'Account Number', required: false, example: '123456789012' },
  {
    header: 'PF Applicable',
    required: false,
    example: 'Yes',
    hint: 'Yes or No',
  },
  { header: 'PF Number', required: false, example: 'MH/12345/0001234' },
  { header: 'UAN', required: false, example: '123456789012' },
  {
    header: 'ESIC Applicable',
    required: false,
    example: 'No',
    hint: 'Yes or No',
  },
  { header: 'ESIC Number', required: false, example: '' },
  {
    header: 'ESI Location',
    required: false,
    example: 'ESI Office Pune',
    hint: 'Must match existing ESI location name',
  },
  { header: 'Basic', required: false, example: '8000' },
  { header: 'DA', required: false, example: '2000' },
  { header: 'Pay Rate', required: false, example: '10000' },
  { header: 'HRA', required: false, example: '1500' },
  { header: 'CA', required: false, example: '500' },
  { header: 'Food', required: false, example: '300' },
  { header: 'Incentives', required: false, example: '0' },
  { header: 'Uniform', required: false, example: '200' },
  { header: 'Medical', required: false, example: '500' },
  { header: 'Loan', required: false, example: '0' },
  { header: 'LIC', required: false, example: '0' },
  { header: 'Old Basic', required: false, example: '7500' },
  { header: 'Old DA', required: false, example: '1800' },
  {
    header: 'Attendance Allowance',
    required: false,
    example: 'No',
    hint: 'Yes or No',
  },
  { header: 'Safety Pass Number', required: false, example: 'SP001' },
  {
    header: 'Safety Pass Validity',
    required: false,
    example: '2025-12-31',
    hint: 'YYYY-MM-DD',
  },
  {
    header: 'Police Verification Validity',
    required: false,
    example: '2025-06-30',
    hint: 'YYYY-MM-DD',
  },
  { header: 'Gate Pass Number', required: false, example: 'GP001' },
  {
    header: 'Gate Pass Valid Till',
    required: false,
    example: '2025-12-31',
    hint: 'YYYY-MM-DD',
  },
];

/** resolve bank id from bank name, branch and ifsc */
function resolveBankId(
  context: EmployeeBulkContext,
  bankName: string,
  branch: string,
  ifsc: string,
): string | undefined {
  if (!bankName.trim() && !branch.trim() && !ifsc.trim()) return undefined;
  if (!bankName.trim() || !branch.trim() || !ifsc.trim()) return undefined;

  const sanitized = resolveBankName(bankName);
  if (!sanitized) return undefined;

  const match = context.banks.find(
    (b) =>
      b.name === sanitized &&
      b.branch.trim().toLowerCase() === branch.trim().toLowerCase() &&
      b.ifsc.trim().toUpperCase() === ifsc.trim().toUpperCase(),
  );
  return match?.id;
}

/** validate employee row before importing by checking if all the fields are valid */
function validateEmployeeRow(
  row: Record<string, string>,
  rowIndex: number,
  context: EmployeeBulkContext,
): BulkUploadRowResult<Omit<Employee, 'id'>> {
  const result: BulkUploadRowResult<Omit<Employee, 'id'>> = {
    rowIndex,
    errors: [],
  };
  if (isRowEmpty(row, employeeBulkColumns)) return result;

  const fullName = row['Full Name'].trim();
  if (!fullName) {
    result.errors.push('Full Name is required');
  }

  const code = row['Employee Code'].trim();
  const gender = row['Gender'].trim();
  if (gender && !SEX_OPTIONS.includes(gender as (typeof SEX_OPTIONS)[number])) {
    result.errors.push(`Gender must be one of: ${SEX_OPTIONS.join(', ')}`);
  }

  /** validate marital status */
  const marital = row['Marital Status'].trim();
  if (
    marital &&
    !MARITAL_STATUS_OPTIONS.includes(
      marital as (typeof MARITAL_STATUS_OPTIONS)[number],
    )
  ) {
    result.errors.push(
      `Marital Status must be one of: ${MARITAL_STATUS_OPTIONS.join(', ')}`,
    );
  }

  /** validate working status */
  const workingStatusRaw = row['Working Status'].trim();
  let workingStatus = true;
  if (workingStatusRaw) {
    const parsed = parseRequiredBool(workingStatusRaw, 'Working Status');
    if (parsed.error) result.errors.push(parsed.error);
    else if (parsed.value !== undefined) workingStatus = parsed.value;
  }

  /** validate pf applicable */
  const pfApplicableRaw = row['PF Applicable'].trim();
  let pfApplicable: boolean | undefined;
  if (pfApplicableRaw) {
    const parsed = parseRequiredBool(pfApplicableRaw, 'PF Applicable');
    if (parsed.error) result.errors.push(parsed.error);
    else pfApplicable = parsed.value;
  }

  /** validate esic applicable */
  const esicApplicableRaw = row['ESIC Applicable'].trim();
  let esicApplicable: boolean | undefined;
  if (esicApplicableRaw) {
    const parsed = parseRequiredBool(esicApplicableRaw, 'ESIC Applicable');
    if (parsed.error) result.errors.push(parsed.error);
    else esicApplicable = parsed.value;
  }

  /** validate attendance allowance */
  const attendanceAllowanceRaw = row['Attendance Allowance'].trim();
  let attendanceAllowance: boolean | undefined;
  if (attendanceAllowanceRaw) {
    const parsed = parseRequiredBool(
      attendanceAllowanceRaw,
      'Attendance Allowance',
    );
    if (parsed.error) result.errors.push(parsed.error);
    else attendanceAllowance = parsed.value;
  }

  /** check if department exists in master data */
  const deptName = row['Department'].trim();
  const department = deptName
    ? findByName(context.departments, deptName, (d) => d.name)
    : undefined;
  if (deptName && !department) {
    result.errors.push(
      `Department "${deptName}" not found. Create it in Master Data first.`,
    );
  }

  /** check if site exists in master data */
  const siteName = row['Site'].trim();
  const site = siteName
    ? findByName(context.sites, siteName, (s) => s.name)
    : undefined;
  if (siteName && !site) {
    result.errors.push(
      `Site "${siteName}" not found. Create it in Master Data first.`,
    );
  }

  /** check if designation exists in master data */
  const desigName = row['Designation'].trim();
  const designation = desigName
    ? findByName(context.designations, desigName, (d) => d.designation)
    : undefined;
  if (desigName && !designation) {
    result.errors.push(
      `Designation "${desigName}" not found. Create it in Master Data first.`,
    );
  }

  const bankId = resolveBankId(
    context,
    row['Bank Name'],
    row['Bank Branch'],
    row['Bank IFSC'],
  );
  const hasBankFields =
    row['Bank Name'].trim() ||
    row['Bank Branch'].trim() ||
    row['Bank IFSC'].trim();
  if (hasBankFields && !bankId) {
    result.errors.push(
      `Bank "${row['Bank Name']}" / ${row['Bank Branch']} / ${row['Bank IFSC']} not found. Add bank in Master Data first.`,
    );
  }

  const esiName = row['ESI Location'].trim();
  const esiLocation = esiName
    ? findByName(context.esiLocations, esiName, (e) => e.name)
    : undefined;
  if (esiName && !esiLocation) {
    result.errors.push(
      `ESI Location "${esiName}" not found. Create it in Master Data first.`,
    );
  }

  if (result.errors.length > 0) return result;

  result.data = {
    code: code || '',
    workManNo: row['Workman No'] || undefined,
    name: fullName || undefined,
    fathersName: row["Father's Name"] || undefined,
    sex: gender ? (gender as Employee['sex']) : undefined,
    dob: row['Date of Birth'] || undefined,
    maritalStatus: marital ? (marital as Employee['maritalStatus']) : undefined,
    address: row['Address'] || undefined,
    landlineNumber: row['Landline'] || undefined,
    mobileNumber: row['Mobile'] || undefined,
    adhaarNumber: row['Aadhaar Number'] || undefined,
    department: department?.id,
    site: site?.id,
    designation: designation?.id,
    workingStatus,
    appointmentDate: row['Appointment Date'] || undefined,
    resignDate: row['Resign Date'] || undefined,
    bank: bankId,
    accountNumber: row['Account Number'] || undefined,
    pfApplicable,
    pfNo: row['PF Number'] || undefined,
    uan: row['UAN'] || undefined,
    esicApplicable,
    esicNo: row['ESIC Number'] || undefined,
    esiLocation: esiLocation?.id,
    basic: row['Basic'] || undefined,
    da: row['DA'] || undefined,
    payRate: row['Pay Rate'] || undefined,
    hra: row['HRA'] || undefined,
    ca: row['CA'] || undefined,
    food: row['Food'] || undefined,
    incentives: row['Incentives'] || undefined,
    uniform: row['Uniform'] || undefined,
    medical: row['Medical'] || undefined,
    loan: row['Loan'] || undefined,
    lic: row['LIC'] || undefined,
    oldBasic: row['Old Basic'] || undefined,
    oldDa: row['Old DA'] || undefined,
    attendanceAllowance,
    safetyPassNumber: row['Safety Pass Number'] || undefined,
    spValidity: row['Safety Pass Validity'] || undefined,
    policeVerificationValidityDate:
      row['Police Verification Validity'] || undefined,
    gatePassNumber: row['Gate Pass Number'] || undefined,
    gatePassValidTill: row['Gate Pass Valid Till'] || undefined,
    bonus: [],
    leave: [],
    damageRegister: [],
    advanceRegister: [],
    workOrderHr: [],
  };
  return result;
}

type EmployeeEmbeddedMaps = {
  workOrderHr: Map<string, EmployeeWorkOrder[]>;
  bonus: Map<string, Bonus[]>;
  leave: Map<string, Leave[]>;
  damageRegister: Map<string, DamageRegister[]>;
  advanceRegister: Map<string, AdvanceRegister[]>;
};

function parseEmployeeEmbeddedSheets(
  workbook: Record<string, Record<string, string>[]>,
  context: EmployeeBulkContext,
): {
  maps: EmployeeEmbeddedMaps;
  errors: BulkUploadRowResult<Omit<Employee, 'id'>>[];
} {
  const maps: EmployeeEmbeddedMaps = {
    workOrderHr: new Map(),
    bonus: new Map(),
    leave: new Map(),
    damageRegister: new Map(),
    advanceRegister: new Map(),
  };
  const errors: BulkUploadRowResult<Omit<Employee, 'id'>>[] = [];

  const pushToMap = <T>(map: Map<string, T[]>, code: string, item: T): void => {
    const key = code.trim().toLowerCase();
    const existing = map.get(key) ?? [];
    existing.push(item);
    map.set(key, existing);
  };

  for (const [rowIndex, row] of (workbook['WorkOrderHr'] ?? []).entries()) {
    const sheetRow = rowIndex + 2;
    const code = row['Employee Code'].trim();
    if (!code) continue;
    const rowErrors: string[] = [];
    const period = row['Period'].trim();
    if (!period) rowErrors.push('Period is required');
    const woNumber = row['Work Order Number'].trim();
    if (!woNumber) rowErrors.push('Work Order Number is required');
    const wo = woNumber
      ? findWorkOrderByNumber(context.workOrders, woNumber)
      : undefined;
    if (woNumber && !wo) {
      rowErrors.push(`Work Order "${woNumber}" not found`);
    }
    const attenParsed = parseRequiredNumber(
      row['Work Order Atten'] || '0',
      'Work Order Atten',
    );
    if (attenParsed.error) rowErrors.push(attenParsed.error);
    if (rowErrors.length > 0 || !wo || attenParsed.value == null) {
      errors.push({
        rowIndex: sheetRow,
        errors: [`WorkOrderHr row ${sheetRow}: ${rowErrors.join('; ')}`],
      });
      continue;
    }
    pushToMap(maps.workOrderHr, code, {
      period,
      workOrderHr: wo.id,
      workOrderAtten: attenParsed.value,
    });
  }

  for (const [rowIndex, row] of (workbook['Bonus'] ?? []).entries()) {
    const sheetRow = rowIndex + 2;
    const code = row['Employee Code'].trim();
    if (!code) continue;
    const rowErrors: string[] = [];
    const yearParsed = parseRequiredNumber(row['Year'], 'Year');
    if (yearParsed.error) rowErrors.push(yearParsed.error);
    const paidParsed = parseRequiredBool(row['Paid'], 'Paid');
    if (paidParsed.error) rowErrors.push(paidParsed.error);
    if (
      rowErrors.length > 0 ||
      yearParsed.value == null ||
      paidParsed.value == null
    ) {
      errors.push({
        rowIndex: sheetRow,
        errors: [`Bonus row ${sheetRow}: ${rowErrors.join('; ')}`],
      });
      continue;
    }
    pushToMap(maps.bonus, code, {
      year: yearParsed.value,
      status: paidParsed.value,
    });
  }

  for (const [rowIndex, row] of (workbook['Leave'] ?? []).entries()) {
    const sheetRow = rowIndex + 2;
    const code = row['Employee Code'].trim();
    if (!code) continue;
    const rowErrors: string[] = [];
    const yearParsed = parseRequiredNumber(row['Year'], 'Year');
    if (yearParsed.error) rowErrors.push(yearParsed.error);
    const encashedParsed = parseRequiredBool(row['Encashed'], 'Encashed');
    if (encashedParsed.error) rowErrors.push(encashedParsed.error);
    if (
      rowErrors.length > 0 ||
      yearParsed.value == null ||
      encashedParsed.value == null
    ) {
      errors.push({
        rowIndex: sheetRow,
        errors: [`Leave row ${sheetRow}: ${rowErrors.join('; ')}`],
      });
      continue;
    }
    pushToMap(maps.leave, code, {
      year: yearParsed.value,
      status: encashedParsed.value,
    });
  }

  for (const [rowIndex, row] of (workbook['DamageRegister'] ?? []).entries()) {
    const sheetRow = rowIndex + 2;
    const code = row['Employee Code'].trim();
    if (!code) continue;
    const rowErrors: string[] = [];
    const particulars = row['Particulars'].trim();
    if (!particulars) rowErrors.push('Particulars is required');
    const date = row['Date'].trim();
    if (!date) rowErrors.push('Date is required');
    const showCauseParsed = parseRequiredBool(row['Show Cause'], 'Show Cause');
    if (showCauseParsed.error) rowErrors.push(showCauseParsed.error);
    const person = row['Person'].trim();
    if (!person) rowErrors.push('Person is required');
    const amountParsed = parseRequiredNumber(row['Amount'], 'Amount');
    if (amountParsed.error) rowErrors.push(amountParsed.error);
    const installments = Number(row['Installments'] || '1') || 1;
    const installmentsLeft =
      Number(row['Installments Left'] || String(installments)) || installments;
    if (
      rowErrors.length > 0 ||
      amountParsed.value == null ||
      showCauseParsed.value == null
    ) {
      errors.push({
        rowIndex: sheetRow,
        errors: [`DamageRegister row ${sheetRow}: ${rowErrors.join('; ')}`],
      });
      continue;
    }
    pushToMap(maps.damageRegister, code, {
      particularsOfDamageOrLoss: particulars,
      dateOfDamageOrLoss: date,
      didWorkmanShowCause: showCauseParsed.value,
      personWhoHeardExplanation: person,
      amountOfDeductionImposed: amountParsed.value,
      numberOfInstallments: installments,
      installmentsLeft,
      remarks: row['Remarks'] || undefined,
    });
  }

  for (const [rowIndex, row] of (workbook['AdvanceRegister'] ?? []).entries()) {
    const sheetRow = rowIndex + 2;
    const code = row['Employee Code'].trim();
    if (!code) continue;
    const rowErrors: string[] = [];
    const amountParsed = parseRequiredNumber(row['Amount'], 'Amount');
    if (amountParsed.error) rowErrors.push(amountParsed.error);
    const date = row['Date'].trim();
    if (!date) rowErrors.push('Date is required');
    const purpose = row['Purpose'].trim();
    if (!purpose) rowErrors.push('Purpose is required');
    const installments = Number(row['Installments'] || '1') || 1;
    const installmentsLeft =
      Number(row['Installments Left'] || String(installments)) || installments;
    if (rowErrors.length > 0 || amountParsed.value == null) {
      errors.push({
        rowIndex: sheetRow,
        errors: [`AdvanceRegister row ${sheetRow}: ${rowErrors.join('; ')}`],
      });
      continue;
    }
    pushToMap(maps.advanceRegister, code, {
      amountOfAdvanceGiven: amountParsed.value,
      dateOfAdvanceGiven: date,
      purposeOfAdvanceGiven: purpose,
      numberOfInstallments: installments,
      installmentsLeft,
      remarks: row['Remarks'] || undefined,
    });
  }

  return { maps, errors };
}

function validateEmployeeWorkbook(
  workbook: Record<string, Record<string, string>[]>,
  context: EmployeeBulkContext,
): BulkUploadRowResult<Omit<Employee, 'id'>>[] {
  const dataRows = workbook['Data'] ?? [];
  const { maps, errors: sheetErrors } = parseEmployeeEmbeddedSheets(
    workbook,
    context,
  );

  const results = dataRows.map((row, index) => {
    const result = validateEmployeeRow(row, index + 2, context);
    if (result.data) {
      const codeKey = (
        result.data.code || row['Employee Code'].trim()
      ).toLowerCase();
      if (codeKey) {
        result.data.workOrderHr = maps.workOrderHr.get(codeKey) ?? [];
        result.data.bonus = maps.bonus.get(codeKey) ?? [];
        result.data.leave = maps.leave.get(codeKey) ?? [];
        result.data.damageRegister = maps.damageRegister.get(codeKey) ?? [];
        result.data.advanceRegister = maps.advanceRegister.get(codeKey) ?? [];
      }
    }
    return result;
  });

  return [...results, ...sheetErrors];
}

export function createEmployeeBulkConfig(): BulkUploadConfig<
  Omit<Employee, 'id'>,
  EmployeeBulkContext
> {
  return {
    entityName: 'Employees',
    templateFileName: 'Employees_Bulk_Upload_Template.xlsx',
    columns: employeeBulkColumns,
    additionalSheets: employeeAdditionalSheets,
    validateRow: (row, rowIndex, ctx) =>
      validateEmployeeRow(row, rowIndex, ctx),
    validateWorkbook: (workbook, ctx) =>
      validateEmployeeWorkbook(workbook, ctx),
    async importRows(rows) {
      const errors: string[] = [];
      const existingCodes = new Set(
        (await employeeService.getAll()).map((e) => e.code.trim().toLowerCase()),
      );

      const needsAutoCode = rows.filter((r) => !r.code?.trim());
      const autoCodes =
        needsAutoCode.length > 0
          ? await getNextEmployeeCodes(needsAutoCode.length)
          : [];
      let autoCodeIndex = 0;

      const prepared: Omit<Employee, 'id'>[] = [];
      const seenCodes = new Set<string>();

      for (const row of rows) {
        let code = row.code?.trim() ?? '';
        if (!code) {
          code = autoCodes[autoCodeIndex] ?? '';
          autoCodeIndex += 1;
        }
        if (!code) {
          errors.push('Could not assign employee code');
          continue;
        }

        const codeKey = code.toLowerCase();
        if (existingCodes.has(codeKey)) {
          errors.push(`Employee code "${code}" already exists`);
          continue;
        }
        if (seenCodes.has(codeKey)) {
          errors.push(`Duplicate employee code "${code}" in upload file`);
          continue;
        }

        seenCodes.add(codeKey);
        prepared.push({ ...row, code });
      }

      if (prepared.length === 0) {
        return { success: 0, failed: rows.length, errors };
      }

      const result = await employeeService.createMany(prepared);
      return {
        success: result.success,
        failed: rows.length - result.success,
        errors: [...errors, ...result.errors],
      };
    },
  };
}

/** Helper for bank template hint — exported for UI if needed */
export { getBankDisplayName };

// ============================================================
// Work Order
// ============================================================

export interface WorkOrderBulkContext {
  departments: Department[];
}

function resolveState(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const byDisplay = INDIAN_STATES_AND_UTS.find(
    (s) => s.toLowerCase() === trimmed.toLowerCase(),
  );
  if (byDisplay) return toSanitizedKey(byDisplay);
  const byKey = INDIAN_STATES_AND_UTS.find(
    (s) => toSanitizedKey(s) === trimmed.toLowerCase(),
  );
  return byKey ? toSanitizedKey(byKey) : undefined;
}

export const workOrderBulkColumns = [
  { header: 'Work Order Number', required: true, example: 'WO-2024-001' },
  {
    header: 'Date',
    required: false,
    example: '2024-01-15',
    hint: 'YYYY-MM-DD',
  },
  {
    header: 'Department',
    required: false,
    example: 'Production',
    hint: 'Must match existing department name',
  },
  { header: 'Section', required: false, example: 'Section A' },
  {
    header: 'Valid From',
    required: false,
    example: '2024-01-01',
    hint: 'YYYY-MM-DD',
  },
  {
    header: 'Valid To',
    required: false,
    example: '2024-12-31',
    hint: 'YYYY-MM-DD',
  },
  {
    header: 'Lapse Till',
    required: false,
    example: '2025-01-31',
    hint: 'YYYY-MM-DD',
  },
  {
    header: 'State',
    required: false,
    example: 'Maharashtra',
    hint: `Indian state name (e.g. ${INDIAN_STATES_AND_UTS.slice(0, 3).join(', ')}, …)`,
  },
  {
    header: 'New PF Applicable',
    required: false,
    example: 'No',
    hint: 'Yes or No — Yes = PF capped at 15k',
  },
  {
    header: 'Job Description',
    required: false,
    example: 'Maintenance work at site',
  },
  {
    header: 'Order Description',
    required: false,
    example: 'Annual maintenance contract',
  },
];

function validateWorkOrderRow(
  row: Record<string, string>,
  rowIndex: number,
  _context: WorkOrderBulkContext,
): BulkUploadRowResult<Omit<WorkOrder, 'id'>> {
  const result: BulkUploadRowResult<Omit<WorkOrder, 'id'>> = {
    rowIndex,
    errors: [],
  };
  if (isRowEmpty(row, workOrderBulkColumns)) return result;

  const woNumber = row['Work Order Number'].trim();
  if (!woNumber) {
    result.errors.push('Work Order Number is required');
    return result;
  }

  // Check if department exists in master data

  // const deptName = row['Department'].trim();
  // const department = deptName
  //   ? findByName(context.departments, deptName, (d) => d.name)
  //   : undefined;
  // if (deptName && !department) {
  //   result.errors.push(`Department "${deptName}" not found. Create it in Master Data first.`);
  // }

  const stateRaw = row['State'].trim();
  const state = stateRaw ? resolveState(stateRaw) : undefined;
  if (stateRaw && !state) {
    result.errors.push(
      `State "${stateRaw}" is invalid. Use full state name (e.g. Maharashtra).`,
    );
  }

  const newPfRaw = row['New PF Applicable'].trim();
  let newPfApplicable: boolean | undefined;
  if (newPfRaw) {
    const parsed = parseRequiredBool(newPfRaw, 'New PF Applicable');
    if (parsed.error) result.errors.push(parsed.error);
    else newPfApplicable = parsed.value;
  }

  const parsed = workOrderSchema.safeParse({
    workOrderNumber: woNumber,
    date: row['Date'] || undefined,
    jobDesc: row['Job Description'] || undefined,
    orderDesc: row['Order Description'] || undefined,
    dept: row['Department'].trim(),
    section: row['Section'] || undefined,
    validFrom: row['Valid From'] || undefined,
    validTo: row['Valid To'] || undefined,
    lapseTill: row['Lapse Till'] || undefined,
    state,
    newPfApplicable,
  });

  if (!parsed.success) {
    result.errors.push(parsed.error.issues[0]?.message ?? 'Invalid work order');
    return result;
  }

  if (result.errors.length > 0) return result;

  result.data = parsed.data;
  return result;
}

export function createWorkOrderBulkConfig(): BulkUploadConfig<
  Omit<WorkOrder, 'id'>,
  WorkOrderBulkContext
> {
  return {
    entityName: 'Work Orders',
    templateFileName: 'Work_Orders_Bulk_Upload_Template.xlsx',
    columns: workOrderBulkColumns,
    validateRow: (row, rowIndex, ctx) =>
      validateWorkOrderRow(row, rowIndex, ctx),
    async importRows(rows) {
      let success = 0;
      const errors: string[] = [];
      for (const row of rows) {
        try {
          await workOrderService.create(row);
          success += 1;
        } catch (err) {
          errors.push(
            err instanceof Error ? err.message : 'Failed to create work order',
          );
        }
      }
      return { success, failed: rows.length - success, errors };
    },
  };
}
