import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
  runTransaction,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import type { FleetInvoice, MergedInvoiceItem } from '@/types';

const invoiceCol = () => collection(db, COLLECTIONS.INVOICES);
const invoiceDoc = (id: string) => doc(db, COLLECTIONS.INVOICES, id);

export type CreateInvoicePayload = {
  invoiceNumber: string;
  invoiceType: FleetInvoice['invoiceType'];
  chalanIds: string[];
  chalanNumbers: string[];
  workOrderId: string;
  workOrderNumber: string;
  departmentId: string;
  departmentName: string;
  location: string;
  servicePeriod: string;
  mergedItems: MergedInvoiceItem[];
  total: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
};

export const invoiceService = {
  async checkInvoiceNumberExists(invoiceNumber: string): Promise<boolean> {
    const q = query(invoiceCol(), where('invoiceNumber', '==', invoiceNumber));
    const snap = await getDocs(q);
    return !snap.empty;
  },

  async create(payload: CreateInvoicePayload): Promise<FleetInvoice> {
    const exists = await this.checkInvoiceNumberExists(payload.invoiceNumber);
    if (exists) {
      throw new Error(
        `Invoice number "${payload.invoiceNumber}" already exists.`,
      );
    }

    const newRef = doc(invoiceCol());
    const data: Omit<FleetInvoice, 'id'> = {
      ...payload,
      createdAt: undefined,
      updatedAt: undefined,
    };

    await setDoc(newRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id: newRef.id, ...data };
  },

  async uploadPdf(
    invoiceId: string,
    blob: Blob,
    type: 'invoice' | 'summary',
  ): Promise<string> {
    const fileName = `${type}-${invoiceId}.pdf`;
    const storageRef = ref(storage, `invoices/${invoiceId}/${fileName}`);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  },

  async savePdfUrl(
    invoiceId: string,
    field: 'pdfUrl' | 'summaryPdfUrl',
    url: string,
  ): Promise<void> {
    await updateDoc(invoiceDoc(invoiceId), {
      [field]: url,
      updatedAt: serverTimestamp(),
    });
  },

  async getAll(): Promise<FleetInvoice[]> {
    const q = query(invoiceCol(), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FleetInvoice);
  },

  async getById(id: string): Promise<FleetInvoice> {
    const snap = await getDoc(invoiceDoc(id));
    if (!snap.exists()) throw new Error('Invoice not found');
    return { id: snap.id, ...snap.data() } as FleetInvoice;
  },

  async getLatestSerial(): Promise<number> {
    const q = query(invoiceCol(), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (snap.empty) return 0;
    const latest = snap.docs[0].data() as FleetInvoice;
    // invoiceNumber format: "SE/2024-25/123"
    const parts = latest.invoiceNumber?.split('/');
    const serial = parseInt(parts?.[2] ?? '0', 10);
    return isNaN(serial) ? 0 : serial;
  },

  async updateInvoiceMeta(
    invoiceId: string,
    data: { sesNo?: string; doNo?: string; taxNumber?: string },
  ): Promise<void> {
    const patch: Record<string, string> = {};
    if (data.sesNo !== undefined) patch.sesNo = data.sesNo;
    if (data.doNo !== undefined) patch.doNo = data.doNo;
    if (data.taxNumber !== undefined) patch.taxNumber = data.taxNumber;
    await updateDoc(invoiceDoc(invoiceId), {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Removes the invoice, restores the work order balance, and unlocks chalans.
   * Firestore writes commit together so a retry cannot add the balance twice.
   * PDF deletes run after that and a missing file is ignored.
   */
  async delete(id: string): Promise<void> {
    const invRef = invoiceDoc(id);

    await runTransaction(db, async (tx) => {
      const invSnap = await tx.get(invRef);
      if (!invSnap.exists()) throw new Error('Invoice not found');
      const invoice = invSnap.data() as FleetInvoice;
      if (!invoice.workOrderId) {
        throw new Error('Invoice has no work order');
      }

      const woRef = doc(db, COLLECTIONS.FLEET_WORK_ORDERS, invoice.workOrderId);
      const woSnap = await tx.get(woRef);
      if (!woSnap.exists()) throw new Error('Work order not found');

      const chalanIds = invoice.chalanIds ?? [];
      const chalanRefs = chalanIds.map((chalanId) =>
        doc(db, COLLECTIONS.CHALANS, chalanId),
      );
      const chalanSnaps: DocumentSnapshot[] = [];
      for (const chalanRef of chalanRefs) {
        chalanSnaps.push(await tx.get(chalanRef));
      }

      const balance = Number(woSnap.data().workOrderBalance ?? 0);
      const grandTotal = Number(invoice.grandTotal ?? 0);
      if (!Number.isFinite(balance) || !Number.isFinite(grandTotal)) {
        throw new Error('Invoice grand total or work order balance is invalid');
      }
      tx.update(woRef, {
        workOrderBalance: balance + grandTotal,
        updatedAt: serverTimestamp(),
      });

      chalanSnaps.forEach((snap, index) => {
        if (!snap.exists()) return;
        tx.update(chalanRefs[index], {
          invoiceCreated: false,
          updatedAt: serverTimestamp(),
        });
      });

      tx.delete(invRef);
    });

    await Promise.all(
      [
        `invoices/${id}/invoice-${id}.pdf`,
        `invoices/${id}/summary-${id}.pdf`,
      ].map(async (path) => {
        try {
          await deleteObject(ref(storage, path));
        } catch (error) {
          console.warn('Failed to delete invoice file:', path, error);
        }
      }),
    );
  },
};
