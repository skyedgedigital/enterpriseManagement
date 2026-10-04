import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useDebouncedCollectionSearch } from "@/hooks/useDebouncedCollectionSearch";
import { deleteDepartment } from "@/store/slices/departmentSlice";
import type { Department } from "@/types";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { BulkUploadDialog } from "@/components/shared/BulkUploadDialog";
import { ExportExcelButton } from "@/components/shared/ExportExcelButton";
import { departmentBulkConfig } from "@/lib/excel/bulkUpload/masterDataConfigs";
import { departmentExportConfig } from "@/lib/excel/bulkUpload/masterDataExportConfigs";

export function DepartmentPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.departments);
  const {
    query,
    setQuery,
    items,
    allItems,
    initialLoading,
    searchLoading,
    removeResult,
    reloadAll,
  } = useDebouncedCollectionSearch<Department>("departments");
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteDepartment(deleteTarget.id));
    if (deleteDepartment.fulfilled.match(result)) {
      toast.success("Department deleted");
      removeResult(deleteTarget.id);
      setDeleteTarget(null);
    } else {
      toast.error(result.payload as string);
    }
  };

  const columns: Column<Department>[] = [
    { key: "name", header: "Department Name" },
  ];

  if (initialLoading && allItems.length === 0) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description={
          query.trim()
            ? `${items.length} match${items.length !== 1 ? "es" : ""}`
            : `${allItems.length} department${allItems.length !== 1 ? "s" : ""} total`
        }
        action={
          <div className="flex gap-2">
            <ExportExcelButton config={departmentExportConfig} items={items} />
            <BulkUploadDialog
              config={departmentBulkConfig}
              onSuccess={() => { void reloadAll(); }}
            />
            <Button onClick={() => navigate("/departments/new")}>
              <Plus className="h-4 w-4" />
              Add Department
            </Button>
          </div>
        }
      />

      {allItems.length === 0 ? (
        <EmptyState
          title="No departments"
          description="Create your first department to get started."
          action={
            <Button onClick={() => navigate("/departments/new")}>
              <Plus className="h-4 w-4" />
              Add Department
            </Button>
          }
        />
      ) : (
        <DataTable
          data={items}
          columns={columns}
          searchPlaceholder="Search departments..."
          searchValue={query}
          onSearchChange={setQuery}
          searchLoading={searchLoading}
          actions={(dept) => (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/departments/${dept.id}/edit`);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(dept);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
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
