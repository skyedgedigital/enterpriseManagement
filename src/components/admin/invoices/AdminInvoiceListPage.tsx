import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Save, Loader2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import type { FleetInvoice } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  fetchInvoices,
  updateInvoiceMeta,
} from '@/store/slices/fleet-manager/invoiceSlice';

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
const fmtTs = (ts?: Timestamp) =>
  ts ? format(ts.toDate(), 'dd MMM yyyy') : '—';

const fmtAmt = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 });

// Financial year from date
function getFinancialYear(ts?: Timestamp): string {
  if (!ts) return '—';
  const d = ts.toDate();
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed
  const startYear = month >= 3 ? year : year - 1;
  const endYear = startYear + 1;
  return `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`;
}

// ----------------------------------------------------------------
// Inline edit row component
// ----------------------------------------------------------------
function InvoiceMetaRow({ invoice }: { invoice: FleetInvoice }) {
  const dispatch = useAppDispatch();

  const [sesNo, setSesNo] = useState(invoice.sesNo ?? '');
  const [doNo, setDoNo] = useState(invoice.doNo ?? '');
  const [taxNumber, setTaxNumber] = useState(invoice.taxNumber ?? '');
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Mark dirty when any field changes from saved value
  const handleChange = (field: 'ses' | 'do' | 'tax', value: string) => {
    if (field === 'ses') setSesNo(value);
    if (field === 'do') setDoNo(value);
    if (field === 'tax') setTaxNumber(value);
    setIsDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await dispatch(
      updateInvoiceMeta({
        invoiceId: invoice.id,
        sesNo,
        doNo,
        taxNumber,
      }),
    );
    setSaving(false);
    if (updateInvoiceMeta.fulfilled.match(result)) {
      toast.success('Invoice updated');
      setIsDirty(false);
    } else {
      toast.error(result.payload as string);
    }
  };

  return (
    <tr className='hover:bg-muted/30 align-top'>
      {/* Invoice Number */}
      <td className='px-4 py-3'>
        <span className='font-medium'>{invoice.invoiceNumber}</span>
        <div className='mt-0.5 text-xs text-muted-foreground'>
          FY {getFinancialYear(invoice.createdAt)}
        </div>
      </td>

      {/* Created */}
      <td className='px-4 py-3 text-muted-foreground'>
        {fmtTs(invoice.createdAt)}
      </td>

      {/* Department */}
      <td className='px-4 py-3 text-muted-foreground'>
        {invoice.departmentName || '—'}
      </td>

      {/* Location */}
      <td className='px-4 py-3 text-muted-foreground'>
        {invoice.location || '—'}
      </td>

      {/* Grand Total */}
      <td className='px-4 py-3 font-medium'>{fmtAmt(invoice.grandTotal)}</td>

      {/* PDF link */}
      <td className='px-4 py-3'>
        {invoice.pdfUrl ? (
          <a
            href={invoice.pdfUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1 text-sm text-blue-600 hover:underline'
          >
            <ExternalLink className='h-3.5 w-3.5' />
            View
          </a>
        ) : (
          <span className='text-xs text-muted-foreground'>—</span>
        )}
      </td>

      {/* SES No — inline editable */}
      <td className='px-4 py-3'>
        <Input
          value={sesNo}
          onChange={(e) => handleChange('ses', e.target.value)}
          placeholder='SES No.'
          className='h-8 w-32 text-sm'
        />
      </td>

      {/* DO No — inline editable */}
      <td className='px-4 py-3'>
        <Input
          value={doNo}
          onChange={(e) => handleChange('do', e.target.value)}
          placeholder='D.O. No.'
          className='h-8 w-32 text-sm'
        />
      </td>

      {/* Tax Number — inline editable */}
      <td className='px-4 py-3'>
        <Input
          value={taxNumber}
          onChange={(e) => handleChange('tax', e.target.value)}
          placeholder={`SE/${getFinancialYear(invoice.createdAt)}/...`}
          className='h-8 w-40 text-sm'
        />
      </td>

      {/* Save button */}
      <td className='px-4 py-3'>
        <Button size='sm' disabled={!isDirty || saving} onClick={handleSave}>
          {saving ? (
            <Loader2 className='h-3.5 w-3.5 animate-spin' />
          ) : (
            <Save className='h-3.5 w-3.5' />
          )}
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </td>
    </tr>
  );
}

// ----------------------------------------------------------------
// Main Page
// ----------------------------------------------------------------
export default function AdminInvoiceListPage() {
  const dispatch = useAppDispatch();
  const { invoices, loading } = useAppSelector((state) => state.invoices);

  useEffect(() => {
    dispatch(fetchInvoices());
  }, [dispatch]);

  // Stats
  const totalGrandTotal = invoices.reduce((s, i) => s + i.grandTotal, 0);
  const pendingCount = invoices.filter(
    (i) => !i.sesNo && !i.doNo && !i.taxNumber,
  ).length;
  const updatedCount = invoices.filter(
    (i) => i.sesNo || i.doNo || i.taxNumber,
  ).length;

  if (loading && invoices.length === 0) return <LoadingState />;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Invoice Management'
        description='View all invoices and update SES / D.O. / Tax numbers'
      />

      {/* Summary cards */}
      {invoices.length > 0 && (
        <div className='grid grid-cols-3 gap-3'>
          <Card className='border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950'>
            <CardContent className='p-4'>
              <p className='text-xs text-muted-foreground'>Total Invoices</p>
              <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                {invoices.length}
              </p>
            </CardContent>
          </Card>
          <Card className='border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950'>
            <CardContent className='p-4'>
              <p className='text-xs text-muted-foreground'>Total Value</p>
              <p className='text-2xl font-bold text-orange-600 dark:text-orange-400'>
                {fmtAmt(totalGrandTotal)}
              </p>
            </CardContent>
          </Card>
          <Card className='border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'>
            <CardContent className='p-4'>
              <p className='text-xs text-muted-foreground'>Updated / Pending</p>
              <p className='text-2xl font-bold text-green-600 dark:text-green-400'>
                {updatedCount}
                <span className='ml-1 text-sm font-normal text-muted-foreground'>
                  / {pendingCount} pending
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      {invoices.length === 0 ? (
        <EmptyState
          title='No invoices found'
          description='No invoices have been created yet.'
        />
      ) : (
        <div className='overflow-x-auto rounded-lg border'>
          <table className='w-full text-sm'>
            <thead className='border-b bg-muted/50'>
              <tr>
                <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                  Invoice No.
                </th>
                <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                  Date
                </th>
                <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                  Department
                </th>
                <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                  Location
                </th>
                <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                  Grand Total
                </th>
                <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                  PDF
                </th>
                <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                  SES No.
                </th>
                <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                  D.O. No.
                </th>
                <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                  Tax No.
                </th>
                <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                  Action
                </th>
              </tr>
            </thead>
            <tbody className='divide-y'>
              {invoices.map((invoice) => (
                <InvoiceMetaRow key={invoice.id} invoice={invoice} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
