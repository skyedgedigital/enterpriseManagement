import {
  collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { COLLECTIONS } from "@/lib/constants";
import type { Designation } from "@/types";

const colRef = collection(db, COLLECTIONS.DESIGNATIONS);

export const designationService = {
  getAll: async (): Promise<Designation[]> => {
    const q = query(colRef, orderBy("designation"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Designation));
  },
  getById: async (id: string): Promise<Designation | null> => {
    const docRef = doc(db, COLLECTIONS.DESIGNATIONS, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Designation;
  },
  create: async (data: Omit<Designation, "id">): Promise<Designation> => {
    const docRef = await addDoc(colRef, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return { id: docRef.id, ...data };
  },
  update: async (id: string, data: Partial<Designation>): Promise<void> => {
    await updateDoc(doc(db, COLLECTIONS.DESIGNATIONS, id), { ...data, updatedAt: serverTimestamp() });
  },
  remove: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.DESIGNATIONS, id));
  },
};
