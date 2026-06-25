import type { Timestamp } from 'firebase/firestore';

// ============================================================
// Enterprise Details
// ============================================================

export interface EnterpriseDetails {
  id: string;
  name: string;
  address: string;
  gstin: string;
  pan: string;
  vendorCode: string;
  email: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================================
// Admin Departments
// ============================================================

export interface AdminDepartment {
  id: string;
  name: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================================
// Engineer
// ============================================================

export interface Engineer {
  id: string;
  name: string;
  departmentId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
