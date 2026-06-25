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
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import type { AdminDepartment } from '@/types/admin';

const colRef = collection(db, COLLECTIONS.ADMIN_DEPARTMENTS);

export const adminDepartmentService = {
  getAll: async (): Promise<AdminDepartment[]> => {
    const q = query(colRef, orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as AdminDepartment,
    );
  },

  getById: async (id: string): Promise<AdminDepartment | null> => {
    const docRef = doc(db, COLLECTIONS.ADMIN_DEPARTMENTS, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as AdminDepartment;
  },

  create: async (
    data: Omit<AdminDepartment, 'id'>,
  ): Promise<AdminDepartment> => {
    const docRef = await addDoc(colRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...data };
  },

  update: async (id: string, data: Partial<AdminDepartment>): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.ADMIN_DEPARTMENTS, id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
  },

  remove: async (id: string): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.ADMIN_DEPARTMENTS, id);
    await deleteDoc(docRef);
  },
};
