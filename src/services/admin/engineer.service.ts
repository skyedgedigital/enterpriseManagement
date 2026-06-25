import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import type { Engineer } from '@/types';

const engCol = collection(db, COLLECTIONS.ENGINEERS);

export const engineerService = {
  getAll: async (): Promise<Engineer[]> => {
    const q = query(engCol, orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Engineer);
  },

  getById: async (id: string): Promise<Engineer | null> => {
    const docRef = doc(db, COLLECTIONS.ENGINEERS, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Engineer;
  },

  getEngineersByDepartment: async (
    departmentId: string,
  ): Promise<Engineer[] | null> => {
    const q = query(engCol, where('departmentId', '==', departmentId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Engineer);
  },

  create: async (data: Omit<Engineer, 'id'>): Promise<Engineer> => {
    const docRef = await addDoc(engCol, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...data };
  },

  update: async (id: string, data: Partial<Engineer>): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.ENGINEERS, id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
  },

  remove: async (id: string): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.ENGINEERS, id);
    await deleteDoc(docRef);
  },
};
