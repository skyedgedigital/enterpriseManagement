import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useDebouncedCollectionSearch } from '@/hooks/useDebouncedCollectionSearch';
import type { FleetInvoice } from '@/types';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { DataTable, type Column } from '@/components/shared/DataTable';
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
  const { error } = useAppSelector((state) => state.invoices);
  const {
    query,
    setQuery,
    items,
    allItems,
    initialLoading,
    searchLoading,
    error: searchError,
  } = useDebouncedCollectionSearch<FleetInvoice>('invoices');

  useEffect(() => {
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

  useEffect(() => {
    if (searchError) {
      toast.error(searchError);
    }
  }, [searchError]);

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

  if (initialLoading && allItems.length === 0) return <LoadingState />;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Invoices'
        description={
          query.trim()
            ? `${items.length} match${items.length !== 1 ? 'es' : ''}`
            : `${allItems.length} invoice${allItems.length !== 1 ? 's' : ''} total`
        }
        action={
          <Button onClick={() => navigate('/fleet-manager/chalans')}>
            <Plus className='h-4 w-4' />
            Create invoice
          </Button>
        }
      />

      {allItems.length === 0 ? (
        <EmptyState
          title='No invoices'
          description='Create your first invoice to get started.'
          action={
            <Button onClick={() => navigate('/fleet-manager/chalans')}>
              <Plus className='h-4 w-4' />
              Create invoice
            </Button>
          }
        />
      ) : (
      <DataTable
        data={items}
        columns={columns}
        searchPlaceholder='Search by invoice number...'
        searchValue={query}
        onSearchChange={setQuery}
        searchLoading={searchLoading}
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
