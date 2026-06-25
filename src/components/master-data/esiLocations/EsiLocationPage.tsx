import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchEsiLocations, deleteEsiLocation } from "@/store/slices/esiLocationSlice";
import type { EsiLocation } from "@/types";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { BulkUploadDialog } from "@/components/shared/BulkUploadDialog";
import { ExportExcelButton } from "@/components/shared/ExportExcelButton";
import { esiLocationBulkConfig } from "@/lib/excel/bulkUpload/masterDataConfigs";
import { esiLocationExportConfig } from "@/lib/excel/bulkUpload/masterDataExportConfigs";

export function EsiLocationPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.esiLocations);
  const [deleteTarget, setDeleteTarget] = useState<EsiLocation | null>(null);

  useEffect(() => { dispatch(fetchEsiLocations()); }, [dispatch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteEsiLocation(deleteTarget.id));
    if (deleteEsiLocation.fulfilled.match(result)) { toast.success("ESI Location deleted"); setDeleteTarget(null); }
    else toast.error(result.payload as string);
  };

  const columns: Column<EsiLocation>[] = [
    { key: "name", header: "Name" },
    { key: "esiNo", header: "ESI No" },
    { key: "branch", header: "Branch" },
    { key: "address", header: "Address" },
  ];

  if (loading && items.length === 0) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader title="ESI Locations" description="Manage ESI office locations" action={
        <div className="flex gap-2">
          <ExportExcelButton config={esiLocationExportConfig} items={items} />
          <BulkUploadDialog config={esiLocationBulkConfig} onSuccess={() => dispatch(fetchEsiLocations())} />
          <Button onClick={() => navigate("/esi-locations/new")}><Plus className="h-4 w-4" /> Add ESI Location</Button>
        </div>
      } />

      {items.length === 0 ? (
        <EmptyState title="No ESI locations" description="Add your first ESI location to get started." action={<Button onClick={() => navigate("/esi-locations/new")}><Plus className="h-4 w-4" /> Add ESI Location</Button>} />
      ) : (
        <DataTable data={items} columns={columns} searchKey="name" searchPlaceholder="Search ESI locations..." actions={(item) => (
          <>
            <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); navigate(`/esi-locations/${item.id}/edit`); }}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </>
        )} />
      )}

      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={loading} />
    </div>
  );
}
