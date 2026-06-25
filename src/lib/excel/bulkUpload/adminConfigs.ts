import { adminDepartmentSchema, engineerSchema } from '@/lib/admin/validators';
import { adminDepartmentService } from '@/services/admin/adminDepartment.service';
import { engineerService } from '@/services/admin/engineer.service';
import type { AdminDepartment, Engineer } from '@/types/admin';

import type { MasterDataExportConfig } from './exportMasterData';
import type { BulkUploadColumn, BulkUploadConfig, BulkUploadRowResult } from './types';
import { findByName, isRowEmpty } from './utils';

export interface AdminEngineerBulkContext {
  departments: AdminDepartment[];
}

export const adminDepartmentBulkColumns: BulkUploadColumn[] = [
  {
    header: 'Department Name',
    required: true,
    example: 'Engineering',
    hint: 'Unique department name',
  },
];

export const adminDepartmentBulkConfig: BulkUploadConfig<
  Omit<AdminDepartment, 'id' | 'createdAt' | 'updatedAt'>,
  null
> = {
  entityName: 'Admin Departments',
  templateFileName: 'Admin_Departments_Bulk_Upload_Template.xlsx',
  columns: adminDepartmentBulkColumns,
  validateRow(row, rowIndex) {
    const result: BulkUploadRowResult<
      Omit<AdminDepartment, 'id' | 'createdAt' | 'updatedAt'>
    > = {
      rowIndex,
      errors: [],
    };
    if (isRowEmpty(row, adminDepartmentBulkColumns)) return result;

    const parsed = adminDepartmentSchema.safeParse({
      name: row['Department Name'],
    });
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
        await adminDepartmentService.create(row);
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

export const adminDepartmentExportConfig: MasterDataExportConfig<AdminDepartment> =
  {
    entityName: 'Admin Departments',
    fileName: 'Admin_Departments_Export.xlsx',
    columns: adminDepartmentBulkColumns,
    mapItemToRow: (dept) => ({
      'Department Name': dept.name,
    }),
  };

export const adminEngineerBulkColumns: BulkUploadColumn[] = [
  {
    header: 'Engineer Name',
    required: true,
    example: 'John Smith',
    hint: 'Full name of the engineer',
  },
  {
    header: 'Department',
    required: true,
    example: 'Engineering',
    hint: 'Must match an admin department name',
  },
];

export const adminEngineerBulkConfig: BulkUploadConfig<
  Omit<Engineer, 'id' | 'createdAt' | 'updatedAt'>,
  AdminEngineerBulkContext
> = {
  entityName: 'Engineers',
  templateFileName: 'Admin_Engineers_Bulk_Upload_Template.xlsx',
  columns: adminEngineerBulkColumns,
  validateRow(row, rowIndex, context) {
    const result: BulkUploadRowResult<
      Omit<Engineer, 'id' | 'createdAt' | 'updatedAt'>
    > = {
      rowIndex,
      errors: [],
    };
    if (isRowEmpty(row, adminEngineerBulkColumns)) return result;

    const deptName = row['Department'].trim();
    const department = deptName
      ? findByName(context.departments, deptName, (d) => d.name)
      : undefined;
    if (deptName && !department) {
      result.errors.push(
        `Department "${deptName}" not found. Create it in Admin Departments first.`,
      );
    }

    const parsed = engineerSchema.safeParse({
      name: row['Engineer Name'],
      departmentId: department?.id ?? '',
    });
    if (!parsed.success) {
      result.errors.push(
        parsed.error.issues[0]?.message ?? 'Invalid engineer',
      );
      return result;
    }
    if (result.errors.length > 0) return result;

    result.data = parsed.data;
    return result;
  },
  async importRows(rows) {
    let success = 0;
    const errors: string[] = [];
    for (const row of rows) {
      try {
        await engineerService.create(row);
        success += 1;
      } catch (err) {
        errors.push(
          err instanceof Error ? err.message : 'Failed to create engineer',
        );
      }
    }
    return { success, failed: rows.length - success, errors };
  },
};

export const adminEngineerExportConfig: MasterDataExportConfig<
  Engineer,
  AdminEngineerBulkContext
> = {
  entityName: 'Engineers',
  fileName: 'Admin_Engineers_Export.xlsx',
  columns: adminEngineerBulkColumns,
  mapItemToRow: (eng, ctx) => ({
    'Engineer Name': eng.name,
    Department:
      ctx.departments.find((d) => d.id === eng.departmentId)?.name ?? '',
  }),
};
