import type { Timestamp } from 'firebase/firestore';

// ============================================================
// Fleet Work Orders
// ============================================================

export interface FleetWorkOrderItem {
  id: string;
  workOrderId: string;
  itemName: string;
  hsnNo?: string;
  itemPrice: number;
  itemNumber: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
export interface FleetWorkOrder {
  id: string;
  workOrderNumber: string;
  workDescription: string;
  workOrderValue: number;
  workOrderValidity: Timestamp; // Date tha; Firestore + redux style ke liye
  shiftStatus: boolean;
  workOrderBalance: number;
  units: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================================
// Chalans
// ============================================================

export type ChalanStatus =
  | 'approved'
  | 'pending'
  | 'unsigned'
  | 'generated'
  | 'signed';

export type ChalanItemUnit =
  | 'minutes'
  | 'hours'
  | 'days'
  | 'months'
  | 'shift'
  | 'ot';

export interface ChalanItem {
  item: string;
  itemName: string; // denormalized for display; source of truth is fleetWorkOrderItem.itemName
  vehicleNumber?: string;
  unit: ChalanItemUnit | string; // for custom units;
  hours: number;
  startTime: string; // "HH:MM" — format React form / zod se validate
  endTime: string;
  itemCosting: number;
}

export interface Chalan {
  id: string;
  workOrderId: string;
  departmentId: string;
  engineerId: string;
  date: Timestamp; // ya string ISO — ek convention choose karo
  chalanNumber?: string;
  location?: string;
  workDescription?: string;
  file?: string; // Storage path / download URL, jaise bhi tha
  status?: ChalanStatus;
  signed?: boolean;
  verified?: boolean;
  invoiceCreated?: boolean;
  items: ChalanItem[];
  commentByDriver?: string;
  commentByFleetManager?: string;
  totalCost?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdByUid?: string;
}

// ============================================================
// Vehicles
// ============================================================

export type VehicleFuelType = 'diesel' | 'petrol';

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType?: string;
  location?: string;
  vendor?: string;
  insuranceNumber?: string;
  insuranceExpiryDate?: Timestamp;
  gatePassNumber?: string;
  gatePassExpiry?: Timestamp;
  tax?: string;
  taxExpiryDate?: Timestamp;
  fitness?: string;
  fitnessExpiry?: Timestamp;
  loadTest?: string;
  loadTestExpiry?: Timestamp;
  safety?: string;
  safetyExpiryDate?: Timestamp;
  puc?: string;
  pucExpiryDate?: Timestamp;
  fuelType: VehicleFuelType;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================================
// Consumables
// ============================================================

export interface Consumable {
  id: string;
  vehicleNumber: string;
  consumableItem: string;
  quantity: number;
  amount: number;
  date: Timestamp;
  month: string;
  year: string;
  docId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================================
// Invoices
// ============================================================

export type InvoiceType = 'generic' | 'wmd' | 'phs';

export interface MergedInvoiceItem {
  itemId: string;
  itemName: string;
  itemNumber: number;
  itemPrice: number;
  hsnNo: string;
  unit: string;
  hours: number;
  itemCost: number;
}

export interface InvoiceSummaryRow {
  chalanNumber: string;
  chalanDate: Date;
  location: string;
  workingHour: number;
}

export interface InvoiceSummaryByItem {
  itemDescription: string;
  details: InvoiceSummaryRow[];
}

export interface FleetInvoice {
  id: string;
  invoiceNumber: string; // e.g. "SE/2024-25/123"
  invoiceType: InvoiceType;
  chalanIds: string[];
  chalanNumbers: string[];
  workOrderId: string;
  workOrderNumber: string;
  departmentId: string;
  departmentName: string;
  location: string;
  servicePeriod: string;
  mergedItems: MergedInvoiceItem[];
  total: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  pdfUrl?: string;
  sesNo?: string;
  doNo?: string;
  taxNumber?: string;
  summaryPdfUrl?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Enterprise info (dummy for now)
export interface EnterpriseInfo {
  name: string;
  address: string;
  mobile: string;
  email: string;
  gstin: string;
  pan: string;
  vendorCode: string;
}

// ============================================================
// Tool - Store Management
// ============================================================
export interface Tool {
  id: string;
  toolName: string;
  quantity: number;
  price: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================================
// Tool - Store Management (Tool Allotment)
// ============================================================
export interface ToolStoreManagement {
  id: string;
  vehicleId: string;
  tool: string;
  toolId: string; // reference to Tool doc
  quantity: number;
  dateOfAllotment: Timestamp;
  dateOfReturn: Timestamp;
  status: 'active' | 'returned';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================================
// Fuel Price (one doc per fuelType — doc id = "petrol" | "diesel")
// ============================================================
export interface FuelPrice {
  id: string;
  fuelType: 'petrol' | 'diesel';
  price: number;
  updatedAt?: Timestamp;
}

// ============================================================
// Fuel Entry
// ============================================================
export interface FuelEntry {
  id: string;
  vehicleId: string;
  vehicleNumber: string; // denormalized for display
  fuelType: 'petrol' | 'diesel';
  fuelQuantity: number; // litres
  amount: number; // rupees
  meterReading: string;
  date: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================================
// Compliance Types
// ============================================================

export const COMPLIANCE_TYPES = [
  'EMI',
  'INSURANCE',
  'TAX',
  'FITNESS',
  'LOAD TEST',
  'SAFETY',
  'PUC',
  'OTHER',
] as const;

export type ComplianceType = (typeof COMPLIANCE_TYPES)[number];

// ============================================================
// Compliance Entry
// ============================================================
export interface Compliance {
  id: string;
  vehicleId: string;
  vehicleNumber: string; // denormalized for display + filtering
  compliance: ComplianceType;
  complianceDesc?: string; // required only when compliance === 'OTHER'
  amount: number;
  date: Timestamp; // single date field (no month/year stored separately)
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================================
// Report Row — one row per chalan item
// ============================================================
export interface VehicleReportRow {
  chalanId: string;
  chalanNumber: string;
  date: Timestamp;
  vehicleNumber: string;
  item: string;
  location: string;
  departmentId: string;
  engineerId: string;
  runningHours: number;
  unit: string;
  amount: number; // itemCosting
  gst: number; // 18% of amount
  total: number; // amount + gst
}
