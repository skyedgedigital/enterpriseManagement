import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  deleteTool,
  fetchTools,
} from '@/store/slices/fleet-manager/toolStoreManagementSlice';
import type { Tool } from '@/types';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { BulkUploadDialog } from '@/components/shared/BulkUploadDialog';
import { ExportExcelButton } from '@/components/shared/ExportExcelButton';
import { toolBulkConfig } from '@/lib/excel/bulkUpload/fleetConfigs';
import { toolExportConfig } from '@/lib/excel/bulkUpload/fleetExportConfigs';

export function ToolListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { tools, loading } = useAppSelector((state) => state.tools);
  const [deleteTarget, setDeleteTarget] = useState<Tool | null>(null);

  useEffect(() => {
    dispatch(fetchTools());
  }, [dispatch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteTool(deleteTarget.id));
    if (deleteTool.fulfilled.match(result)) {
      toast.success('Tool deleted');
      setDeleteTarget(null);
    } else {
      toast.error(result.payload as string);
    }
  };

  const columns: Column<Tool>[] = [
    { key: 'toolName', header: 'Tool Name' },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (tool) => <span>{tool.quantity}</span>,
    },
    {
      key: 'price',
      header: 'Price (₹)',
      render: (tool) => <span>₹{tool.price.toLocaleString('en-IN')}</span>,
    },
  ];

  if (loading && tools.length === 0) return <LoadingState />;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Tools'
        description='Manage tools inventory'
        action={
          <div className="flex gap-2">
            <ExportExcelButton config={toolExportConfig} items={tools} />
            <BulkUploadDialog
              config={toolBulkConfig}
              onSuccess={() => dispatch(fetchTools())}
            />
            <Button
              onClick={() =>
                navigate('/fleet-manager/store-management/tools/new')
              }
            >
              <Plus className='h-4 w-4' />
              Add Tool
            </Button>
          </div>
        }
      />

      {tools.length === 0 ? (
        <EmptyState
          title='No Tools'
          description='Add your first tool to get started.'
          action={
            <Button
              onClick={() =>
                navigate('/fleet-manager/store-management/tools/new')
              }
            >
              <Plus className='h-4 w-4' />
              Add Tool
            </Button>
          }
        />
      ) : (
        <DataTable
          data={tools}
          columns={columns}
          searchKey='toolName'
          searchPlaceholder='Search tools...'
          actions={(tool) => (
            <>
              <Button
                variant='ghost'
                size='icon-sm'
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(
                    `/fleet-manager/store-management/tools/${tool.id}/edit`,
                  );
                }}
              >
                <Pencil className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon-sm'
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(tool);
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
