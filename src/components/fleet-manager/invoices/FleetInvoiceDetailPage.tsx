import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { toast } from 'sonner';

import { invoiceService } from '@/services/fleet-manger/invoice.service';
import type { FleetInvoice } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { fetchAdminDepartments } from '@/store/slices/admin/adminDepartmentSlice';

export function FleetInvoiceDetailPage() {
  const { items: departments } = useAppSelector(
    (state) => state.adminDepartments,
  );
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<FleetInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    invoiceService
      .getById(id)
      .then((data) => setInvoice(data))
      .catch((err) => {
        toast.error(
          err instanceof Error ? err.message : 'Unable to load invoice',
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    dispatch(fetchAdminDepartments());
  }, [dispatch]);

  const departmentMap = Object.fromEntries(
    departments.map((d) => [d.id, d.name]),
  );

  if (loading) return <LoadingState />;
  if (!invoice)
    return (
      <div className='p-6 text-sm text-muted-foreground'>
        Invoice not found.
      </div>
    );

  return (
    <div className='space-y-6'>
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        description={`Saved invoice for ${invoice.departmentName}`}
        action={
          <Button
            variant='outline'
            onClick={() => navigate('/fleet-manager/invoices')}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to invoices
          </Button>
        }
      />

      {/* <div className='grid gap-6 xl:grid-cols-[1.5fr_1fr]'> */}
      <Card>
        <CardHeader>
          <div className='flex justify-between items-'>
            <CardTitle>Invoice summary</CardTitle>
            <div className=' flex flex-wrap gap-3'>
              {invoice.pdfUrl ? (
                <a
                  href={invoice.pdfUrl}
                  target='_blank'
                  rel='noreferrer'
                  download
                >
                  <Button>
                    <Download className='mr-2 h-4 w-4' />
                    Download Invoice
                  </Button>
                </a>
              ) : null}

              {invoice.summaryPdfUrl ? (
                <a
                  href={invoice.summaryPdfUrl}
                  target='_blank'
                  rel='noreferrer'
                  download
                >
                  <Button variant='outline'>
                    <Download className='mr-2 h-4 w-4' />
                    Download Summary
                  </Button>
                </a>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className='grid gap-4 text-sm'>
          <div className='grid gap-1'>
            <p className='text-xs text-muted-foreground'>Invoice number</p>
            <p className='font-medium'>{invoice.invoiceNumber}</p>
          </div>

          <div className='grid gap-1 sm:grid-cols-2'>
            <div>
              <p className='text-xs text-muted-foreground'>Type</p>
              <p className='font-medium'>{invoice.invoiceType.toUpperCase()}</p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Department</p>
              <p className='font-medium'>
                {departmentMap[invoice.departmentId] || 'Unknown'}
              </p>
            </div>
          </div>

          <div className='grid gap-1 sm:grid-cols-2'>
            <div>
              <p className='text-xs text-muted-foreground'>Work order</p>
              <p className='font-medium'>{invoice.workOrderNumber}</p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Service period</p>
              <p className='font-medium'>{invoice.servicePeriod}</p>
            </div>
          </div>

          <div className='grid gap-1 sm:grid-cols-2'>
            <div>
              <p className='text-xs text-muted-foreground'>Total</p>
              <p className='font-medium'>₹{invoice.total.toLocaleString()}</p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>GST (18%)</p>
              <p className='font-medium'>
                ₹{(invoice.cgst + invoice.sgst).toLocaleString()}
              </p>
            </div>
          </div>

          <div className='grid gap-1'>
            <p className='text-xs text-muted-foreground'>Grand total</p>
            <p className='text-lg font-semibold'>
              ₹{invoice.grandTotal.toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
      {/* </div> */}

      <Card>
        <CardHeader>
          <CardTitle>Invoice preview</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Tabs defaultValue='invoice'>
            <TabsList>
              <TabsTrigger value='invoice'>Invoice</TabsTrigger>
              <TabsTrigger value='summary'>Summary</TabsTrigger>
            </TabsList>

            <TabsContent value='invoice' className='min-h-130'>
              {invoice.pdfUrl ? (
                <iframe
                  src={invoice.pdfUrl}
                  title='Invoice preview'
                  className='h-130 w-full rounded-md border'
                />
              ) : (
                <div className='flex h-130 items-center justify-center rounded-md border border-dashed border-muted p-8 text-sm text-muted-foreground'>
                  Invoice PDF unavailable.
                </div>
              )}
            </TabsContent>

            <TabsContent value='summary' className='min-h-130'>
              {invoice.summaryPdfUrl ? (
                <iframe
                  src={invoice.summaryPdfUrl}
                  title='Summary preview'
                  className='h-130 w-full rounded-md border'
                />
              ) : (
                <div className='flex h-130 items-center justify-center rounded-md border border-dashed border-muted p-8 text-sm text-muted-foreground'>
                  Summary PDF unavailable.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
