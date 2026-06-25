import {
  collection,
  getDoc,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import type { EnterpriseDetails } from '@/types';

const entDetailsCol = collection(db, COLLECTIONS.ENTERPRISE_DETAILS);

export const enterpriseDetailsService = {
  getDetails: async (): Promise<EnterpriseDetails | null> => {
    const docRef = doc(
      db,
      COLLECTIONS.ENTERPRISE_DETAILS,
      COLLECTIONS.ENTERPRISE_DETAILS, // using collection name as doc id since there's only one record
    );
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as EnterpriseDetails;
  },

  saveEnterpriseDetails: async (
    data: Partial<EnterpriseDetails>,
  ): Promise<EnterpriseDetails> => {
    const docRef = doc(
      db,
      COLLECTIONS.ENTERPRISE_DETAILS,
      COLLECTIONS.ENTERPRISE_DETAILS,
    );
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      const newDocRef = await addDoc(entDetailsCol, {
        ...data,
        createdAt: serverTimestamp(),
      });
      return {
        id: newDocRef.id,
        ...data,
        createdAt: serverTimestamp(),
      } as EnterpriseDetails;
    }
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    return {
      id: snap.id,
      ...snap.data(),
      updatedAt: serverTimestamp(),
    } as EnterpriseDetails;
  },
};
