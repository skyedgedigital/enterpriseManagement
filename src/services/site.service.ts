import {
  collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { COLLECTIONS } from "@/lib/constants";
import type { Site } from "@/types";

const colRef = collection(db, COLLECTIONS.SITES);

export const siteService = {
  getAll: async (): Promise<Site[]> => {
    const q = query(colRef, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Site));
  },
  getById: async (id: string): Promise<Site | null> => {
    const docRef = doc(db, COLLECTIONS.SITES, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Site;
  },
  create: async (data: Omit<Site, "id">): Promise<Site> => {
    const docRef = await addDoc(colRef, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return { id: docRef.id, ...data };
  },
  update: async (id: string, data: Partial<Site>): Promise<void> => {
    await updateDoc(doc(db, COLLECTIONS.SITES, id), { ...data, updatedAt: serverTimestamp() });
  },
  remove: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.SITES, id));
  },
};
