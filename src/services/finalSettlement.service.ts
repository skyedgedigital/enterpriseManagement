import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { COLLECTIONS } from "@/lib/constants";
import type { FinalSettlement } from "@/types";

const colRef = collection(db, COLLECTIONS.FINAL_SETTLEMENTS);

export const finalSettlementService = {
  getAll: async (): Promise<FinalSettlement[]> => {
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FinalSettlement));
  },
  create: async (data: Omit<FinalSettlement, "id">): Promise<FinalSettlement> => {
    const docRef = await addDoc(colRef, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return { id: docRef.id, ...data };
  },
  update: async (id: string, data: Partial<FinalSettlement>): Promise<void> => {
    await updateDoc(doc(db, COLLECTIONS.FINAL_SETTLEMENTS, id), { ...data, updatedAt: serverTimestamp() });
  },
  remove: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.FINAL_SETTLEMENTS, id));
  },
};
