import {
  collection,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import type { Vehicle } from '@/types';
import { omitUndefined } from '../shared';

const vehicleCol = collection(db, COLLECTIONS.VEHICLES);
const vehicleDoc = (id: string) => doc(db, COLLECTIONS.VEHICLES, id);

export const vehicleService = {
  getAll: async (): Promise<Vehicle[]> => {
    const q = query(vehicleCol, orderBy('vehicleNumber'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Vehicle);
  },

  getById: async (id: string): Promise<Vehicle | null> => {
    const docRef = vehicleDoc(id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Vehicle;
  },

  create: async (
    data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Vehicle> => {
    const vRef = doc(vehicleCol);

    const cleaned = omitUndefined(data as Record<string, unknown>);

    await setDoc(vRef, {
      ...cleaned,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: vRef.id, ...data } as Vehicle;
  },

  update: async (id: string, data: Partial<Vehicle>): Promise<void> => {
    const docRef = vehicleDoc(id);
    const cleaned = omitUndefined(data as Record<string, unknown>);
    await updateDoc(docRef, {
      ...cleaned,
      updatedAt: serverTimestamp(),
    });
  },

  remove: async (id: string): Promise<void> => {
    const docRef = vehicleDoc(id);
    await deleteDoc(docRef);
  },
};
