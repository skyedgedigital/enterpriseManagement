import { getBankDisplayName, getStateDisplayName } from '@/lib/sanitize';

import type {
  Bank,
  Department,
  Designation,
  Employee,
  EsiLocation,
  Site,
  WorkOrder,
} from '@/types';

import type { MasterDataExportConfig } from './exportMasterData';
import {
  bankBulkConfig,
  departmentBulkConfig,
  designationBulkConfig,
  employeeAdditionalSheets,
  employeeBulkColumns,
  esiLocationBulkConfig,
  siteBulkConfig,
  workOrderBulkColumns,
  type EmployeeBulkContext,
  type WorkOrderBulkContext,
} from './masterDataConfigs';

function boolToYesNo(value?: boolean): string {
  if (value === undefined) return '';
  return value ? 'Yes' : 'No';
}

function str(value?: string | number | null): string {
  if (value == null) return '';
  return String(value);
}

function resolveDeptName(
  deptId: string | undefined,
  departments: Department[],
): string {
  if (!deptId) return '';
  return departments.find((d) => d.id === deptId)?.name ?? deptId;
}

export const departmentExportConfig: MasterDataExportConfig<Department> = {
  entityName: 'Departments',
  fileName: 'Departments_Export.xlsx',
  columns: departmentBulkConfig.columns,
  mapItemToRow: (dept) => ({
    'Department Name': dept.name,
  }),
};

export const designationExportConfig: MasterDataExportConfig<Designation> = {
  entityName: 'Designations',
  fileName: 'Designations_Export.xlsx',
  columns: designationBulkConfig.columns,
  mapItemToRow: (d) => ({
    Designation: d.designation,
    Basic: d.basic,
    'Old Basic': d.oldBasic,
    DA: d.da,
    'Old DA': d.oldDa,
    'Pay Rate': d.payRate,
    'Basic 2': d.basic2,
  }),
};

export const bankExportConfig: MasterDataExportConfig<Bank> = {
  entityName: 'Banks',
  fileName: 'Banks_Export.xlsx',
  columns: bankBulkConfig.columns,
  mapItemToRow: (bank) => ({
    'Bank Name': getBankDisplayName(bank.name),
    Branch: bank.branch,
    IFSC: bank.ifsc,
  }),
};

export const siteExportConfig: MasterDataExportConfig<Site> = {
  entityName: 'Sites',
  fileName: 'Sites_Export.xlsx',
  columns: siteBulkConfig.columns,
  mapItemToRow: (site) => ({
    'Site Name': site.name,
  }),
};

export const esiLocationExportConfig: MasterDataExportConfig<EsiLocation> = {
  entityName: 'ESI Locations',
  fileName: 'ESI_Locations_Export.xlsx',
  columns: esiLocationBulkConfig.columns,
  mapItemToRow: (loc) => ({
    Name: loc.name,
    Address: loc.address,
    'ESI No': loc.esiNo,
    Branch: loc.branch,
  }),
};

export const workOrderExportConfig: MasterDataExportConfig<
  WorkOrder,
  WorkOrderBulkContext
> = {
  entityName: 'Work Orders',
  fileName: 'Work_Orders_Export.xlsx',
  columns: workOrderBulkColumns,
  mapItemToRow: (wo, ctx) => ({
    'Work Order Number': wo.workOrderNumber,
    Date: str(wo.date),
    Department: resolveDeptName(wo.dept, ctx.departments),
    Section: str(wo.section),
    'Valid From': str(wo.validFrom),
    'Valid To': str(wo.validTo),
    'Lapse Till': str(wo.lapseTill),
    State: wo.state ? getStateDisplayName(wo.state) : '',
    'New PF Applicable': boolToYesNo(wo.newPfApplicable),
    'Job Description': str(wo.jobDesc),
    'Order Description': str(wo.orderDesc),
  }),
};

export const employeeExportConfig: MasterDataExportConfig<
  Employee,
  EmployeeBulkContext
> = {
  entityName: 'Employees',
  fileName: 'Employees_Export.xlsx',
  columns: employeeBulkColumns,
  additionalSheets: employeeAdditionalSheets,
  getItemId: (emp) => emp.id,
  getItemLookupKey: (emp) => emp.code,
  mapItemToRow: (emp, ctx) => {
    const bank = emp.bank
      ? ctx.banks.find((b) => b.id === emp.bank)
      : undefined;

    return {
      'Employee Code': emp.code,
      'Workman No': str(emp.workManNo),
      'Full Name': str(emp.name),
      "Father's Name": str(emp.fathersName),
      Gender: str(emp.sex),
      'Date of Birth': str(emp.dob),
      'Marital Status': str(emp.maritalStatus),
      Address: str(emp.address),
      Landline: str(emp.landlineNumber),
      Mobile: str(emp.mobileNumber),
      'Aadhaar Number': str(emp.adhaarNumber),
      Department: resolveDeptName(emp.department, ctx.departments),
      Site: emp.site
        ? (ctx.sites.find((s) => s.id === emp.site)?.name ?? '')
        : '',
      Designation: emp.designation
        ? (ctx.designations.find((d) => d.id === emp.designation)?.designation ??
          '')
        : '',
      'Working Status': boolToYesNo(emp.workingStatus),
      'Appointment Date': str(emp.appointmentDate),
      'Resign Date': str(emp.resignDate),
      'Bank Name': bank ? getBankDisplayName(bank.name) : '',
      'Bank Branch': bank?.branch ?? '',
      'Bank IFSC': bank?.ifsc ?? '',
      'Account Number': str(emp.accountNumber),
      'PF Applicable': boolToYesNo(emp.pfApplicable),
      'PF Number': str(emp.pfNo),
      UAN: str(emp.uan),
      'ESIC Applicable': boolToYesNo(emp.esicApplicable),
      'ESIC Number': str(emp.esicNo),
      'ESI Location': emp.esiLocation
        ? (ctx.esiLocations.find((e) => e.id === emp.esiLocation)?.name ?? '')
        : '',
      Basic: str(emp.basic),
      DA: str(emp.da),
      'Pay Rate': str(emp.payRate),
      HRA: str(emp.hra),
      CA: str(emp.ca),
      Food: str(emp.food),
      Incentives: str(emp.incentives),
      Uniform: str(emp.uniform),
      Medical: str(emp.medical),
      Loan: str(emp.loan),
      LIC: str(emp.lic),
      'Old Basic': str(emp.oldBasic),
      'Old DA': str(emp.oldDa),
      'Attendance Allowance': boolToYesNo(emp.attendanceAllowance),
      'Safety Pass Number': str(emp.safetyPassNumber),
      'Safety Pass Validity': str(emp.spValidity),
      'Police Verification Validity': str(emp.policeVerificationValidityDate),
      'Gate Pass Number': str(emp.gatePassNumber),
      'Gate Pass Valid Till': str(emp.gatePassValidTill),
    };
  },
  buildAdditionalSheetRows(items, ctx) {
    const WorkOrderHr: Record<string, string>[] = [];
    const Bonus: Record<string, string>[] = [];
    const Leave: Record<string, string>[] = [];
    const DamageRegister: Record<string, string>[] = [];
    const AdvanceRegister: Record<string, string>[] = [];

    for (const emp of items) {
      for (const wo of emp.workOrderHr ?? []) {
        const workOrder = ctx.workOrders.find((w) => w.id === wo.workOrderHr);
        WorkOrderHr.push({
          'Employee Code': emp.code,
          Period: wo.period,
          'Work Order Number':
            workOrder?.workOrderNumber ?? wo.workOrderHr,
          'Work Order Atten': str(wo.workOrderAtten),
        });
      }
      for (const b of emp.bonus ?? []) {
        Bonus.push({
          'Employee Code': emp.code,
          Year: str(b.year),
          Paid: boolToYesNo(b.status),
        });
      }
      for (const l of emp.leave ?? []) {
        Leave.push({
          'Employee Code': emp.code,
          Year: str(l.year),
          Encashed: boolToYesNo(l.status),
        });
      }
      for (const d of emp.damageRegister ?? []) {
        DamageRegister.push({
          'Employee Code': emp.code,
          Particulars: d.particularsOfDamageOrLoss,
          Date: d.dateOfDamageOrLoss,
          'Show Cause': boolToYesNo(d.didWorkmanShowCause),
          Person: d.personWhoHeardExplanation,
          Amount: str(d.amountOfDeductionImposed),
          Installments: str(d.numberOfInstallments),
          'Installments Left': str(d.installmentsLeft),
          Remarks: str(d.remarks),
        });
      }
      for (const a of emp.advanceRegister ?? []) {
        AdvanceRegister.push({
          'Employee Code': emp.code,
          Amount: str(a.amountOfAdvanceGiven),
          Date: a.dateOfAdvanceGiven,
          Purpose: a.purposeOfAdvanceGiven,
          Installments: str(a.numberOfInstallments),
          'Installments Left': str(a.installmentsLeft),
          Remarks: str(a.remarks),
        });
      }
    }

    return { WorkOrderHr, Bonus, Leave, DamageRegister, AdvanceRegister };
  },
};
