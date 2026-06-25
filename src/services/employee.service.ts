import {
  collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, orderBy,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { commitBatchedSetsResilient, omitUndefined } from "@/services/shared";
import type { Employee } from "@/types";

const colRef = collection(db, COLLECTIONS.EMPLOYEES);

function buildEmployeeWritePayload(data: Omit<Employee, "id">): Record<string, unknown> {
  return omitUndefined({
    ...data,
    bonus: data.bonus ?? [],
    leave: data.leave ?? [],
    damageRegister: data.damageRegister ?? [],
    advanceRegister: data.advanceRegister ?? [],
    workOrderHr: data.workOrderHr ?? [],
    profilePhotoUrl: data.profilePhotoUrl ?? "",
    drivingLicenseUrl: data.drivingLicenseUrl ?? "",
    aadharCardUrl: data.aadharCardUrl ?? "",
    bankPassbookUrl: data.bankPassbookUrl ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export const employeeService = {
  getAll: async (): Promise<Employee[]> => {
    const q = query(colRef, orderBy("code"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Employee));
  },

  getById: async (id: string): Promise<Employee> => {
    const docRef = doc(db, COLLECTIONS.EMPLOYEES, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) throw new Error("Employee not found");
    return { id: snapshot.id, ...snapshot.data() } as Employee;
  },

  getByCode: async (code: string): Promise<Employee | null> => {
    const q = query(colRef, where("code", "==", code));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() } as Employee;
  },

  create: async (data: Omit<Employee, "id">): Promise<Employee> => {
    const payload = buildEmployeeWritePayload(data);
    const docRef = await addDoc(colRef, payload);
    return { id: docRef.id, ...data };
  },

  /** Bulk insert for Excel upload — uses Firestore batched writes (500 per commit). */
  createMany: async (
    items: Omit<Employee, "id">[],
  ): Promise<{ success: number; errors: string[] }> => {
    if (items.length === 0) return { success: 0, errors: [] };
    const documents = items.map((item) => buildEmployeeWritePayload(item));
    return commitBatchedSetsResilient(colRef, documents);
  },

  update: async (id: string, data: Partial<Employee>): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.EMPLOYEES, id);
    await updateDoc(docRef, {
      ...omitUndefined(data as Record<string, unknown>),
      updatedAt: serverTimestamp(),
    });
  },

  remove: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.EMPLOYEES, id));
  },
};
