import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/lib/constants';
import type { Chalan, VehicleReportRow } from '@/types';

const chalansCol = collection(db, COLLECTIONS.CHALANS);

const GST_RATE = 0.18;

export interface VehicleReportTotals {
  totalAmount: number;
  totalGst: number;
  grandTotal: number;
}

// ============================================================
// Service
// ============================================================
export const vehicleReportService = {
  getReport: async (
    startDate: Date,
    endDate: Date,
    vehicleNumber?: string,
  ): Promise<VehicleReportRow[]> => {
    const start = Timestamp.fromDate(startDate);
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    const end = Timestamp.fromDate(endOfDay);

    const q = query(
      chalansCol,
      where('date', '>=', start),
      where('date', '<=', end),
      orderBy('date', 'asc'),
    );

    const snapshot = await getDocs(q);
    const chalans = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Chalan,
    );

    const rows: VehicleReportRow[] = [];

    for (const chalan of chalans) {
      if (!chalan.items?.length) continue;

      for (const item of chalan.items) {
        // If vehicleNumber filter is active, skip non-matching items
        if (vehicleNumber && item.vehicleNumber !== vehicleNumber) continue;

        const amount = item.itemCosting ?? 0;
        const gst = parseFloat((amount * GST_RATE).toFixed(2));
        const total = parseFloat((amount + gst).toFixed(2));

        rows.push({
          chalanId: chalan.id,
          chalanNumber: chalan.chalanNumber ?? '—',
          date: chalan.date,
          vehicleNumber: item.vehicleNumber ?? '—',
          item: item.item,
          location: chalan.location ?? '—',
          departmentId: chalan.departmentId,
          engineerId: chalan.engineerId,
          runningHours: item.hours,
          unit: item.unit,
          amount,
          gst,
          total,
        });
      }
    }

    return rows;
  },
};

// ============================================================
// Helper: compute totals from rows
// ============================================================
export function computeReportTotals(
  rows: VehicleReportRow[],
): VehicleReportTotals {
  return {
    totalAmount: rows.reduce((s, r) => s + r.amount, 0),
    totalGst: rows.reduce((s, r) => s + r.gst, 0),
    grandTotal: rows.reduce((s, r) => s + r.total, 0),
  };
}
