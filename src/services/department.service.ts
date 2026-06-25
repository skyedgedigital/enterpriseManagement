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
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { COLLECTIONS } from "@/lib/constants";
import type { Department } from "@/types";

const colRef = collection(db, COLLECTIONS.DEPARTMENTS);

export const departmentService = {
  getAll: async (): Promise<Department[]> => {
    const q = query(colRef, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Department));
  },

  getById: async (id: string): Promise<Department | null> => {
    const docRef = doc(db, COLLECTIONS.DEPARTMENTS, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Department;
  },

  create: async (data: Omit<Department, "id">): Promise<Department> => {
    const docRef = await addDoc(colRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...data };
  },

  update: async (id: string, data: Partial<Department>): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.DEPARTMENTS, id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
  },

  remove: async (id: string): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.DEPARTMENTS, id);
    await deleteDoc(docRef);
  },
};
