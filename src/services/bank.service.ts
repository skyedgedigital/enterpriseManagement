import {
  collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { COLLECTIONS } from "@/lib/constants";
import type { Bank } from "@/types";

const colRef = collection(db, COLLECTIONS.BANKS);

export const bankService = {
  getAll: async (): Promise<Bank[]> => {
    const q = query(colRef, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Bank));
  },
  getById: async (id: string): Promise<Bank | null> => {
    const docRef = doc(db, COLLECTIONS.BANKS, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Bank;
  },
  create: async (data: Omit<Bank, "id">): Promise<Bank> => {
    const docRef = await addDoc(colRef, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return { id: docRef.id, ...data };
  },
  update: async (id: string, data: Partial<Bank>): Promise<void> => {
    await updateDoc(doc(db, COLLECTIONS.BANKS, id), { ...data, updatedAt: serverTimestamp() });
  },
  remove: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.BANKS, id));
  },
};
