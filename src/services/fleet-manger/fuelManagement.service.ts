// @/services/fleet-manager/fuelManagement.service.ts

import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import type { FuelEntry, FuelPrice } from '@/types';
import { omitUndefined } from '../shared';

const fuelEntriesCol = collection(db, COLLECTIONS.FUEL_ENTRIES);
const fuelPricesCol = collection(db, COLLECTIONS.FUEL_PRICES);

// ============================================================
// Fuel Entries
// ============================================================
export const fuelEntryService = {
  // Firestore Console → Indexes → Add: vehicleId ASC + date DESC
  getAll: async (vehicleId?: string): Promise<FuelEntry[]> => {
    const q = vehicleId
      ? query(
          fuelEntriesCol,
          where('vehicleId', '==', vehicleId),
          orderBy('date', 'desc'),
        )
      : query(fuelEntriesCol, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as FuelEntry);
  },

  // Fetch by month+year date range, optionally filter by vehicleId

  getByMonthYear: async (
    year: number,
    month: number,
    vehicleId?: string,
  ): Promise<FuelEntry[]> => {
    const start = Timestamp.fromDate(new Date(year, month, 1));
    const end = Timestamp.fromDate(new Date(year, month + 1, 0, 23, 59, 59));

    const constraints = vehicleId
      ? [
          where('vehicleId', '==', vehicleId),
          where('date', '>=', start),
          where('date', '<=', end),
          orderBy('date', 'asc'),
        ]
      : [
          where('date', '>=', start),
          where('date', '<=', end),
          orderBy('date', 'asc'),
        ];

    const q = query(fuelEntriesCol, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as FuelEntry);
  },

  create: async (data: Omit<FuelEntry, 'id'>): Promise<FuelEntry> => {
    const docRef = await addDoc(fuelEntriesCol, omitUndefined({
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    return { id: docRef.id, ...data };
  },

  remove: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.FUEL_ENTRIES, id));
  },
};

// ============================================================
// Fuel Prices
// ============================================================
export const fuelPriceService = {
  getAll: async (): Promise<FuelPrice[]> => {
    const snapshot = await getDocs(fuelPricesCol);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as FuelPrice);
  },

  upsert: async (fuelType: string, price: number): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.FUEL_PRICES, fuelType);
    await setDoc(
      docRef,
      { fuelType, price, updatedAt: serverTimestamp() },
      { merge: true },
    );
  },
};
