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
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
};
