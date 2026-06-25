import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  deleteAdminDepartment,
  fetchAdminDepartments,
} from '@/store/slices/admin/adminDepartmentSlice';
import type { AdminDepartment } from '@/types/admin';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { BulkUploadDialog } from '@/components/shared/BulkUploadDialog';
import { ExportExcelButton } from '@/components/shared/ExportExcelButton';
import {
  adminDepartmentBulkConfig,
  adminDepartmentExportConfig,
} from '@/lib/excel/bulkUpload/adminConfigs';

export function AdminDepartmentPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.adminDepartments);
  const [deleteTarget, setDeleteTarget] = useState<AdminDepartment | null>(
    null,
  );

  useEffect(() => {
    dispatch(fetchAdminDepartments());
  }, [dispatch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteAdminDepartment(deleteTarget.id));
    if (deleteAdminDepartment.fulfilled.match(result)) {
      toast.success('Department deleted');
      setDeleteTarget(null);
    } else {
      toast.error(result.payload as string);
    }
  };

  const columns: Column<AdminDepartment>[] = [
    { key: 'name', header: 'Department Name' },
  ];

  if (loading && items.length === 0) return <LoadingState />;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Departments'
        description='Manage organization departments'
        action={
          <div className='flex gap-2'>
            <ExportExcelButton
              config={adminDepartmentExportConfig}
              items={items}
            />
            <BulkUploadDialog
              config={adminDepartmentBulkConfig}
              onSuccess={() => dispatch(fetchAdminDepartments())}
            />
            <Button onClick={() => navigate('/admin/departments/new')}>
              <Plus className='h-4 w-4' />
              Add Department
            </Button>
          </div>
        }
      />

      {items.length === 0 ? (
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
          searchKey='name'
          searchPlaceholder='Search departments...'
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

      {/* Delete Confirmation */}
      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}
