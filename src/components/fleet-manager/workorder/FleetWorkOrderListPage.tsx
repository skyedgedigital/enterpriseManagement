import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListOrdered,
  MoreHorizontal,
  Pencil,
  Plus,
  Ruler,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Timestamp } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  fetchFleetWorkOrders,
  deleteFleetWorkOrder,
} from '@/store/slices/fleet-manager/workOrderSlice';
import type { FleetWorkOrder } from '@/types';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { BulkUploadDialog } from '@/components/shared/BulkUploadDialog';
import { createFleetWorkOrderBulkConfig } from '@/lib/excel/bulkUpload/fleetConfigs';
import { FleetWorkOrderExportButton } from '@/components/fleet-manager/shared/FleetWorkOrderExportButton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FleetWorkOrderItemsSheet } from '@/components/fleet-manager/workorder/FleetWorkOrderItemsSheet';

function isFirestoreTimestamp(v: unknown): v is Timestamp {
  return v != null && typeof (v as Timestamp).toDate === 'function';
}

function formatValidity(v: FleetWorkOrder['workOrderValidity']): string {
  if (isFirestoreTimestamp(v)) {
    return format(v.toDate(), 'dd MMM yyyy');
  }
  return '—';
}

export function FleetWorkOrderListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, loading } = useAppSelector((s) => s.fleetWorkOrders);
  const [deleteTarget, setDeleteTarget] = useState<FleetWorkOrder | null>(null);
  const [itemsSheetWo, setItemsSheetWo] = useState<FleetWorkOrder | null>(null);
  const [uomDialogRow, setUomDialogRow] = useState<FleetWorkOrder | null>(null);
  const fleetWorkOrderBulkConfig = useMemo(() => createFleetWorkOrderBulkConfig(), []);

  useEffect(() => {
    void dispatch(fetchFleetWorkOrders());
  }, [dispatch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteFleetWorkOrder(deleteTarget.id));
    if (deleteFleetWorkOrder.fulfilled.match(result)) {
      toast.success('Fleet work order deleted');
      setDeleteTarget(null);
    } else toast.error(result.payload as string);
  };

  const columns: Column<FleetWorkOrder>[] = [
    { key: 'workOrderNumber', header: 'WO Number' },
    {
      key: 'workDescription',
      header: 'Description',
      render: (w) => w.workDescription || '—',
      hideOnMobile: true,
    },
    {
      key: 'workOrderValue',
      header: 'Value',
      render: (w) => `₹${Number(w.workOrderValue).toLocaleString()}`,
    },
    {
      key: 'workOrderBalance',
      header: 'Balance',
      render: (w) => `₹${Number(w.workOrderBalance).toLocaleString()}`,
      hideOnMobile: true,
    },
    {
      key: 'workOrderValidity',
      header: 'Validity',
      render: (w) => formatValidity(w.workOrderValidity),
      hideOnMobile: true,
    },
    {
      key: 'units',
      header: 'Units',
      render: (w) => (w.units?.length ? w.units.join(', ') : '—'),
      hideOnMobile: true,
    },
  ];

  if (loading && items.length === 0) {
    return <LoadingState />;
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Fleet work orders'
        description={`${items.length} work order${items.length !== 1 ? 's' : ''} (fleet)`}
        action={
          <div className="flex gap-2">
            <FleetWorkOrderExportButton workOrders={items} />
            <BulkUploadDialog
              config={fleetWorkOrderBulkConfig}
              onSuccess={() => void dispatch(fetchFleetWorkOrders())}
            />
            <Button onClick={() => navigate('/fleet-manager/work-orders/new')}>
              <Plus className='h-4 w-4' />
              Add fleet work order
            </Button>
          </div>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title='No fleet work orders'
          description='Create a fleet work order to track value, items, and units of measure.'
          action={
            <Button onClick={() => navigate('/fleet-manager/work-orders/new')}>
              <Plus className='h-4 w-4' />
              Add fleet work order
            </Button>
          }
        />
      ) : (
        <DataTable
          data={items}
          columns={columns}
          searchKey='workOrderNumber'
          searchPlaceholder='Search by WO number...'
          actions={(row) => (
            <div
              className='flex items-center justify-end gap-0.5'
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant='ghost'
                size='icon-sm'
                className='shrink-0 border border-gray-200 rounded-sm'
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/fleet-manager/work-orders/${row.id}/edit`);
                }}
                aria-label='Edit fleet work order'
              >
                <Pencil className='h-4 w-4' />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    className='shrink-0 border border-gray-200 rounded-sm'
                    aria-label='More actions'
                  >
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem
                    onSelect={() => setItemsSheetWo(row)}
                  >
                    <ListOrdered className='h-4 w-4' />
                    View items
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setUomDialogRow(row)}>
                    <Ruler className='h-4 w-4' />
                    View UOMs
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant='destructive'
                    onSelect={() => setDeleteTarget(row)}
                  >
                    <Trash2 className='h-4 w-4' />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        />
      )}

      <FleetWorkOrderItemsSheet
        workOrder={itemsSheetWo}
        open={!!itemsSheetWo}
        onOpenChange={(o) => !o && setItemsSheetWo(null)}
      />

      <Dialog
        open={!!uomDialogRow}
        onOpenChange={(o) => !o && setUomDialogRow(null)}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>
              Units of measure — {uomDialogRow?.workOrderNumber ?? ''}
            </DialogTitle>
          </DialogHeader>
          {(uomDialogRow?.units?.length ?? 0) === 0 ? (
            <p className='text-sm text-muted-foreground'>
              No units on this work order.
            </p>
          ) : (
            <ul className='list-inside list-disc space-y-1 text-sm'>
              {uomDialogRow!.units!.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={loading}
        title='Delete this fleet work order?'
        description='The associated line items will be removed. This action cannot be undone.'
      />
    </div>
  );
}
