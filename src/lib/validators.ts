import { z } from 'zod';
import { BANK_NAMES } from '@/lib/constants';
import { toSanitizedKey } from '@/lib/sanitize';

// ============================================================
// Auth
// ============================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const updatePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

// ============================================================
// Master Data
// ============================================================

export const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
});
export type DepartmentFormValues = z.infer<typeof departmentSchema>;

export const designationSchema = z.object({
  designation: z.string().min(1, 'Designation is required'),
  basic: z.string().min(1, 'Basic is required'),
  oldBasic: z.string().min(1, 'Old Basic is required'),
  da: z.string().min(1, 'DA is required'),
  oldDa: z.string().min(1, 'Old DA is required'),
  payRate: z.string().min(1, 'Pay Rate is required'),
  basic2: z.string().min(1, 'Basic 2 is required'),
});
export type DesignationFormValues = z.infer<typeof designationSchema>;

export const bankSchema = z.object({
  name: z
    .string()
    .min(1, 'Select a bank name')
    .refine((v) => BANK_NAMES.some((n) => toSanitizedKey(n) === v), {
      message: 'Select a valid bank name',
    }),
  branch: z.string().min(1, 'Branch is required'),
  ifsc: z
    .string()
    .min(1, 'IFSC is required')
    .max(11, 'IFSC must be 11 characters'),
});
export type BankFormValues = z.infer<typeof bankSchema>;

export const siteSchema = z.object({
  name: z.string().min(1, 'Site name is required'),
});
export type SiteFormValues = z.infer<typeof siteSchema>;

export const esiLocationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  esiNo: z.string().min(1, 'ESI No is required'),
  branch: z.string().min(1, 'Branch is required'),
});
export type EsiLocationFormValues = z.infer<typeof esiLocationSchema>;

// ============================================================
// Employee
// ============================================================

export const employeeSchema = z.object({
  code: z.string().min(1, 'Employee code is required'),
  workManNo: z.string().optional(),
  name: z.string().optional(),
  fathersName: z.string().optional(),
  sex: z.enum(['Male', 'Female', 'Other']).optional(),
  dob: z.string().optional(),
  maritalStatus: z
    .enum(['Single', 'Married', 'Divorced', 'Widowed'])
    .optional(),
  address: z.string().optional(),
  landlineNumber: z.string().optional(),
  mobileNumber: z.string().optional(),
  adhaarNumber: z.string().optional(),
  department: z.string().optional(),
  site: z.string().optional(),
  designation: z.string().optional(),
  workingStatus: z.boolean().optional(),
  appointmentDate: z.string().optional(),
  resignDate: z.string().optional(),
  bank: z.string().optional(),
  accountNumber: z.string().optional(),
  pfApplicable: z.boolean().optional(),
  pfNo: z.string().optional(),
  uan: z.string().optional(),
  esicApplicable: z.boolean().optional(),
  esicNo: z.string().optional(),
  esiLocation: z.string().optional(),
  basic: z.string().optional(),
  da: z.string().optional(),
  payRate: z.string().optional(),
  hra: z.string().optional(),
  ca: z.string().optional(),
  food: z.string().optional(),
  incentives: z.string().optional(),
  uniform: z.string().optional(),
  medical: z.string().optional(),
  loan: z.string().optional(),
  lic: z.string().optional(),
  oldBasic: z.string().optional(),
  oldDa: z.string().optional(),
  attendanceAllowance: z.boolean().optional(),
  safetyPassNumber: z.string().optional(),
  spValidity: z.string().optional(),
  policeVerificationValidityDate: z.string().optional(),
  gatePassNumber: z.string().optional(),
  gatePassValidTill: z.string().optional(),
});
export type EmployeeFormValues = z.infer<typeof employeeSchema>;

// ============================================================
// Work Order
// ============================================================

export const workOrderSchema = z.object({
  workOrderNumber: z.string().min(1, 'Work order number is required'),
  date: z.string().optional(),
  jobDesc: z.string().optional(),
  orderDesc: z.string().optional(),
  dept: z.string().optional(),
  section: z.string().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  lapseTill: z.string().optional(),
  state: z.string().optional(),
  newPfApplicable: z.boolean().optional(),
});
export type WorkOrderFormValues = z.infer<typeof workOrderSchema>;

// ============================================================
// Wages
// ============================================================

export const wagesSchema = z.object({
  employee: z.string().min(1, 'Employee is required'),
  designation: z.string().min(1, 'Designation is required'),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),
  workOrderHr: z.string().optional(),
  totalWorkingDays: z.coerce.number().min(0),
  attendance: z.coerce.number().min(0),
  basic: z.coerce.number().optional(),
  da: z.coerce.number().optional(),
  payRate: z.coerce.number().optional(),
  allowances: z.coerce.number().optional(),
  otherCash: z.coerce.number().optional(),
  otherCashDescription: z.string().optional(),
  total: z.coerce.number(),
  incentiveApplicable: z.boolean().optional(),
  incentiveDays: z.coerce.number().optional(),
  incentiveAmount: z.coerce.number().optional(),
  otherDeduction: z.coerce.number().optional(),
  otherDeductionDescription: z.string().optional(),
  advanceDeduction: z.coerce.number().optional(),
  damageDeduction: z.coerce.number().optional(),
  isAdvanceDeduction: z.boolean().optional(),
  isDamageDeduction: z.boolean().optional(),
  netAmountPaid: z.coerce.number(),
});
export type WagesFormValues = z.infer<typeof wagesSchema>;
