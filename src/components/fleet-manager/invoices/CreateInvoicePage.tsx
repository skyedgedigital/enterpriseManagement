import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { updateFleetChalan } from '@/store/slices/fleet-manager/chalanSlice';
import { updateFleetWorkOrderEdits } from '@/store/slices/fleet-manager/workOrderSlice';

import { fleetChalanService } from '@/services/fleet-manger/chalan.service';
import { fleetWorkOrderService } from '@/services/fleet-manger/workOrder.service';

import {
  buildMergedItems,
  buildSummaryData,
  calcTax,
  detectInvoiceType,
  buildInvoiceNumber,
  DUMMY_ENTERPRISE,
  fmtDDMMYYYY,
  tsToDate,
} from '@/lib/fleet-manager/invoiceHelpers';

import type {
  Chalan,
  FleetWorkOrder,
  MergedInvoiceItem,
  InvoiceSummaryByItem,
} from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';

import { GenericInvoice } from './GenericInvoice';
import { WMDInvoice } from './WMDInvoice';
import { PHSInvoice } from './PHSInvoice';
import { SummarySheet } from './SummarySheet';
import { invoiceService } from '@/services/fleet-manger/invoice.service';

export function CreateInvoicePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // URL params
  const chalanIdsParam = searchParams.get('chalans') ?? '';
  const chalanIds = chalanIdsParam.split(',').filter(Boolean);
  const departmentName = searchParams.get('dept') ?? '';
  const departmentId = searchParams.get('deptId') ?? '';

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chalans, setChalans] = useState<Chalan[]>([]);
  const [workOrder, setWorkOrder] = useState<FleetWorkOrder | null>(null);
  const [mergedItems, setMergedItems] = useState<MergedInvoiceItem[]>([]);
  const [summaryData, setSummaryData] = useState<InvoiceSummaryByItem[]>([]);
  const [invoiceSerial, setInvoiceSerial] = useState('');
  const [latestSerial, setLatestSerial] = useState<number | null>(null);
  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(null);

  // Computed
  const invoiceType = detectInvoiceType(departmentName);
  const { total, cgst, sgst, grandTotal } = calcTax(mergedItems);

  // Location = first chalan's location
  const location = chalans[0]?.location ?? '';

  // Service period = date range of selected chalans
  const servicePeriod = (() => {
    if (!chalans.length) return '';
    const dates = chalans.map((c) => tsToDate(c.date).getTime());
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    if (min.getTime() === max.getTime()) return fmtDDMMYYYY(min);
    return `${fmtDDMMYYYY(min)} to ${fmtDDMMYYYY(max)}`;
  })();

  const fullInvoiceNumber = invoiceSerial.trim()
    ? buildInvoiceNumber(invoiceSerial)
    : '';

  // Refs for print/pdf
  const invoiceRef = useRef<HTMLDivElement | null>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);

  const printInvoice = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${fullInvoiceNumber}`,
  });

  const printSummary = useReactToPrint({
    contentRef: summaryRef,
    documentTitle: `Summary-${fullInvoiceNumber}`,
  });
  // ── Load data ──
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Fetch all chalans
        const fetchedChalans = await Promise.all(
          chalanIds.map((id) => fleetChalanService.getById(id)),
        );
        setChalans(fetchedChalans);

        // Fetch work order from first chalan
        if (fetchedChalans[0]?.workOrderId) {
          const wo = await fleetWorkOrderService.getById(
            fetchedChalans[0].workOrderId,
          );
          setWorkOrder(wo);
        }

        // Merge items
        const merged = await buildMergedItems(fetchedChalans);
        setMergedItems(merged);

        // Build itemName map for summary
        const itemNameById = new Map(merged.map((m) => [m.itemId, m.itemName]));
        setSummaryData(buildSummaryData(fetchedChalans, itemNameById));

        // Fetch latest serial
        const serial = await invoiceService.getLatestSerial();
        setLatestSerial(serial);
      } catch (err) {
        toast.error('Failed to load invoice data');
      } finally {
        setLoading(false);
      }
    };
    if (chalanIds.length) load();
  }, [chalanIdsParam]);

  const generatePdfBlob = async (
    elementRef: React.RefObject<HTMLDivElement | null>,
  ): Promise<Blob> => {
    const el = elementRef.current;
    if (!el) throw new Error('Document not found for PDF export');

    let safeCss = '';
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        const rules = Array.from(sheet.cssRules || []);
        rules.forEach((rule) => {
          safeCss += rule.cssText + '\n';
        });
      } catch (e) {
        console.log('css error', e);
      }
    });

    // replace oklch colors with safe alternatives
    // needed to do that because html2canvas doesn't support oklch and it was causing the PDF generation to fail

    safeCss = safeCss.replace(
      /background-color:\s*oklch\([^)]+\)/g,
      'background-color: #ffffff',
    );
    safeCss = safeCss.replace(
      /background:\s*oklch\([^)]+\)/g,
      'background: #ffffff',
    );
    safeCss = safeCss.replace(
      /border-color:\s*oklch\([^)]+\)/g,
      'border-color: #e4e4e7',
    ); // Light gray border
    safeCss = safeCss.replace(/color:\s*oklch\([^)]+\)/g, 'color: #000000'); // Text to black
    safeCss = safeCss.replace(/oklch\([^)]+\)/g, '#000000'); // fallback for any other oklch usage

    return new Promise((resolve) => {
      const clone = el.cloneNode(true) as HTMLElement;
      clone.style.width = '1250px';

      const pdf = new jsPDF('l', 'pt', 'a4');
      pdf.html(clone, {
        callback: () => resolve(pdf.output('blob')),
        x: 10,
        y: 10,
        html2canvas: {
          scale: 0.61,
          backgroundColor: '#ffffff',
          useCORS: true,
          onclone: (clonedDoc) => {
            // remove existing styles to prevent CORS issues and ensure consistent styling
            const existingStyles = clonedDoc.querySelectorAll(
              'style, link[rel="stylesheet"]',
            );
            existingStyles.forEach((styleTag) => styleTag.remove());

            // inject safe CSS
            const safeStyleElement = clonedDoc.createElement('style');
            safeStyleElement.innerHTML = safeCss;
            clonedDoc.head.appendChild(safeStyleElement);
          },
        },
        autoPaging: 'text',
      });
    });
  };
  // ── Auto generate ──
  const handleAutoGenerate = () => {
    const next = (latestSerial ?? 0) + 1;
    setInvoiceSerial(String(next));
  };

  const handleSaveInvoice = async () => {
    if (!invoiceSerial.trim()) {
      toast.error('Invoice number is required');
      return;
    }
    if (!chalans.length || !workOrder) {
      toast.error('Data not loaded yet');
      return;
    }

    setSaving(true);

    try {
      const invoiceNum = fullInvoiceNumber;
      const chalanNumbers = chalans.map((c) => c.chalanNumber ?? c.id);

      const invoice = await invoiceService.create({
        invoiceNumber: invoiceNum,
        invoiceType,
        chalanIds,
        chalanNumbers,
        workOrderId: workOrder.id,
        workOrderNumber: workOrder.workOrderNumber,
        departmentId,
        departmentName,
        location,
        servicePeriod,
        mergedItems,
        total,
        cgst,
        sgst,
        grandTotal,
      });

      setSavedInvoiceId(invoice.id);

      // Upload invoice PDF
      const invoiceBlob = await generatePdfBlob(invoiceRef);
      const invoiceUrl = await invoiceService.uploadPdf(
        invoice.id,
        invoiceBlob,
        'invoice',
      );
      console.log('invoiceUrl', invoiceUrl);
      await invoiceService.savePdfUrl(invoice.id, 'pdfUrl', invoiceUrl);

      // Upload summary PDF
      const summaryBlob = await generatePdfBlob(summaryRef);
      const summaryUrl = await invoiceService.uploadPdf(
        invoice.id,
        summaryBlob,
        'summary',
      );
      console.log('summaryUrl', summaryUrl);
      await invoiceService.savePdfUrl(invoice.id, 'summaryPdfUrl', summaryUrl);

      // Mark chalans invoiced
      await Promise.all(
        chalanIds.map((id) =>
          dispatch(updateFleetChalan({ id, patch: { invoiceCreated: true } })),
        ),
      );

      // Deduct work order balance
      const newBalance = Math.max(
        0,
        (workOrder.workOrderBalance ?? 0) - grandTotal,
      );
      await dispatch(
        updateFleetWorkOrderEdits({
          id: workOrder.id,
          form: {
            workDescription: workOrder.workDescription,
            workOrderValue: workOrder.workOrderValue,
            workOrderBalance: newBalance,
            workOrderValidity: fmtDDMMYYYY(
              tsToDate(workOrder.workOrderValidity),
            ),
            shiftStatus: workOrder.shiftStatus,
            units: workOrder.units,
          },
        }),
      );

      toast.success('Invoice created and PDFs uploaded successfully!');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to save invoice and PDFs',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;

  // ── Invoice component selector ──
  const invoiceProps = {
    id: `invoice-${fullInvoiceNumber}`,
    invoiceNumber: fullInvoiceNumber,
    workOrder,
    items: mergedItems,
    total,
    cgst,
    sgst,
    grandTotal,
    location,
    servicePeriod,
    department: departmentName,
    enterprise: DUMMY_ENTERPRISE,
  };

  const InvoiceComponent =
    invoiceType === 'wmd' ? (
      <WMDInvoice ref={invoiceRef} {...invoiceProps} />
    ) : invoiceType === 'phs' ? (
      <PHSInvoice ref={invoiceRef} {...invoiceProps} />
    ) : (
      <GenericInvoice ref={invoiceRef} {...invoiceProps} />
    );

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Create Invoice'
        description={`${chalans.length} chalan${chalans.length !== 1 ? 's' : ''} · ${departmentName} · ${invoiceType.toUpperCase()}`}
        action={
          <Button variant='outline' onClick={() => navigate(-1)}>
            <ArrowLeft className='h-4 w-4' />
            Back
          </Button>
        }
      />

      {/* ── Invoice number + actions ── */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Invoice Number</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-wrap items-end gap-4'>
          <div className='space-y-2'>
            <Label>Serial number</Label>
            <Input
              className='w-40'
              placeholder='e.g. 123'
              value={invoiceSerial}
              onChange={(e) => setInvoiceSerial(e.target.value)}
            />
            {fullInvoiceNumber && (
              <p className='text-xs text-muted-foreground'>
                Full: <span className='font-medium'>{fullInvoiceNumber}</span>
              </p>
            )}
          </div>
          <div className='flex flex-col gap-1'>
            <p className='text-xs text-muted-foreground'>Recommended</p>
            <Button variant='outline' size='sm' onClick={handleAutoGenerate}>
              Auto generate ({(latestSerial ?? 0) + 1})
            </Button>
          </div>
          <Button
            onClick={handleSaveInvoice}
            disabled={saving || !invoiceSerial.trim() || !!savedInvoiceId}
          >
            {saving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {savedInvoiceId ? 'Saved ✓' : 'Save Invoice'}
          </Button>
        </CardContent>
      </Card>

      {/* ── Chalan summary ── */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>
            Selected Chalans ({chalans.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-2'>
            {chalans.map((c) => (
              <span
                key={c.id}
                className='rounded-md bg-muted px-2 py-1 text-sm font-medium'
              >
                {c.chalanNumber ?? c.id.slice(0, 8)}
              </span>
            ))}
          </div>
          <div className='mt-4 grid gap-2 text-sm sm:grid-cols-3'>
            <div>
              <p className='text-muted-foreground'>Work Order</p>
              <p className='font-medium'>{workOrder?.workOrderNumber ?? '—'}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Location</p>
              <p className='font-medium'>{location || '—'}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Service Period</p>
              <p className='font-medium'>{servicePeriod}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Total (excl. GST)</p>
              <p className='font-medium'>₹{total.toFixed(2)}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>CGST + SGST (18%)</p>
              <p className='font-medium'>₹{(cgst + sgst).toFixed(2)}</p>
            </div>
            <div>
              <p className='text-muted-foreground'>Grand Total</p>
              <p className='font-bold text-[#4A90E2]'>
                ₹{grandTotal.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='flex flex-wrap gap-3'>
        <Button
          variant='outline'
          onClick={() => {
            if (!invoiceSerial.trim()) {
              toast.error('Enter invoice number first');
              return;
            }
            printInvoice();
          }}
        >
          <Printer className='mr-2 h-4 w-4' />
          Print / Download Invoice PDF
        </Button>
        <Button
          variant='outline'
          onClick={() => {
            if (!invoiceSerial.trim()) {
              toast.error('Enter invoice number first');
              return;
            }
            printSummary();
          }}
        >
          <Printer className='mr-2 h-4 w-4' />
          Print / Download Summary PDF
        </Button>
      </div>

      {/* ── Invoice preview ── */}
      <div className='overflow-x-auto rounded-lg border'>
        {InvoiceComponent}
      </div>

      {/* ── Summary sheet preview ── */}
      <div className='overflow-x-auto rounded-lg border'>
        <SummarySheet
          ref={summaryRef}
          id={`summary-${fullInvoiceNumber}`}
          invoiceNumber={fullInvoiceNumber}
          summaryData={summaryData}
        />
      </div>
    </div>
  );
}
