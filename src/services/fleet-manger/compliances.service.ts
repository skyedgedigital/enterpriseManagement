// @/services/fleet-manager/compliance.service.ts

import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import type { Compliance } from '@/types';
import { omitUndefined } from '../shared';

const compliancesCol = collection(db, COLLECTIONS.COMPLIANCES);

export const complianceService = {
  // Fetch ALL — default list view, newest first
  getAll: async (): Promise<Compliance[]> => {
    const q = query(compliancesCol, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Compliance);
  },

  // Filter by any combination of vehicleNumber, complianceType, month+year
  // vehicleNumber filter uses the denormalized field — no composite index needed with date
  getFiltered: async (filters: {
    vehicleNumber?: string;
    complianceType?: string;
    year?: number;
    month?: number; // 0-indexed
  }): Promise<Compliance[]> => {
    const constraints: any[] = [];

    if (filters.vehicleNumber) {
      constraints.push(where('vehicleNumber', '==', filters.vehicleNumber));
    }
    if (filters.complianceType) {
      constraints.push(where('compliance', '==', filters.complianceType));
    }
    if (filters.year !== undefined && filters.month !== undefined) {
      const start = Timestamp.fromDate(
        new Date(filters.year, filters.month, 1),
      );
      const end = Timestamp.fromDate(
        new Date(filters.year, filters.month + 1, 0, 23, 59, 59),
      );
      constraints.push(where('date', '>=', start));
      constraints.push(where('date', '<=', end));
      constraints.push(orderBy('date', 'asc'));
    } else {
      constraints.push(orderBy('date', 'desc'));
    }

    const q = query(compliancesCol, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Compliance);
  },

  create: async (data: Omit<Compliance, 'id'>): Promise<Compliance> => {
    const docRef = await addDoc(compliancesCol, omitUndefined({
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    return { id: docRef.id, ...data };
  },

  remove: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.COMPLIANCES, id));
  },
};
