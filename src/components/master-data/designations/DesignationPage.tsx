import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchDesignations, deleteDesignation } from "@/store/slices/designationSlice";
import type { Designation } from "@/types";
import { formatMoney2 } from "@/lib/moneyRounding";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { BulkUploadDialog } from "@/components/shared/BulkUploadDialog";
import { ExportExcelButton } from "@/components/shared/ExportExcelButton";
import { designationBulkConfig } from "@/lib/excel/bulkUpload/masterDataConfigs";
import { designationExportConfig } from "@/lib/excel/bulkUpload/masterDataExportConfigs";

export function DesignationPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.designations);
  const [deleteTarget, setDeleteTarget] = useState<Designation | null>(null);

  useEffect(() => { dispatch(fetchDesignations()); }, [dispatch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteDesignation(deleteTarget.id));
    if (deleteDesignation.fulfilled.match(result)) { toast.success("Designation deleted"); setDeleteTarget(null); }
    else toast.error(result.payload as string);
  };

  const columns: Column<Designation>[] = [
    { key: "designation", header: "Designation" },
    { key: "basic", header: "Basic", render: (d) => formatMoney2(Number(d.basic || 0)) },
    { key: "da", header: "DA", render: (d) => formatMoney2(Number(d.da || 0)) },
    { key: "payRate", header: "Pay Rate", render: (d) => formatMoney2(Number(d.payRate || 0)) },
  ];

  if (loading && items.length === 0) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Designations"
        description="Manage job titles and pay structures"
        action={
          <div className="flex gap-2">
            <ExportExcelButton config={designationExportConfig} items={items} />
            <BulkUploadDialog
              config={designationBulkConfig}
              onSuccess={() => dispatch(fetchDesignations())}
            />
            <Button onClick={() => navigate("/designations/new")}><Plus className="h-4 w-4" /> Add Designation</Button>
          </div>
        }
      />

      {items.length === 0 ? (
        <EmptyState title="No designations" description="Create your first designation to get started." action={<Button onClick={() => navigate("/designations/new")}><Plus className="h-4 w-4" /> Add Designation</Button>} />
      ) : (
        <DataTable
          data={items}
          columns={columns}
          searchKey="designation"
          searchPlaceholder="Search designations..."
          actions={(item) => (
            <>
              <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); navigate(`/designations/${item.id}/edit`); }}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </>
          )}
        />
      )}

      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={loading} />
    </div>
  );
}
