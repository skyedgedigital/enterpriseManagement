import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import type {
  Chalan,
  MergedInvoiceItem,
  InvoiceSummaryByItem,
  InvoiceType,
  EnterpriseInfo,
} from '@/types';
import { fleetWorkOrderService } from '@/services/fleet-manger/workOrder.service';

// ── Enterprise dummy data (baad mein slice se aayega) ──
export const DUMMY_ENTERPRISE: EnterpriseInfo = {
  name: 'Enterprises Management',
  address: 'Sonari, Jamshedpur 831011',
  mobile: '6754133471, 9984973465',
  email: 'enterprisemanagement@gmail.com',
  gstin: '20XXXXX1234X1ZX',
  pan: 'XXXXX1234X',
  vendorCode: 'V-1234',
};

// ── Invoice year string e.g. "2024-25" ──
export function getInvoiceYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-based
  // Indian FY: April to March
  if (month >= 4) {
    return `${year}-${String(year + 1).slice(2)}`;
  }
  return `${year - 1}-${String(year).slice(2)}`;
}

// ── Full invoice number ──
export function buildInvoiceNumber(serial: string): string {
  return `SE/${getInvoiceYear()}/${serial.trim()}`;
}

// ── Detect invoice type from department name ──
export function detectInvoiceType(deptName: string): InvoiceType {
  const lower = deptName.toLowerCase();
  if (lower.includes('wmd')) return 'wmd';
  if (lower.includes('public health') || lower.includes('phs')) return 'phs';
  return 'generic';
}

// ── Firestore Timestamp → Date ──
export function tsToDate(ts: Timestamp): Date {
  return ts.toDate();
}

// ── Format date dd/MM/yyyy ──
export function fmtDDMMYYYY(d: Date): string {
  return format(d, 'dd/MM/yyyy');
}

// ── Today formatted ──
export function todayFormatted(): string {
  return fmtDDMMYYYY(new Date());
}

// ── Merge items from multiple chalans ──
// Same itemId + same unit → merge (add hours + itemCost)
// Same itemId + different unit → separate entry
export async function buildMergedItems(
  chalans: Chalan[],
): Promise<MergedInvoiceItem[]> {
  // key = `itemId::unit`
  const map = new Map<
    string,
    { itemId: string; unit: string; hours: number; itemCost: number }
  >();
  for (const chalan of chalans) {
    for (const row of chalan.items) {
      const key = `${row.item}::${row.unit}`;
      const existing = map.get(key);
      if (existing) {
        existing.hours += row.hours;
        existing.itemCost += row.itemCosting;
      } else {
        map.set(key, {
          itemId: row.item,
          unit: row.unit,
          hours: row.hours,
          itemCost: row.itemCosting,
        });
      }
    }
  }

  // Now fetch item details for each unique itemId
  const itemDetailCache = new Map<
    string,
    { itemName: string; itemNumber: number; itemPrice: number; hsnNo: string }
  >();

  for (const entry of map.values()) {
    if (!itemDetailCache.has(entry.itemId)) {
      const detail = await fleetWorkOrderService.getFleetWorkOrderItemById(
        entry.itemId,
      );
      if (detail) {
        itemDetailCache.set(entry.itemId, {
          itemName: detail.itemName,
          itemNumber: detail.itemNumber,
          itemPrice: detail.itemPrice,
          hsnNo: detail.hsnNo ?? '',
        });
      }
    }
  }

  const result: MergedInvoiceItem[] = [];
  for (const [, entry] of map) {
    const detail = itemDetailCache.get(entry.itemId);
    if (!detail) continue;
    result.push({
      itemId: entry.itemId,
      itemName: detail.itemName,
      itemNumber: detail.itemNumber,
      itemPrice: detail.itemPrice,
      hsnNo: detail.hsnNo,
      unit: entry.unit,
      hours: entry.hours,
      itemCost: entry.itemCost,
    });
  }

  return result;
}

// ── Tax calculations ──
export function calcTax(items: MergedInvoiceItem[]) {
  const total = items.reduce((s, i) => s + i.itemCost, 0);
  const cgst = parseFloat((total * 0.09).toFixed(2));
  const sgst = parseFloat((total * 0.09).toFixed(2));
  const grandTotal = parseFloat((total + cgst + sgst).toFixed(2));
  return { total, cgst, sgst, grandTotal };
}

// ── Summary sheet data ──
// Groups by itemName → list of {chalanNumber, chalanDate, location, workingHour}
export function buildSummaryData(
  chalans: Chalan[],
  itemNameById: Map<string, string>,
): InvoiceSummaryByItem[] {
  const map = new Map<string, InvoiceSummaryByItem>();

  for (const chalan of chalans) {
    const chalanDate = tsToDate(chalan.date);
    for (const row of chalan.items) {
      const itemDescription = itemNameById.get(row.item) ?? row.item;
      const existing = map.get(itemDescription);
      const detail: import('@/types').InvoiceSummaryRow = {
        chalanNumber: chalan.chalanNumber ?? chalan.id,
        chalanDate,
        location: chalan.location ?? '',
        workingHour: row.hours,
      };
      if (existing) {
        existing.details.push(detail);
      } else {
        map.set(itemDescription, {
          itemDescription,
          details: [detail],
        });
      }
    }
  }

  // Sort each group by date
  const result = Array.from(map.values());
  for (const group of result) {
    group.details.sort(
      (a, b) => a.chalanDate.getTime() - b.chalanDate.getTime(),
    );
  }
  return result;
}

// ── Number to words (Indian style) ──
export function numberToWords(amount: number): string {
  if (typeof amount !== 'number' || amount < 0) return 'Invalid input';

  const units = [
    '',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ];
  const tens = [
    '',
    '',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty',
    'seventy',
    'eighty',
    'ninety',
  ];
  const thousands = ['', 'thousand', 'million'];

  function convertHundreds(n: number): string {
    let res = '';
    if (n > 99) {
      res += units[Math.floor(n / 100)] + ' hundred ';
      n %= 100;
    }
    if (n > 19) {
      res += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) res += units[n] + ' ';
    return res.trim();
  }

  function convert(n: number): string {
    if (n === 0) return 'zero';
    let word = '';
    let i = 0;
    while (n > 0) {
      if (n % 1000 !== 0) {
        word = convertHundreds(n % 1000) + ' ' + thousands[i] + ' ' + word;
      }
      n = Math.floor(n / 1000);
      i++;
    }
    return word.trim();
  }

  const [whole, dec] = amount.toFixed(2).split('.');
  let words = convert(parseInt(whole, 10)) + ' Rupees';
  if (parseInt(dec, 10) > 0) {
    words += ' and ' + convert(parseInt(dec, 10)) + ' Paise';
  }
  return words;
}
