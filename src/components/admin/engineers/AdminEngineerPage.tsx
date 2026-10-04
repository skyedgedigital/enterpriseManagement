import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useDebouncedCollectionSearch } from '@/hooks/useDebouncedCollectionSearch';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { BulkUploadDialog } from '@/components/shared/BulkUploadDialog';
import { ExportExcelButton } from '@/components/shared/ExportExcelButton';
import {
  adminEngineerBulkConfig,
  adminEngineerExportConfig,
} from '@/lib/excel/bulkUpload/adminConfigs';
import { deleteEngineer } from '@/store/slices/admin/adminEngineerSlice';
import { fetchAdminDepartments } from '@/store/slices/admin/adminDepartmentSlice';
import type { Engineer } from '@/types';

export function AdminEngineersPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.engineers);
  const {
    query,
    setQuery,
    items,
    allItems,
    initialLoading,
    searchLoading,
    removeResult,
    reloadAll,
  } = useDebouncedCollectionSearch<Engineer>('engineers');
  const { items: departments } = useAppSelector(
    (state) => state.adminDepartments,
  );
  const [deleteTarget, setDeleteTarget] = useState<Engineer | null>(null);

  useEffect(() => {
    void dispatch(fetchAdminDepartments());
  }, [dispatch]);

  const departmentMap = Object.fromEntries(
    departments.map((d) => [d.id, d.name]),
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteEngineer(deleteTarget.id));
    if (deleteEngineer.fulfilled.match(result)) {
      toast.success('Engineer deleted');
      removeResult(deleteTarget.id);
      setDeleteTarget(null);
    } else {
      toast.error(result.payload as string);
    }
  };

  const columns: Column<Engineer>[] = [
    { key: 'name', header: 'Engineer Name' },
    {
      key: 'departmentId',
      header: 'Department',
      render: (eng) => departmentMap[eng.departmentId] ?? '—',
    },
  ];

  if (initialLoading && allItems.length === 0) return <LoadingState />;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Engineers'
        description={
          query.trim()
            ? `${items.length} match${items.length !== 1 ? 'es' : ''}`
            : `${allItems.length} engineer${allItems.length !== 1 ? 's' : ''} total`
        }
        action={
          <div className='flex gap-2'>
            <ExportExcelButton
              config={adminEngineerExportConfig}
              items={items}
              context={{ departments }}
            />
            <BulkUploadDialog
              config={adminEngineerBulkConfig}
              context={{ departments }}
              onSuccess={() => { void reloadAll(); }}
            />
            <Button onClick={() => navigate('/admin/engineers/new')}>
              <Plus className='h-4 w-4' />
              Add Engineer
            </Button>
          </div>
        }
      />
      {allItems.length === 0 ? (
        <EmptyState
          title='No engineers'
          description='Add your first engineer to get started.'
          action={
            <Button onClick={() => navigate('/admin/engineers/new')}>
              <Plus className='h-4 w-4' />
              Add Engineer
            </Button>
          }
        />
      ) : (
      <DataTable
        data={items}
        columns={columns}
        searchPlaceholder='Search engineers...'
        searchValue={query}
        onSearchChange={setQuery}
        searchLoading={searchLoading}
        actions={(eng) => (
          <>
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/admin/engineers/${eng.id}/edit`);
              }}
            >
              <Pencil className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(eng);
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
