import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useDebouncedCollectionSearch } from '@/hooks/useDebouncedCollectionSearch';
import { deleteAdminDepartment } from '@/store/slices/admin/adminDepartmentSlice';
import type { AdminDepartment } from '@/types/admin';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { BulkUploadDialog } from '@/components/shared/BulkUploadDialog';
import { ExportExcelButton } from '@/components/shared/ExportExcelButton';
import {
  adminDepartmentBulkConfig,
  adminDepartmentExportConfig,
} from '@/lib/excel/bulkUpload/adminConfigs';

export function AdminDepartmentPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.adminDepartments);
  const {
    query,
    setQuery,
    items,
    allItems,
    initialLoading,
    searchLoading,
    removeResult,
    reloadAll,
  } = useDebouncedCollectionSearch<AdminDepartment>('adminDepartments');
  const [deleteTarget, setDeleteTarget] = useState<AdminDepartment | null>(
    null,
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteAdminDepartment(deleteTarget.id));
    if (deleteAdminDepartment.fulfilled.match(result)) {
      toast.success('Department deleted');
      removeResult(deleteTarget.id);
      setDeleteTarget(null);
    } else {
      toast.error(result.payload as string);
    }
  };

  const columns: Column<AdminDepartment>[] = [
    { key: 'name', header: 'Department Name' },
  ];

  if (initialLoading && allItems.length === 0) return <LoadingState />;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Departments'
        description={
          query.trim()
            ? `${items.length} match${items.length !== 1 ? 'es' : ''}`
            : `${allItems.length} department${allItems.length !== 1 ? 's' : ''} total`
        }
        action={
          <div className='flex gap-2'>
            <ExportExcelButton
              config={adminDepartmentExportConfig}
              items={items}
            />
            <BulkUploadDialog
              config={adminDepartmentBulkConfig}
              onSuccess={() => { void reloadAll(); }}
            />
            <Button onClick={() => navigate('/admin/departments/new')}>
              <Plus className='h-4 w-4' />
              Add Department
            </Button>
          </div>
        }
      />

      {allItems.length === 0 ? (
        <EmptyState
          title='No departments'
          description='Create your first department to get started.'
          action={
            <Button onClick={() => navigate('/admin/departments/new')}>
              <Plus className='h-4 w-4' />
              Add Department
            </Button>
          }
        />
      ) : (
      <DataTable
        data={items}
        columns={columns}
        searchPlaceholder='Search departments...'
        searchValue={query}
        onSearchChange={setQuery}
        searchLoading={searchLoading}
        actions={(dept) => (
          <>
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/admin/departments/${dept.id}/edit`);
              }}
            >
              <Pencil className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(dept);
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
