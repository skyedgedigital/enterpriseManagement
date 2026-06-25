import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { fetchInvoices } from '@/store/slices/fleet-manager/invoiceSlice';
import type { FleetInvoice } from '@/types';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { fetchAdminDepartments } from '@/store/slices/admin/adminDepartmentSlice';

function isFirestoreTimestamp(value: unknown): value is { toDate: () => Date } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  );
}

function formatDate(value: FleetInvoice['createdAt']): string {
  if (isFirestoreTimestamp(value)) {
    return format(value.toDate(), 'dd MMM yyyy');
  }
  return '—';
}

export function FleetInvoiceListPage() {
  const dispatch = useAppDispatch();
  const { items: departments } = useAppSelector(
    (state) => state.adminDepartments,
  );
  const navigate = useNavigate();
  const { invoices, loading, error } = useAppSelector(
    (state) => state.invoices,
  );

  useEffect(() => {
    void dispatch(fetchInvoices());
    void dispatch(fetchAdminDepartments());
  }, [dispatch]);

  const departmentMap = Object.fromEntries(
    departments.map((d) => [d.id, d.name]),
  );

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const columns: Column<FleetInvoice>[] = [
    { key: 'invoiceNumber', header: 'Invoice No' },

    {
      key: 'departmentName',
      header: 'Department',
      render: (row) => departmentMap[row.departmentId] || '—',
    },
    {
      key: 'workOrderNumber',
      header: 'Work Order',
    },
    {
      key: 'servicePeriod',
      header: 'Service Period',
      hideOnMobile: true,
    },
    {
      key: 'grandTotal',
      header: 'Grand Total',
      render: (row) => `₹${Number(row.grandTotal ?? 0).toLocaleString()}`,
    },
    {
      key: 'invoiceType',
      header: 'Type',
      render: (row) => row.invoiceType.toUpperCase(),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => formatDate(row.createdAt),
      hideOnMobile: true,
    },
  ];

  if (loading && invoices.length === 0) {
    return <LoadingState />;
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Invoices'
        description={`${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}`}
        action={
          <Button onClick={() => navigate('/fleet-manager/chalans')}>
            <Plus className='h-4 w-4' />
            Create invoice
          </Button>
        }
      />

      {invoices.length === 0 ? (
        <EmptyState
          title='No invoices yet'
          description='Create invoices from approved chalans in the fleet manager section.'
          action={
            <Button onClick={() => navigate('/fleet-manager/chalans')}>
              <Plus className='h-4 w-4' />
              Create first invoice
            </Button>
          }
        />
      ) : (
        <DataTable
          data={invoices}
          columns={columns}
          searchKey='invoiceNumber'
          searchPlaceholder='Search by invoice number...'
          actions={(row) => (
            <>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => navigate(`/fleet-manager/invoices/${row.id}`)}
              >
                <ExternalLink className='mr-2 h-4 w-4' />
                View
              </Button>
            </>
          )}
        />
      )}
    </div>
  );
}
