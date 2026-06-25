import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  fetchConsumables,
  deleteConsumable,
} from '@/store/slices/fleet-manager/consumable';
import type { Consumable } from '@/types';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { LoadingState } from '@/components/shared/LoadingState';
import { fetchVehicles } from '@/store/slices/fleet-manager/vehicleSlice';
import { EmptyState } from '@/components/shared/EmptyState';
import { BulkUploadDialog } from '@/components/shared/BulkUploadDialog';
import { ExportExcelButton } from '@/components/shared/ExportExcelButton';
import { createConsumableBulkConfig } from '@/lib/excel/bulkUpload/fleetConfigs';
import { consumableExportConfig } from '@/lib/excel/bulkUpload/fleetExportConfigs';

const fmtTs = (ts?: Timestamp) =>
  ts ? format(ts.toDate(), 'dd MMM yyyy') : '—';
const fmtInr = (amount: number) => `₹${Number(amount).toLocaleString('en-IN')}`;

export function ConsumableListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.consumables);
  const vehicles = useAppSelector((state) => state.vehicles.items);
  const [deleteTarget, setDeleteTarget] = useState<Consumable | null>(null);
  const consumableBulkConfig = useMemo(() => createConsumableBulkConfig(), []);

  useEffect(() => {
    dispatch(fetchConsumables());
    dispatch(fetchVehicles());
  }, [dispatch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteConsumable(deleteTarget.id));
    if (deleteConsumable.fulfilled.match(result)) {
      toast.success('Consumable deleted');
      setDeleteTarget(null);
    } else {
      toast.error((result.payload as string) || 'Delete failed');
    }
  };

  const columns: Column<Consumable>[] = [
    { key: 'vehicleNumber', header: 'Vehicle' },
    { key: 'consumableItem', header: 'Item' },
    { key: 'quantity', header: 'Qty' },
    {
      key: 'amount',
      header: 'Amount',
      render: (v) => fmtInr(v.amount),
    },
    {
      key: 'date',
      header: 'Date',
      render: (v) => fmtTs(v.date),
    },
  ];

  if (loading && items.length === 0) return <LoadingState />;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Consumables'
        description='Track consumable items and expenses'
        action={
          <div className="flex gap-2">
            <ExportExcelButton
              config={consumableExportConfig}
              items={items}
              context={{ vehicles }}
            />
            <BulkUploadDialog
              config={consumableBulkConfig}
              context={{ vehicles }}
              onSuccess={() => dispatch(fetchConsumables())}
            />
            <Button onClick={() => navigate('/fleet-manager/consumables/new')}>
              <Plus className='h-4 w-4' />
              Add Consumable
            </Button>
          </div>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title='No consumables'
          description='Add your first consumable entry to get started.'
          action={
            <Button onClick={() => navigate('/fleet-manager/consumables/new')}>
              <Plus className='h-4 w-4' />
              Add Consumable
            </Button>
          }
        />
      ) : (
        <DataTable
          data={items}
          columns={columns}
          searchKey='vehicleNumber'
          searchPlaceholder='Search by vehicle number...'
          actions={(consumable) => (
            <>
              <Button
                variant='ghost'
                size='icon-sm'
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/fleet-manager/consumables/${consumable.id}/edit`);
                }}
              >
                <Pencil className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon-sm'
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(consumable);
                }}
              >
                <Trash2 className='h-4 w-4 text-destructive' />
              </Button>
            </>
          )}
        />
      )}

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}
