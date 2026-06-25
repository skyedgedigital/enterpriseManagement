import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, RotateCcw } from 'lucide-react';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  deleteAllotment,
  fetchAllotments,
  fetchTools,
  updateAllotment,
} from '@/store/slices/fleet-manager/toolStoreManagementSlice';
import type { ToolStoreManagement } from '@/types';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { BulkUploadDialog } from '@/components/shared/BulkUploadDialog';
import { ExportExcelButton } from '@/components/shared/ExportExcelButton';
import { createToolAllotmentBulkConfig } from '@/lib/excel/bulkUpload/fleetConfigs';
import { toolAllotmentExportConfig } from '@/lib/excel/bulkUpload/fleetExportConfigs';
import { fetchVehicles } from '@/store/slices/fleet-manager/vehicleSlice';
import {
  formatTimestampLocale,
  toDateSafe,
} from '@/components/shared/utils';

const isOverdue = (returnTs: unknown): boolean => {
  const date = toDateSafe(returnTs);
  return date != null && date < new Date();
};

export function ToolAllotmentListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items: vehicles } = useAppSelector((state) => state.vehicles);
  const tools = useAppSelector((state) => state.tools.tools);
  const { allotments, loading } = useAppSelector(
    (state) => state.toolStoreManagement,
  );
  const allotmentBulkConfig = useMemo(() => createToolAllotmentBulkConfig(), []);
  const [deleteTarget, setDeleteTarget] = useState<ToolStoreManagement | null>(
    null,
  );

  useEffect(() => {
    dispatch(fetchAllotments());
    dispatch(fetchVehicles());
    dispatch(fetchTools());
  }, [dispatch]);

  const vehicleMapped = Object.fromEntries(
    vehicles.map((v) => [
      v.id,
      { name: v.vehicleType, number: v.vehicleNumber },
    ]),
  );

  const handleMarkReturned = async (allotment: ToolStoreManagement) => {
    const result = await dispatch(
      updateAllotment({ id: allotment.id, data: { status: 'returned' } }),
    );
    if (updateAllotment.fulfilled.match(result)) {
      toast.success('Marked as returned');
    } else {
      toast.error(result.payload as string);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteAllotment(deleteTarget.id));
    if (deleteAllotment.fulfilled.match(result)) {
      toast.success('Allotment deleted');
      setDeleteTarget(null);
    } else {
      toast.error(result.payload as string);
    }
  };

  const columns: Column<ToolStoreManagement>[] = [
    {
      key: 'vehicleId',
      header: 'Vehicle',
      render: (a) => (
        <span className='font-medium'>
          {vehicleMapped[a.vehicleId]?.name ?? '-'}
        </span>
      ),
    },
    {
      key: 'vehicleNumber',
      header: 'Vehicle Number',
      render: (a) => (
        <span className='font-medium'>
          {vehicleMapped[a.vehicleId]?.number ?? '—'}
        </span>
      ),
    },
    { key: 'tool', header: 'Tool' },
    { key: 'quantity', header: 'Qty' },
    {
      key: 'dateOfAllotment',
      header: 'Allotted On',
      render: (a) => formatTimestampLocale(a.dateOfAllotment),
    },
    {
      key: 'dateOfReturn',
      header: 'Return By',
      render: (a) => {
        const overdue = a.status === 'active' && isOverdue(a.dateOfReturn);
        return (
          <span className={overdue ? 'font-medium text-destructive' : ''}>
            {formatTimestampLocale(a.dateOfReturn)}
            {overdue && <span className='ml-1 text-xs'>(Overdue)</span>}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => {
        const overdue = a.status === 'active' && isOverdue(a.dateOfReturn);
        if (a.status === 'returned') {
          return (
            <Badge
              variant='outline'
              className='border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
            >
              Returned
            </Badge>
          );
        }
        if (overdue) {
          return <Badge variant='destructive'>Overdue</Badge>;
        }
        return (
          <Badge
            variant='outline'
            className='border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
          >
            Active
          </Badge>
        );
      },
    },
  ];

  if (loading && allotments.length === 0) return <LoadingState />;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Tool Allotments'
        description='Manage tool allotments to vehicles'
        action={
          <div className="flex gap-2">
            <ExportExcelButton
              config={toolAllotmentExportConfig}
              items={allotments}
              context={{ vehicles, tools }}
            />
            <BulkUploadDialog
              config={allotmentBulkConfig}
              context={{ vehicles, tools }}
              onSuccess={() => dispatch(fetchAllotments())}
            />
            <Button
              onClick={() =>
                navigate('/fleet-manager/store-management/allotments/new')
              }
            >
              <Plus className='h-4 w-4' />
              New Allotment
            </Button>
          </div>
        }
      />

      {allotments.length === 0 ? (
        <EmptyState
          title='No Allotments'
          description='Create your first tool allotment to get started.'
          action={
            <Button
              onClick={() =>
                navigate('/fleet-manager/store-management/allotments/new')
              }
            >
              <Plus className='h-4 w-4' />
              New Allotment
            </Button>
          }
        />
      ) : (
        <DataTable
          data={allotments}
          columns={columns}
          searchKey='tool'
          searchPlaceholder='Search by tool name...'
          actions={(allotment) => (
            <>
              {allotment.status === 'active' && (
                <Button
                  variant='ghost'
                  size='icon-sm'
                  title='Mark as returned'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkReturned(allotment);
                  }}
                >
                  <RotateCcw className='h-4 w-4 text-green-600' />
                </Button>
              )}
              {/* <Button
                variant='ghost'
                size='icon-sm'
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(allotment);
                }}
              >
                <Trash2 className='h-4 w-4 text-destructive' />
              </Button> */}
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
