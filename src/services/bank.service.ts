import {
  collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { normalizeIfsc } from "@/lib/validators";
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
  isIfscUnique: async (ifsc: string, excludeId?: string): Promise<boolean> => {
    const key = normalizeIfsc(ifsc);
    if (!key) return false;
    const banks = await bankService.getAll();
    return !banks.some(
      (b) => normalizeIfsc(b.ifsc) === key && b.id !== excludeId,
    );
  },
  create: async (data: Omit<Bank, "id">): Promise<Bank> => {
    const ifsc = normalizeIfsc(data.ifsc);
    if (!(await bankService.isIfscUnique(ifsc))) {
      throw new Error(`IFSC "${ifsc}" already exists`);
    }
    const payload = { ...data, ifsc };
    const docRef = await addDoc(colRef, { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return { id: docRef.id, ...payload };
  },
  update: async (id: string, data: Partial<Bank>): Promise<void> => {
    const payload = { ...data };
    if (payload.ifsc !== undefined) {
      const ifsc = normalizeIfsc(payload.ifsc);
      if (!(await bankService.isIfscUnique(ifsc, id))) {
        throw new Error(`IFSC "${ifsc}" already exists`);
      }
      payload.ifsc = ifsc;
    }
    await updateDoc(doc(db, COLLECTIONS.BANKS, id), { ...payload, updatedAt: serverTimestamp() });
  },
  remove: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.BANKS, id));
  },
};
