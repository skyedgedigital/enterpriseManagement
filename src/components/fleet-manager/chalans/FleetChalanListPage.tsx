import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { fetchFleetWorkOrders } from '@/store/slices/fleet-manager/workOrderSlice';
import {
  fetchFleetChalans,
  deleteFleetChalan,
  updateFleetChalan,
} from '@/store/slices/fleet-manager/chalanSlice';
import { fetchEngineers } from '@/store/slices/admin/adminEngineerSlice';
import type { Chalan } from '@/types';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/PageHeader';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';

import { FleetChalanCard } from '@/components/fleet-manager/chalans/FleetChalanCard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchAdminDepartments } from '@/store/slices/admin/adminDepartmentSlice';

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export function FleetChalanListPage() {
  const dispatch = useAppDispatch();
  const { chalans, loading } = useAppSelector((s) => s.fleetChalans);
  const { engineers } = useAppSelector((s) => s.engineers);
  const navigate = useNavigate();
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filterWorkOrderId, setFilterWorkOrderId] = useState('');
  const [filterEngineerId, setFilterEngineerId] = useState('');
  const [dialogSelectedIds, setDialogSelectedIds] = useState<Set<string>>(
    new Set(),
  );

  const { items: departments } = useAppSelector((s) => s.adminDepartments);
  console.log('departments', departments);
  const fleetWOs = useAppSelector((s) => s.fleetWorkOrders.items);
  const [deleteTarget, setDeleteTarget] = useState<Chalan | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    void dispatch(fetchFleetChalans());
    void dispatch(fetchAdminDepartments());
    void dispatch(fetchFleetWorkOrders());
    void dispatch(fetchEngineers());
  }, [dispatch]);

  const deptName = (id: string) =>
    departments.find((d) => d.id === id)?.name ?? id;

  const woLabel = (id: string) => {
    const wo = fleetWOs.find((w) => w.id === id);
    return wo ? `${wo.workOrderNumber}` : id;
  };

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return chalans;
    return chalans.filter((c) => {
      const num = c.chalanNumber ?? '';
      const loc = c.location ?? '';
      const desc = c.workDescription ?? '';
      const dn = deptName(c.departmentId);
      return (
        normalize(num).includes(q) ||
        normalize(c.workOrderId).includes(q) ||
        normalize(loc).includes(q) ||
        normalize(desc).includes(q) ||
        normalize(dn).includes(q) ||
        normalize(c.id).includes(q)
      );
    });
  }, [chalans, query, departments]);

  const filteredByDialog = useMemo(() => {
    return chalans.filter((c) => {
      const workOrderMatch =
        !filterWorkOrderId ||
        filterWorkOrderId === 'any' ||
        c.workOrderId === filterWorkOrderId;
      const engineerMatch =
        !filterEngineerId ||
        filterEngineerId === 'any' ||
        c.engineerId === filterEngineerId;
      return workOrderMatch && engineerMatch;
    });
  }, [chalans, filterEngineerId, filterWorkOrderId]);

  const toggleDialogSelect = (id: string) => {
    setDialogSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDialogMerge = () => {
    const selectedIds = Array.from(dialogSelectedIds);
    if (!selectedIds.length) {
      toast.error('Select at least one chalan to merge');
      return;
    }
    handleCreateInvoice(selectedIds);
    setFilterDialogOpen(false);
    setDialogSelectedIds(new Set());
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteFleetChalan(deleteTarget.id));
    if (deleteFleetChalan.fulfilled.match(result)) {
      toast.success('Chalan deleted');
      setDeleteTarget(null);
    } else toast.error(result.payload as string);
  };

  const handleCreateInvoice = (chalanIds: string[]) => {
    const selected = chalans.filter((c) => chalanIds.includes(c.id));
    if (!selected.length) return;

    const workOrderIds = new Set(selected.map((c) => c.workOrderId));
    if (workOrderIds.size > 1) {
      toast.error('All selected chalans must belong to the same work order');
      return;
    }

    const engineerIds = new Set(selected.map((c) => c.engineerId));
    if (engineerIds.size > 1) {
      toast.error('All selected chalans must belong to the same engineer');
      return;
    }

    const deptId = selected[0]?.departmentId ?? '';
    const departmentName = deptName(deptId);
    const ids = chalanIds.join(',');
    navigate(
      `/fleet-manager/invoices/create?chalans=${ids}&dept=${encodeURIComponent(departmentName)}&deptId=${deptId}`,
    );
  };
  if (loading && chalans.length === 0) {
    return <LoadingState />;
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Fleet chalans'
        description={`${chalans.length} chalan${chalans.length !== 1 ? 's' : ''} · card view`}
        action={
          <div className='flex flex-wrap gap-2'>
            <Button onClick={() => setFilterDialogOpen(true)}>
              <FileText className='mr-2 h-4 w-4' />
              Filter & Merge Chalans
            </Button>
          </div>
        }
      />

      {chalans.length === 0 ? (
        <EmptyState
          title='No chalans yet'
          description='Drivers create chalans from the driver app. They will appear here once submitted.'
        />
      ) : (
        <>
          <div className='relative max-w-md'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              className='pl-9'
              placeholder='Search by number, work order, location, department…'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              No chalans match “{query}”.
            </p>
          ) : (
            <ul className='flex flex-col gap-8'>
              {filtered.map((c) => (
                <li key={c.id}>
                  <FleetChalanCard
                    chalan={c}
                    departmentName={deptName(c.departmentId)}
                    workOrderLabel={woLabel(c.workOrderId)}
                    onDelete={() => setDeleteTarget(c)}
                    onUpdate={async (patch) => {
                      const result = await dispatch(
                        updateFleetChalan({ id: c.id, patch }),
                      );
                      if (updateFleetChalan.fulfilled.match(result)) {
                        toast.success('Chalan updated');
                      } else {
                        toast.error(result.payload as string);
                      }
                    }}
                    onCreateInvoice={() => handleCreateInvoice([c.id])}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {filterDialogOpen ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border bg-background p-6 shadow-2xl'>
            <div className='flex flex-col gap-2 pb-4 sm:flex-row sm:items-end sm:justify-between'>
              <div>
                <h2 className='text-xl font-semibold'>
                  Filter chalans for merge
                </h2>
                <p className='text-sm text-muted-foreground'>
                  Choose a work order and/or engineer, then select rows to merge
                  into an invoice.
                </p>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setFilterDialogOpen(false)}
              >
                Close
              </Button>
            </div>

            <div className='space-y-4 px-2 pb-4'>
              <div className='grid gap-4 md:grid-cols-2'>
                <div>
                  <Label htmlFor='filter-workorder'>Work order</Label>
                  <Select
                    value={filterWorkOrderId}
                    onValueChange={(value) => setFilterWorkOrderId(value)}
                  >
                    <SelectTrigger id='filter-workorder' className='w-full'>
                      <SelectValue placeholder='Any work order' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='any'>Any work order</SelectItem>
                      {fleetWOs.map((wo) => (
                        <SelectItem key={wo.id} value={wo.id}>
                          {wo.workOrderNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor='filter-engineer'>Engineer</Label>
                  <Select
                    value={filterEngineerId}
                    onValueChange={(value) => setFilterEngineerId(value)}
                  >
                    <SelectTrigger id='filter-engineer' className='w-full'>
                      <SelectValue placeholder='Any engineer' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='any'>Any engineer</SelectItem>
                      {engineers.map((engineer) => (
                        <SelectItem key={engineer.id} value={engineer.id}>
                          {engineer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='rounded-lg border bg-background p-4'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <div>
                    <p className='text-sm text-muted-foreground'>
                      Matching chalans
                    </p>
                    <p className='font-medium'>
                      {filteredByDialog.length} rows
                    </p>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      setFilterWorkOrderId('');
                      setFilterEngineerId('');
                      setDialogSelectedIds(new Set());
                    }}
                  >
                    Clear filters
                  </Button>
                </div>

                {filteredByDialog.length === 0 ? (
                  <p className='mt-4 text-sm text-muted-foreground'>
                    No chalans match the selected filters.
                  </p>
                ) : (
                  <div className='mt-4 overflow-x-auto'>
                    <table className='w-full min-w-175 divide-y'>
                      <thead>
                        <tr className='text-left text-sm text-muted-foreground'>
                          <th className='px-3 py-2'>Select</th>
                          <th className='px-3 py-2'>Chalan</th>
                          <th className='px-3 py-2'>Work order</th>
                          <th className='px-3 py-2'>Engineer</th>
                          <th className='px-3 py-2'>Location</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y'>
                        {filteredByDialog.map((c) => {
                          const selected = dialogSelectedIds.has(c.id);
                          const engineer = engineers.find(
                            (e) => e.id === c.engineerId,
                          );
                          return (
                            <tr key={c.id} className='hover:bg-muted/50'>
                              <td className='px-3 py-2'>
                                <Checkbox
                                  checked={selected}
                                  onCheckedChange={() =>
                                    toggleDialogSelect(c.id)
                                  }
                                />
                              </td>
                              <td className='px-3 py-2 text-sm'>
                                {c.chalanNumber ?? c.id.slice(0, 8)}
                              </td>
                              <td className='px-3 py-2 text-sm'>
                                {woLabel(c.workOrderId)}
                              </td>
                              <td className='px-3 py-2 text-sm'>
                                {engineer?.name ?? c.engineerId}
                              </td>
                              <td className='px-3 py-2 text-sm'>
                                {c.location ?? '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className='flex flex-col gap-2 sm:flex-row sm:justify-end'>
              <Button
                variant='outline'
                onClick={() => setFilterDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleDialogMerge}>
                Merge selected chalans
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={loading}
        title='Delete this chalan?'
        description='This removes the chalan record from the database. Storage files are not removed automatically.'
      />
    </div>
  );
}
