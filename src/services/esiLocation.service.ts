import {
  collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { COLLECTIONS } from "@/lib/constants";
import type { EsiLocation } from "@/types";

const colRef = collection(db, COLLECTIONS.ESI_LOCATIONS);

export const esiLocationService = {
  getAll: async (): Promise<EsiLocation[]> => {
    const q = query(colRef, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as EsiLocation));
  },
  getById: async (id: string): Promise<EsiLocation | null> => {
    const docRef = doc(db, COLLECTIONS.ESI_LOCATIONS, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as EsiLocation;
  },
  create: async (data: Omit<EsiLocation, "id">): Promise<EsiLocation> => {
    const docRef = await addDoc(colRef, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return { id: docRef.id, ...data };
  },
  update: async (id: string, data: Partial<EsiLocation>): Promise<void> => {
    await updateDoc(doc(db, COLLECTIONS.ESI_LOCATIONS, id), { ...data, updatedAt: serverTimestamp() });
  },
  remove: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.ESI_LOCATIONS, id));
  },
};
