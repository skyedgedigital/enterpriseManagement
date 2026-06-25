import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  updateDoc,
  addDoc,
  deleteDoc,
} from 'firebase/firestore';
import { parse, format } from 'date-fns';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import type { Consumable } from '@/types';
import type { ConsumableFormValues } from '@/lib/fleet-manager/validators';

const consCol = () => collection(db, COLLECTIONS.CONSUMABLES);

function toConsumableData(form: ConsumableFormValues) {
  const d = parse(form.date, 'yyyy-MM-dd', new Date());
  const month = format(d, 'MMMM');
  const year = format(d, 'yyyy');
  const docId = `${month}${year}`;

  return {
    vehicleNumber: form.vehicleNumber,
    consumableItem: form.consumableItem.trim(),
    quantity: form.quantity,
    amount: form.amount,
    date: Timestamp.fromDate(d),
    month,
    year,
    docId,
  };
}

export const consumableService = {
  async getAll(): Promise<Consumable[]> {
    const q = query(consCol(), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Consumable);
  },

  async getById(id: string): Promise<Consumable> {
    const ref = doc(db, COLLECTIONS.CONSUMABLES, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Consumable not found');
    return { id: snap.id, ...snap.data() } as Consumable;
  },

  async create(form: ConsumableFormValues): Promise<Consumable> {
    const payload = toConsumableData(form);
    const docRef = await addDoc(consCol(), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...payload } as Consumable;
  },

  async update(id: string, form: ConsumableFormValues): Promise<Consumable> {
    const ref = doc(db, COLLECTIONS.CONSUMABLES, id);
    const payload = toConsumableData(form);
    await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
    return { id, ...payload } as Consumable;
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.CONSUMABLES, id));
  },
};
