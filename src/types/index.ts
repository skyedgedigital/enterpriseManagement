// ============================================================
// Firebase Timestamp type
// ============================================================
import type { Timestamp } from 'firebase/firestore';

// ============================================================
// Master Data Types
// ============================================================

export interface Department {
  id: string;
  name: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Designation {
  id: string;
  designation: string;
  basic: string;
  oldBasic: string;
  da: string;
  oldDa: string;
  payRate: string;
  basic2: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Bank {
  id: string;
  name: string;
  branch: string;
  ifsc: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Site {
  id: string;
  name: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface EsiLocation {
  id: string;
  name: string;
  address: string;
  esiNo: string;
  branch: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================================
// Embedded / Sub-Document Types
// ============================================================

export interface DamageRegister {
  particularsOfDamageOrLoss: string;
  dateOfDamageOrLoss: string;
  didWorkmanShowCause: boolean;
  personWhoHeardExplanation: string;
  amountOfDeductionImposed: number;
  numberOfInstallments: number;
  installmentsLeft: number;
  remarks?: string;
}

export interface AdvanceRegister {
  amountOfAdvanceGiven: number;
  dateOfAdvanceGiven: string;
  purposeOfAdvanceGiven: string;
  numberOfInstallments: number;
  installmentsLeft: number;
  remarks?: string;
}

export interface Bonus {
  year: number;
  status: boolean;
}

export interface Leave {
  year: number;
  status: boolean;
}

export interface EmployeeWorkOrder {
  period: string; // MM-YYYY
  workOrderHr: string; // reference ID to workOrders
  workOrderAtten: number;
}

export interface AttendanceDay {
  day: number;
  status: AttendanceStatus;
  workOrderHr?: string;
}

export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Half Day'
  | 'NH'
  | 'Not Paid'
  | 'Earned Leave'
  | 'Casual Leave'
  | 'Festival Leave';

// ============================================================
// Employee
// ============================================================

export interface Employee {
  id: string;
  // Personal Information
  code: string;
  workManNo?: string;
  name?: string;
  fathersName?: string;
  sex?: 'Male' | 'Female' | 'Other';
  dob?: string;
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  address?: string;
  landlineNumber?: string;
  mobileNumber?: string;
  adhaarNumber?: string;

  // Employment Information
  department?: string; // reference ID
  site?: string; // reference ID
  designation?: string; // reference ID
  workingStatus?: boolean;
  appointmentDate?: string;
  resignDate?: string;

  // Banking Information
  bank?: string; // reference ID
  accountNumber?: string;

  // Statutory Information
  pfApplicable?: boolean;
  pfNo?: string;
  uan?: string;
  esicApplicable?: boolean;
  esicNo?: string;
  esiLocation?: string; // reference ID

  // Salary Components
  basic?: string;
  da?: string;
  payRate?: string; // default: basic + DA, editable
  hra?: string;
  ca?: string;
  food?: string;
  incentives?: string;
  uniform?: string;
  medical?: string;
  loan?: string;
  lic?: string;
  oldBasic?: string;
  oldDa?: string;
  attendanceAllowance?: boolean;

  // Safety & Compliance
  safetyPassNumber?: string;
  spValidity?: string;
  policeVerificationValidityDate?: string;
  gatePassNumber?: string;
  gatePassValidTill?: string;

  // Document URLs
  profilePhotoUrl?: string;
  drivingLicenseUrl?: string;
  aadharCardUrl?: string;
  bankPassbookUrl?: string;

  // Embedded Arrays
  bonus?: Bonus[];
  leave?: Leave[];
  damageRegister?: DamageRegister[];
  advanceRegister?: AdvanceRegister[];
  workOrderHr?: EmployeeWorkOrder[];

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================================
// Work Order
// ============================================================

export interface WorkOrder {
  id: string;
  workOrderNumber: string;
  date?: string;
  jobDesc?: string;
  orderDesc?: string;
  dept?: string; // department ID (reference to departments)
  section?: string;
  validFrom?: string;
  validTo?: string;
  lapseTill?: string;
  state?: string; // Indian state/UT full name (for filter/group)
  newPfApplicable?: boolean; // true = PF capped at 15k; false/undefined = PF on full amount
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================================
// Attendance
// ============================================================

export interface Attendance {
  id: string;
  employee: string; // reference ID
  year: number;
  month: number;
  days?: AttendanceDay[];
  presentDays: number;
  earnedLeaves: number;
  casualLeaves: number;
  festivalLeaves: number;
  continuousWeeks?: number;
  weeklyAllowanceDays?: number;
  weeklyAllowanceAmount?: number;
  workOrderHr?: string; // reference ID
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================================
// Wages
// ============================================================

export interface Wages {
  id: string;
  employee: string; // reference ID
  designation: string; // reference ID
  month: number;
  year: number;
  workOrderHr?: string; // reference ID

  // Attendance & Working Days
  totalWorkingDays: number;
  attendance: number;

  // Earnings
  basic?: number;
  da?: number;
  payRate?: number;
  allowances?: number;
  otherCash?: number;
  otherCashDescription?: string;
  total: number;

  // Incentives
  incentiveApplicable?: boolean;
  incentiveDays?: number;
  incentiveAmount?: number;

  // Deductions
  otherDeduction?: number;
  otherDeductionDescription?: string;
  advanceDeduction?: number;
  damageDeduction?: number;
  isAdvanceDeduction?: boolean;
  isDamageDeduction?: boolean;

  // Net Pay
  netAmountPaid: number;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================================
// Final Settlement
// ============================================================

export interface FinalSettlement {
  id: string;
  employee?: string; // reference ID
  bonus?: Bonus[];
  leave?: Leave[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================================
// Auth User
// ============================================================

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// ============================================================
// Generic Redux State
// ============================================================

export interface AsyncState {
  loading: boolean;
  error: string | null;
}

export * from './fleet-manager';
export * from './admin';
