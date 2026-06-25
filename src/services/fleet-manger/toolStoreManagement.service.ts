// @/services/fleet-manager/tool.service.ts

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
import type { Tool } from '@/types';
import type { ToolStoreManagement } from '@/types';
import { omitUndefined } from '../shared';

// ============================================================
// Tool Store Management (Allotment)
// ============================================================

const toolColRef = collection(db, COLLECTIONS.TOOLS);

export const toolService = {
  getAll: async (): Promise<Tool[]> => {
    const q = query(toolColRef, orderBy('toolName'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Tool);
  },

  getById: async (id: string): Promise<Tool | null> => {
    const docRef = doc(db, COLLECTIONS.TOOLS, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Tool;
  },

  create: async (data: Omit<Tool, 'id'>): Promise<Tool> => {
    const docRef = await addDoc(toolColRef, omitUndefined({
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    return { id: docRef.id, ...data };
  },

  update: async (id: string, data: Partial<Tool>): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.TOOLS, id);
    await updateDoc(docRef, omitUndefined({
      ...data,
      updatedAt: serverTimestamp(),
    }));
  },

  remove: async (id: string): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.TOOLS, id);
    await deleteDoc(docRef);
  },
};

// ============================================================
// Tool Store Management (Allotment)
// ============================================================
const tsmColRef = collection(db, COLLECTIONS.TOOL_STORE_MANAGEMENT);

export const toolStoreManagementService = {
  getAll: async (): Promise<ToolStoreManagement[]> => {
    const q = query(tsmColRef, orderBy('dateOfAllotment', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as ToolStoreManagement,
    );
  },

  getById: async (id: string): Promise<ToolStoreManagement | null> => {
    const docRef = doc(db, COLLECTIONS.TOOL_STORE_MANAGEMENT, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as ToolStoreManagement;
  },

  create: async (
    data: Omit<ToolStoreManagement, 'id'>,
  ): Promise<ToolStoreManagement> => {
    const docRef = await addDoc(tsmColRef, omitUndefined({
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    return { id: docRef.id, ...data };
  },

  update: async (
    id: string,
    data: Partial<ToolStoreManagement>,
  ): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.TOOL_STORE_MANAGEMENT, id);
    await updateDoc(docRef, omitUndefined({
      ...data,
      updatedAt: serverTimestamp(),
    }));
  },

  remove: async (id: string): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.TOOL_STORE_MANAGEMENT, id);
    await deleteDoc(docRef);
  },
};
