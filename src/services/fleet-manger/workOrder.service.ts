import {
  collection,
  getDocs,
  getDoc,
  doc,
  writeBatch,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  updateDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { parse } from 'date-fns';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import type { FleetWorkOrder, FleetWorkOrderItem } from '@/types';
import type {
  FleetWorkOrderFormValues,
  FleetWorkOrderEditFormValues,
  fleetWorkOrderItemFormValues,
} from '@/lib/fleet-manager/validators';

const woCol = () => collection(db, COLLECTIONS.FLEET_WORK_ORDERS);
const itemCol = () => collection(db, COLLECTIONS.FLEET_WORK_ORDER_ITEMS);

function toWorkOrderData(
  form: FleetWorkOrderFormValues,
): Omit<FleetWorkOrder, 'id' | 'createdAt' | 'updatedAt'> {
  const d = parse(form.workOrderValidity, 'yyyy-MM-dd', new Date());
  return {
    workOrderNumber: form.workOrderNumber.trim(),
    workDescription: form.workDescription.trim(),
    workOrderValue: form.workOrderValue,
    workOrderBalance: form.workOrderBalance,
    workOrderValidity: Timestamp.fromDate(d),
    shiftStatus: form.shiftStatus ?? false,
    units: form.units,
  };
}

export const fleetWorkOrderService = {
  // ============================================================
  // Fleet WorkOrders
  // ============================================================

  async workOrderNumberExists(num: string): Promise<boolean> {
    const q = query(woCol(), where('workOrderNumber', '==', num.trim()));
    const snap = await getDocs(q);
    return !snap.empty;
  },

  async getAll(): Promise<FleetWorkOrder[]> {
    const q = query(woCol(), orderBy('workOrderNumber'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FleetWorkOrder);
  },

  async getById(id: string): Promise<FleetWorkOrder> {
    const ref = doc(db, COLLECTIONS.FLEET_WORK_ORDERS, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Work order not found');
    return { id: snap.id, ...snap.data() } as FleetWorkOrder;
  },

  async getItemsByWorkOrderId(
    workOrderId: string,
  ): Promise<FleetWorkOrderItem[]> {
    const q = query(itemCol(), where('workOrderId', '==', workOrderId));
    const snap = await getDocs(q);
    return snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as FleetWorkOrderItem,
    );
  },
  async createFleetWorkOrder(
    form: FleetWorkOrderFormValues,
  ): Promise<{ workOrder: FleetWorkOrder; items: FleetWorkOrderItem[] }> {
    if (await this.workOrderNumberExists(form.workOrderNumber)) {
      throw new Error('A work order already exists with this number');
    }

    const payload = toWorkOrderData(form);
    const batch = writeBatch(db);
    const worRef = doc(woCol());

    batch.set(worRef, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const localItems: FleetWorkOrderItem[] = [];

    for (const item of form.items) {
      const iRef = doc(itemCol());
      const row: Omit<FleetWorkOrderItem, 'id' | 'createdAt' | 'updatedAt'> = {
        workOrderId: worRef.id,
        itemName: item.itemName.trim(),
        hsnNo: item.hsnNo.trim(),
        itemPrice: item.itemPrice,
        itemNumber: item.itemNumber,
      };
      batch.set(iRef, {
        ...row,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      localItems.push({ id: iRef.id, ...row });
    }
    await batch.commit();
    const workOrder: FleetWorkOrder = {
      id: worRef.id,
      ...payload,
    };
    return { workOrder, items: localItems };
  },

  async updateFleetWorkOrderFields(
    id: string,
    form: FleetWorkOrderEditFormValues,
  ): Promise<FleetWorkOrder> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Work order not found');

    const d = parse(form.workOrderValidity, 'yyyy-MM-dd', new Date());

    const payload: Omit<FleetWorkOrder, 'id' | 'createdAt' | 'updatedAt'> = {
      workOrderNumber: existing.workOrderNumber,
      workDescription: form.workDescription.trim(),
      workOrderValue: form.workOrderValue,
      workOrderBalance: form.workOrderBalance,
      workOrderValidity: Timestamp.fromDate(d),
      shiftStatus: form.shiftStatus || existing.shiftStatus,
      units: form.units,
    };
    const woRef = doc(db, COLLECTIONS.FLEET_WORK_ORDERS, id);
    await updateDoc(woRef, { ...payload, updatedAt: serverTimestamp() });
    return { id, ...payload } as FleetWorkOrder;
  },

  async remove(id: string): Promise<void> {
    const items = await this.getItemsByWorkOrderId(id);
    const batch = writeBatch(db);
    for (const item of items) {
      batch.delete(doc(db, COLLECTIONS.FLEET_WORK_ORDER_ITEMS, item.id));
    }
    batch.delete(doc(db, COLLECTIONS.FLEET_WORK_ORDERS, id));
    await batch.commit();
  },

  // ============================================================
  // Fleet WorkOrder Items
  // ============================================================

  async addFleetWorkOrderItem(
    workOrderId: string,
    form: fleetWorkOrderItemFormValues,
  ): Promise<FleetWorkOrderItem> {
    const iRef = doc(itemCol());
    const row: Omit<FleetWorkOrderItem, 'id' | 'createdAt' | 'updatedAt'> = {
      workOrderId,
      itemName: form.itemName.trim(),
      itemNumber: form.itemNumber,
      itemPrice: form.itemPrice,
      hsnNo: form.hsnNo.trim(),
    };

    await setDoc(iRef, {
      ...row,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id: iRef.id, ...row };
  },

  async updateFleetWorkOrderItem(
    itemId: string,
    form: fleetWorkOrderItemFormValues,
  ): Promise<FleetWorkOrderItem> {
    const iRef = doc(db, COLLECTIONS.FLEET_WORK_ORDER_ITEMS, itemId);
    const snap = await getDoc(iRef);

    if (!snap.exists()) throw new Error('Item not found');

    const workOrderId = snap.data().workOrderId as string;
    const row: Omit<FleetWorkOrderItem, 'id' | 'createdAt' | 'updatedAt'> = {
      workOrderId,
      itemName: form.itemName.trim(),
      hsnNo: form.hsnNo.trim(),
      itemPrice: form.itemPrice,
      itemNumber: form.itemNumber,
    };
    await updateDoc(iRef, { ...row, updatedAt: serverTimestamp() });
    return { id: itemId, ...row };
  },
  async getFleetWorkOrderItemById(
    id: string,
  ): Promise<FleetWorkOrderItem | null> {
    const ref = doc(db, COLLECTIONS.FLEET_WORK_ORDER_ITEMS, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as FleetWorkOrderItem;
  },
  async deleteFleetWorkOrderItem(itemId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.FLEET_WORK_ORDER_ITEMS, itemId));
  },
};
