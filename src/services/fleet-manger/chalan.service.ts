import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { parse } from 'date-fns';

import { db, storage } from '@/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import type { Chalan, ChalanItem, ChalanStatus } from '@/types';
import type { ChalanFormValues } from '@/lib/fleet-manager/validators';
import { fleetWorkOrderService } from '@/services/fleet-manger/workOrder.service';
import { omitUndefined } from '../shared';

const chalanCol = () => collection(db, COLLECTIONS.CHALANS);
const chalanDoc = (id: string) => doc(db, COLLECTIONS.CHALANS, id);

// ============================================================
// HELPER TYPES AND FUNCTIONS
// ============================================================
export type FleetChalanUpdatePayload = Partial<
  Omit<Chalan, 'id' | 'createdAt' | 'updatedAt'>
>;

function normalizeTime(t: string): string {
  const s = t.trim();
  return s.length >= 5 ? s.slice(0, 5) : s;
}

export type CreateDriverChalanParams = {
  form: ChalanFormValues;
  driverUid: string;
};

export function calcPrice(
  quantity: number,
  price: number,
  unit: string,
): number {
  if (unit === 'shift') return 1 * price;
  if (unit === 'ot') return 0.5 * price * quantity;
  return quantity * price;
}

// ============================================================
// SERVICES
// ============================================================

export const fleetChalanService = {
  async createChalan({
    form,
    driverUid,
  }: CreateDriverChalanParams): Promise<Chalan> {
    // ── Checking for Duplicate chalanNumber ──
    const dupQ = query(
      chalanCol(),
      where('chalanNumber', '==', form.chalanNumber.trim()),
    );
    const dupSnap = await getDocs(dupQ);
    if (!dupSnap.empty) {
      throw new Error(
        `Chalan number "${form.chalanNumber.trim()}" already exists.`,
      );
    }

    const newRef = doc(chalanCol());
    const id = newRef.id;

    const safeName = form.file.name.replace(/[^\w.\-]+/g, '_');
    const storageRef = ref(storage, `chalans/${id}/${safeName}`);
    await uploadBytes(storageRef, form.file);
    const fileUrl = await getDownloadURL(storageRef);

    const itemsResolved: ChalanItem[] = [];
    let totalCost = 0;

    for (const row of form.items) {
      const fleetLine = await fleetWorkOrderService.getFleetWorkOrderItemById(
        row.item,
      );
      if (!fleetLine) {
        throw new Error(`Fleet line item not found: ${row.item}`);
      }
      const unit = row.unit.trim();
      const costing = calcPrice(row.hours, fleetLine.itemPrice, unit);
      totalCost += costing;

      itemsResolved.push({
        itemName: fleetLine.itemName,
        item: row.item,
        vehicleNumber: row.vehicleNumber.trim(),
        unit,
        hours: row.hours,
        startTime: normalizeTime(row.startTime),
        endTime: normalizeTime(row.endTime),
        itemCosting: costing,
      });
    }

    const date = parse(form.date, 'yyyy-MM-dd', new Date());
    const status = form.status as ChalanStatus;

    const payload: Omit<Chalan, 'id' | 'createdAt' | 'updatedAt'> = {
      workOrderId: form.workOrderId,
      departmentId: form.departmentId,
      engineerId: form.engineerId,
      createdByUid: driverUid,
      date: Timestamp.fromDate(date),
      chalanNumber: form.chalanNumber.trim(),
      location: form.location?.trim() || '',
      workDescription: form.workDescription?.trim() || undefined,
      file: fileUrl,
      status,
      signed: status === 'signed',
      verified: false,
      invoiceCreated: false,
      items: itemsResolved,
      totalCost,
      commentByDriver: form.commentByDriver?.trim() || undefined,
    };

    const cleaned = omitUndefined(payload as Record<string, unknown>);

    await setDoc(newRef, {
      ...cleaned,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id, ...payload };
  },

  async getAll(): Promise<Chalan[]> {
    const q = query(chalanCol(), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Chalan);
    console.log('All chalans data', data);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Chalan);
  },

  async getById(id: string): Promise<Chalan> {
    const snap = await getDoc(chalanDoc(id));
    if (!snap.exists()) throw new Error('Chalan not found');
    return { id: snap.id, ...snap.data() } as Chalan;
  },

  async update(id: string, patch: FleetChalanUpdatePayload): Promise<Chalan> {
    const cRef = chalanDoc(id);
    const snap = await getDoc(cRef);
    if (!snap.exists()) throw new Error('Chalan not found');

    const cleaned = omitUndefined(patch as Record<string, unknown>);

    await updateDoc(cRef, {
      ...cleaned,
      updatedAt: serverTimestamp(),
    });

    const updated = await getDoc(cRef);
    return { id: updated.id, ...updated.data() } as Chalan;
  },
  /**
   * Generate a unique chalan number for the current year
   * @returns Promise<string> - Generated chalan number like "CH-2026-001"
   */
  async generateChalanNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    let sequenceNumber = 1;
    let chalanNumber = `CH-${currentYear}-${String(sequenceNumber).padStart(4, '0')}`;

    // Keep checking until we find an unused number
    while (await this.isChalanNumberExists(chalanNumber)) {
      sequenceNumber++;
      chalanNumber = `CH-${currentYear}-${String(sequenceNumber).padStart(4, '0')}`;

      // Safety check to prevent infinite loops (max 9999 chalans per year)
      if (sequenceNumber > 9999) {
        throw new Error(
          'Unable to generate unique chalan number. Limit exceeded for this year.',
        );
      }
    }

    return chalanNumber;
  },
  /**
   * Service to generate unique chalan numbers
   * Format: CH-YYYY-XXXX (e.g., CH-2026-001)
   */

  /**
   * Check if a chalan number already exists in Firestore
   * @param chalanNumber - The chalan number to check
   * @returns Promise<boolean> - true if exists, false otherwise
   */
  async isChalanNumberExists(chalanNumber: string): Promise<boolean> {
    try {
      const chalanCol = collection(db, COLLECTIONS.CHALANS);
      const q = query(
        chalanCol,
        where('chalanNumber', '==', chalanNumber.trim()),
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking chalan number existence:', error);
      throw error;
    }
  },

  /**
   * Get the next sequence number for current year
   * @returns Promise<number> - Next sequence number
   */
  async getNextSequenceNumber(): Promise<number> {
    const currentYear = new Date().getFullYear();
    const chalanCol = collection(db, COLLECTIONS.CHALANS);

    // Query chalans created in current year
    const snapshot = await getDocs(chalanCol);

    let maxSequence = 0;
    snapshot.forEach((doc) => {
      const data = doc.data();
      const chalanNum = data.chalanNumber as string;

      // Check if it matches our format and is from current year
      const match = chalanNum.match(new RegExp(`^CH-${currentYear}-(\\d+)$`));
      if (match) {
        const sequence = parseInt(match[1], 10);
        if (sequence > maxSequence) {
          maxSequence = sequence;
        }
      }
    });

    return maxSequence + 1;
  },
  async remove(id: string): Promise<void> {
    await deleteDoc(chalanDoc(id));
  },
};
