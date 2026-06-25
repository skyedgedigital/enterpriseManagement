import {
  collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { omitUndefined } from "@/services/shared";
import type { WorkOrder } from "@/types";

const colRef = collection(db, COLLECTIONS.WORK_ORDERS);

export const workOrderService = {
  getAll: async (): Promise<WorkOrder[]> => {
    const q = query(colRef, orderBy("workOrderNumber"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as WorkOrder));
  },
  getById: async (id: string): Promise<WorkOrder> => {
    const snap = await getDoc(doc(db, COLLECTIONS.WORK_ORDERS, id));
    if (!snap.exists()) throw new Error("Work order not found");
    return { id: snap.id, ...snap.data() } as WorkOrder;
  },
  create: async (data: Omit<WorkOrder, "id">): Promise<WorkOrder> => {
    const payload = omitUndefined({
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const docRef = await addDoc(colRef, payload);
    return { id: docRef.id, ...data };
  },
  update: async (id: string, data: Partial<WorkOrder>): Promise<void> => {
    await updateDoc(doc(db, COLLECTIONS.WORK_ORDERS, id), {
      ...omitUndefined(data as Record<string, unknown>),
      updatedAt: serverTimestamp(),
    });
  },
  remove: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.WORK_ORDERS, id));
  },
};
