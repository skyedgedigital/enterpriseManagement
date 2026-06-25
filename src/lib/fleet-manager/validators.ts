import { z } from 'zod';
import { CHALAN_IMAGE_TYPES, MAX_CHALAN_FILE_BYTES } from './constants';

const zodPosNumberFromInput = (msg: string) =>
  z
    .string()
    .min(1, 'Required')
    .transform((v) => (v === '' ? NaN : Number(v)))
    .refine((n) => !Number.isNaN(n) && n > 0, { message: msg });

// ============================================================
// Fleet Work Order Item
// ============================================================

export const fleetWorkOrderItemSchema = z.object({
  itemName: z.string().trim().min(1, 'Required'),
  itemPrice: zodPosNumberFromInput('Value must be greater than 0'),
  hsnNo: z.string().trim().min(1, 'Required'),
  itemNumber: zodPosNumberFromInput('Must be greater than 0'),
});
export type fleetWorkOrderItemFormValues = z.infer<
  typeof fleetWorkOrderItemSchema
>;
export type FleetWorkOrderItemFormInput = z.input<
  typeof fleetWorkOrderItemSchema
>;
// ============================================================
// Fleet Work Order
// ============================================================

export const fleetWorkOrderFormSchema = z.object({
  workOrderNumber: z.string().trim().min(1, 'Required'),
  workDescription: z.string().trim().min(1, 'Required'),
  workOrderValue: zodPosNumberFromInput('Value must be greater than 0'),
  workOrderBalance: zodPosNumberFromInput('Value must be greater than 0'),
  workOrderValidity: z.string().min(1, 'Invalid date'), // "yyyy-MM-dd" from DatePicker
  shiftStatus: z.boolean().optional(),
  units: z.array(z.string()).min(1, 'Select at least one unit'),
  items: z
    .array(fleetWorkOrderItemSchema)
    .min(1, 'At least one item is required'),
});

export type FleetWorkOrderFormValues = z.infer<typeof fleetWorkOrderFormSchema>;

// ============================================================
// Edit Fleet Work Order
// ============================================================

export const fleetWorkOrderEditFormSchema = z.object({
  workDescription: z.string().trim().min(1, 'Required'),
  workOrderValue: zodPosNumberFromInput('Value must be greater than 0'),
  workOrderBalance: zodPosNumberFromInput('Value must be greater than 0'),
  workOrderValidity: z.string().min(1, 'Invalid date'),
  shiftStatus: z.boolean().optional(),
  units: z.array(z.string()).min(1, 'Select at least one unit'),
});

export type FleetWorkOrderEditFormValues = z.infer<
  typeof fleetWorkOrderEditFormSchema
>;
export type FleetWorkOrderEditFormInput = z.input<
  typeof fleetWorkOrderEditFormSchema
>;

// ============================================================
// Chalan
// ============================================================

const timeHHMMFromInput = z
  .string()
  .min(1, 'Required')
  .transform((s) => {
    const t = s.trim();
    return t.length >= 5 ? t.slice(0, 5) : t;
  })
  .refine(
    (s) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(s),
    'Invalid time (HH:MM)',
  );

export const chalanItemUnitEnum = z.enum([
  'minutes',
  'hours',
  'days',
  'months',
  'fixed',
  'shift',
  'ot',
]);

// ============================================================
// Chalan Item Form
// ============================================================

export const chalanItemSchema = z.object({
  item: z.string().min(1, 'Select item'),
  vehicleNumber: z.string().trim().min(1, 'Required'),
  unit: z.string().trim().min(1, 'Required'),
  hours: zodPosNumberFromInput('Quantity must be greater than 0'),
  startTime: timeHHMMFromInput,
  endTime: timeHHMMFromInput,
});
export type ChalanItemFormValues = z.infer<typeof chalanItemSchema>;
export type ChalanItemFormInput = z.input<typeof chalanItemSchema>;

// ============================================================
// Chalan Form
// ============================================================

export const chalanFormSchema = z.object({
  workOrderId: z.string().min(1, 'Select work order'),
  departmentId: z.string().min(1, 'Select department'),
  engineerId: z.string().min(1, 'Select engineer'),
  date: z.string().min(1, 'Select date'),
  chalanNumber: z.string().trim().min(1, 'Required'),
  location: z.string().optional(),
  workDescription: z.string().optional(),
  file: z
    .instanceof(File, { message: 'Chalan photo is required' })
    .refine((f) => f.size <= MAX_CHALAN_FILE_BYTES, 'Max file size 5 MB')
    .refine(
      (f) =>
        CHALAN_IMAGE_TYPES.includes(
          f.type as (typeof CHALAN_IMAGE_TYPES)[number],
        ),
      'Only JPG or PNG images',
    ),
  status: z.enum(['unsigned', 'signed']),
  items: z.array(chalanItemSchema).min(1, 'At least one item'),
  commentByDriver: z.string().optional(),
});

export type ChalanFormValues = z.infer<typeof chalanFormSchema>;
export type ChalanFormInput = z.input<typeof chalanFormSchema>;

// ============================================================
// Vehicle Form
// ============================================================

const vehicleExpiryDateSchema = z.date().optional();

export const vehicleSchema = z.object({
  vehicleNumber: z.string().trim().min(1, 'Required'),
  vehicleType: z.string().optional(),
  location: z.string().optional(),
  vendor: z.string().optional(),
  insuranceNumber: z.string().optional(),
  insuranceExpiryDate: vehicleExpiryDateSchema,
  gatePassNumber: z.string().optional(),
  gatePassExpiry: vehicleExpiryDateSchema,
  tax: z.string().optional(),
  taxExpiryDate: vehicleExpiryDateSchema,
  fitness: z.string().optional(),
  fitnessExpiry: vehicleExpiryDateSchema,
  loadTest: z.string().optional(),
  loadTestExpiry: vehicleExpiryDateSchema,
  safety: z.string().optional(),
  safetyExpiryDate: vehicleExpiryDateSchema,
  puc: z.string().optional(),
  pucExpiryDate: vehicleExpiryDateSchema,
  fuelType: z.enum(['diesel', 'petrol']),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;
export type VehicleFormInput = z.input<typeof vehicleSchema>;

// ============================================================
// Consumable
// ============================================================

export const consumableFormSchema = z.object({
  vehicleNumber: z.string().trim().min(1, 'Please select a vehicle'),
  consumableItem: z.string().trim().min(1, 'Consumable item is required'),
  quantity: zodPosNumberFromInput('Quantity must be greater than 0'),
  amount: zodPosNumberFromInput('Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
});

export type ConsumableFormValues = z.infer<typeof consumableFormSchema>;
export type ConsumableFormInput = z.input<typeof consumableFormSchema>;

// ============================================================
// Tool
// ============================================================
export const toolSchema = z.object({
  toolName: z.string().min(1, 'Tool name is required'),
  quantity: zodPosNumberFromInput('Quantity must be greater than 0'),
  price: zodPosNumberFromInput('Price must be greater than 0'),
});
export type ToolFormValues = z.infer<typeof toolSchema>;
export type ToolFormInput = z.input<typeof toolSchema>;

// ============================================================
// Store Management (Tool Allotment)
// ============================================================
export const toolStoreManagementSchema = z.object({
  vehicleId: z.string().min(1, 'Please select a vehicle'),
  toolId: z.string().min(1, 'Please select a tool'),
  quantity: zodPosNumberFromInput('Quantity must be greater than 0'),
  dateOfAllotment: z.string().min(1, 'Date of allotment is required'),
  dateOfReturn: z.string().min(1, 'Date of return is required'),
});
export type ToolStoreManagementFormValues = z.infer<
  typeof toolStoreManagementSchema
>;
export type ToolStoreManagementFormInput = z.input<
  typeof toolStoreManagementSchema
>;

// ============================================================
// Fuel Price
// ============================================================

export const fuelPriceSchema = z.object({
  fuelType: z.enum(['petrol', 'diesel'], {
    message: 'Please select fuel type',
  }),
  price: zodPosNumberFromInput('Price must be greater than 0'),
});
export type FuelPriceFormValues = z.infer<typeof fuelPriceSchema>;
export type FuelPriceFormInput = z.input<typeof fuelPriceSchema>;

// ============================================================
// Fuel Entry
// ============================================================

export const fuelEntrySchema = z.object({
  vehicleId: z.string().min(1, 'Please select a vehicle'),
  fuelType: z.enum(['petrol', 'diesel'], {
    message: 'Please select fuel type',
  }),
  fuelQuantity: zodPosNumberFromInput('Fuel quantity must be greater than 0'),
  amount: zodPosNumberFromInput('Amount must be greater than 0'),
  meterReading: z.string().min(1, 'Meter reading is required'),
  date: z.string().min(1, 'Date is required'),
});
export type FuelEntryFormValues = z.infer<typeof fuelEntrySchema>;
export type FuelEntryFormInput = z.input<typeof fuelEntrySchema>;

// ============================================================
// Compliance Entry
// ============================================================

export const complianceSchema = z
  .object({
    vehicleId: z.string().min(1, 'Please select a vehicle'),
    compliance: z.enum(
      [
        'EMI',
        'INSURANCE',
        'TAX',
        'FITNESS',
        'LOAD TEST',
        'SAFETY',
        'PUC',
        'OTHER',
      ],
      { message: 'Please select a compliance type' },
    ),
    complianceDesc: z.string().optional(),
    amount: zodPosNumberFromInput('Amount must be greater than 0'),
    date: z.string().min(1, 'Date is required'),
  })
  .refine(
    (data) =>
      data.compliance !== 'OTHER' ||
      (data.complianceDesc && data.complianceDesc.trim().length > 0),
    {
      message: 'Description is required for OTHER compliance',
      path: ['complianceDesc'],
    },
  );
export type ComplianceFormValues = z.infer<typeof complianceSchema>;
export type ComplianceFormInput = z.input<typeof complianceSchema>;
