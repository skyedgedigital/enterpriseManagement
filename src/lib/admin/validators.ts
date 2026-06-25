import { z } from 'zod';
import { CREATABLE_USER_ROLES, USER_ROLES } from '@/lib/rbac';

// ============================================================
// Enterprise Details
// ============================================================

export const enterpriseDetailsSchema = z.object({
  name: z.string().min(1, 'Enterprise name is required'),
  address: z.string().min(1, 'Address is required'),
  gstin: z.string().min(1, 'GSTIN is required'),
  pan: z.string().min(1, 'PAN is required'),
  vendorCode: z.string().min(1, 'Vendor code is required'),
  email: z.string().email('Invalid email address').optional(),
});

export type EnterpriseDetailsFormValues = z.infer<
  typeof enterpriseDetailsSchema
>;
export type EnterpriseDetailsUpdateFormValues = z.input<
  typeof enterpriseDetailsSchema
>;

// ============================================================
// Admin Department
// ============================================================

export const adminDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
});
export type AdminDepartmentFormValues = z.infer<typeof adminDepartmentSchema>;

// ============================================================
// Engineer
// ============================================================

export const engineerSchema = z.object({
  name: z.string().min(1, 'Engineer name is required'),
  departmentId: z.string().min(1, 'Select engineer department'),
});
export type EngineerFormValues = z.infer<typeof engineerSchema>;

// ============================================================
// App User (Auth email/password; Firestore users/{uid} document)
// ============================================================

export const createAppUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(CREATABLE_USER_ROLES, {
    message: 'Select a role',
  }),
  name: z
    .string()
    .max(120, 'Name must be at most 120 characters')
    .transform((s) => {
      const t = s.trim();
      return t === '' ? undefined : t;
    }),
  phone: z
    .string()
    .max(40, 'Phone number must be at most 40 characters')
    .transform((s) => {
      const t = s.trim();
      return t === '' ? undefined : t;
    }),
});
/** Parsed values after transforms (passed to submit handler). */
export type CreateAppUserFormValues = z.output<typeof createAppUserSchema>;
/** Raw form field values registered in the UI (before transforms). */
export type CreateAppUserFormInput = z.input<typeof createAppUserSchema>;

// ============================================================
// Edit app user profile (Firestore users/{uid}, no Auth password)
// ============================================================

export const editAppUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum(USER_ROLES, {
    message: 'Select a role',
  }),
  name: z
    .string()
    .max(120, 'Name must be at most 120 characters')
    .transform((s) => {
      const t = s.trim();
      return t === '' ? undefined : t;
    }),
  phone: z
    .string()
    .max(40, 'Phone number must be at most 40 characters')
    .transform((s) => {
      const t = s.trim();
      return t === '' ? undefined : t;
    }),
});
export type EditAppUserFormValues = z.output<typeof editAppUserSchema>;
export type EditAppUserFormInput = z.input<typeof editAppUserSchema>;
