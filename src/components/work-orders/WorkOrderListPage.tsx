import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  fetchWorkOrders,
  deleteWorkOrder,
} from '@/store/slices/workOrderSlice';
import { fetchDepartments } from '@/store/slices/departmentSlice';
import type { WorkOrder } from '@/types';
import { INDIAN_STATES_AND_UTS } from '@/lib/constants';
import { toSanitizedKey, getStateDisplayName } from '@/lib/sanitize';

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
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { BulkUploadDialog } from '@/components/shared/BulkUploadDialog';
import { ExportExcelButton } from '@/components/shared/ExportExcelButton';
import { createWorkOrderBulkConfig } from '@/lib/excel/bulkUpload/masterDataConfigs';
import { workOrderExportConfig } from '@/lib/excel/bulkUpload/masterDataExportConfigs';

export function WorkOrderListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, loading } = useAppSelector((state) => state.workOrders);
  console.log('work order items', items);
  const departments = useAppSelector((state) => state.departments.items);
  const [deleteTarget, setDeleteTarget] = useState<WorkOrder | null>(null);
  const [stateFilter, setStateFilter] = useState<string>('all');

  const workOrderBulkConfig = useMemo(() => createWorkOrderBulkConfig(), []);

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchWorkOrders());
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

  const groupedByState = useMemo(() => {
    const groups: Record<string, WorkOrder[]> = {};
    for (const w of filteredByState) {
      const key = w.state || 'no_state';
      if (!groups[key]) groups[key] = [];
      groups[key].push(w);
    }
    const stateOrder = INDIAN_STATES_AND_UTS.map(toSanitizedKey);
    const ordered = stateOrder
      .filter((s) => groups[s]?.length)
      .concat('no_state' in groups ? ['no_state'] : []);
    return ordered.map((state) => ({ state, rows: groups[state] || [] }));
  }, [filteredByState]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteWorkOrder(deleteTarget.id));
    if (deleteWorkOrder.fulfilled.match(result)) {
      toast.success('Work order deleted');
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

  if (loading && items.length === 0) return <LoadingState />;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Work Orders'
        description={`${filteredByState.length} work order${filteredByState.length !== 1 ? 's' : ''}${stateFilter !== 'all' ? ` in ${getStateDisplayName(stateFilter)}` : ''}`}
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
              onSuccess={() => dispatch(fetchWorkOrders())}
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

      {items.length === 0 ? (
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
        <div className='space-y-6'>
          {groupedByState.map(({ state, rows }) => (
            <div key={state}>
              <h3 className='text-sm font-medium text-muted-foreground mb-2'>
                {getStateDisplayName(state)}
              </h3>
              <DataTable
                data={rows}
                columns={columns}
                searchKey='workOrderNumber'
                searchPlaceholder='Search work orders...'
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
            </div>
          ))}
        </div>
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
