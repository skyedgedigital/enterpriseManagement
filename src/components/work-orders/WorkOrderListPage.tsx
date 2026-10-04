import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useDebouncedCollectionSearch } from '@/hooks/useDebouncedCollectionSearch';
import { deleteWorkOrder } from '@/store/slices/workOrderSlice';
import { fetchDepartments } from '@/store/slices/departmentSlice';
import type { WorkOrder } from '@/types';
import { getStateDisplayName } from '@/lib/sanitize';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { BulkUploadDialog } from '@/components/shared/BulkUploadDialog';
import { ExportExcelButton } from '@/components/shared/ExportExcelButton';
import { createWorkOrderBulkConfig } from '@/lib/excel/bulkUpload/masterDataConfigs';
import { workOrderExportConfig } from '@/lib/excel/bulkUpload/masterDataExportConfigs';

export function WorkOrderListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading } = useAppSelector((state) => state.workOrders);
  const {
    query,
    setQuery,
    items,
    allItems,
    initialLoading,
    searchLoading,
    removeResult,
    reloadAll,
  } = useDebouncedCollectionSearch<WorkOrder>('workOrders');
  const departments = useAppSelector((state) => state.departments.items);
  const [deleteTarget, setDeleteTarget] = useState<WorkOrder | null>(null);
  const [stateFilter, setStateFilter] = useState<string>('all');

  const workOrderBulkConfig = useMemo(() => createWorkOrderBulkConfig(), []);

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  const stateCounts = useMemo(() => {
    const c: Record<string, number> = {};
    items.forEach((w) => {
      const k = w.state || 'no_state';
      c[k] = (c[k] || 0) + 1;
    });
    return c;
  }, [items]);

  const filteredByState = useMemo(() => {
    if (stateFilter === 'all') return items;
    return items.filter((w) => (w.state || 'no_state') === stateFilter);
  }, [items, stateFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteWorkOrder(deleteTarget.id));
    if (deleteWorkOrder.fulfilled.match(result)) {
      toast.success('Work order deleted');
      removeResult(deleteTarget.id);
      setDeleteTarget(null);
    } else toast.error(result.payload as string);
  };

  const isExpired = (validTo?: string) => {
    if (!validTo) return false;
    return new Date(validTo) < new Date();
  };

  const getDeptName = (deptId?: string) =>
    departments.find((d) => d.id === deptId)?.name ?? '-';

  const columns: Column<WorkOrder>[] = [
    { key: 'workOrderNumber', header: 'WO Number' },
    {
      key: 'jobDesc',
      header: 'Job Description',
      render: (w) => w.jobDesc || '-',
      hideOnMobile: true,
    },
    {
      key: 'dept',
      header: 'Department',
      render: (w) => getDeptName(w.dept),
      hideOnMobile: true,
    },
    {
      key: 'state',
      header: 'State',
      render: (w) => getStateDisplayName(w.state || ''),
      hideOnMobile: true,
    },
    {
      key: 'validFrom',
      header: 'Valid From',
      render: (w) => w.validFrom || '-',
      hideOnMobile: true,
    },
    {
      key: 'validTo',
      header: 'Valid To',
      render: (w) => w.validTo || '-',
      hideOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (w) => (
        <Badge variant={isExpired(w.validTo) ? 'secondary' : 'default'}>
          {isExpired(w.validTo) ? 'Expired' : 'Active'}
        </Badge>
      ),
    },
  ];

  if (initialLoading && allItems.length === 0) return <LoadingState />;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Work Orders'
        description={
          query.trim()
            ? `${filteredByState.length} match${filteredByState.length !== 1 ? 'es' : ''}${stateFilter !== 'all' ? ` in ${getStateDisplayName(stateFilter)}` : ''}`
            : `${allItems.length} work order${allItems.length !== 1 ? 's' : ''}`
        }
        action={
          <div className='flex gap-2'>
            <ExportExcelButton
              config={workOrderExportConfig}
              items={filteredByState}
              context={{ departments }}
            />
            <BulkUploadDialog
              config={workOrderBulkConfig}
              context={{ departments }}
              onSuccess={() => { void reloadAll(); }}
            />
            <Button onClick={() => navigate('/work-orders/new')}>
              <Plus className='h-4 w-4' /> Add Work Order
            </Button>
          </div>
        }
      />

      {items.length > 0 && (
        <div className='flex items-center gap-2'>
          <Label className='text-sm text-muted-foreground'>
            Filter by state
          </Label>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className='w-[260px]'>
              <SelectValue placeholder='All states' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All states ({items.length})</SelectItem>
              {Object.entries(stateCounts)
                .filter(([k]) => k !== 'all')
                .sort(([a], [b]) =>
                  getStateDisplayName(a).localeCompare(getStateDisplayName(b)),
                )
                .map(([key, count]) => (
                  <SelectItem key={key} value={key}>
                    {getStateDisplayName(key)} ({count})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {allItems.length === 0 ? (
        <EmptyState
          title='No work orders'
          description='Create your first work order.'
          action={
            <Button onClick={() => navigate('/work-orders/new')}>
              <Plus className='h-4 w-4' /> Add Work Order
            </Button>
          }
        />
      ) : (
      <DataTable
        data={filteredByState}
        columns={columns}
        searchPlaceholder='Search work orders...'
        searchValue={query}
        onSearchChange={setQuery}
        searchLoading={searchLoading}
        actions={(item) => (
          <>
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/work-orders/${item.id}/edit`);
              }}
            >
              <Pencil className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(item);
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
