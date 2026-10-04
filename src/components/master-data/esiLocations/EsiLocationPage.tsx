import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useDebouncedCollectionSearch } from "@/hooks/useDebouncedCollectionSearch";
import { deleteEsiLocation } from "@/store/slices/esiLocationSlice";
import type { EsiLocation } from "@/types";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import { BulkUploadDialog } from "@/components/shared/BulkUploadDialog";
import { ExportExcelButton } from "@/components/shared/ExportExcelButton";
import { esiLocationBulkConfig } from "@/lib/excel/bulkUpload/masterDataConfigs";
import { esiLocationExportConfig } from "@/lib/excel/bulkUpload/masterDataExportConfigs";

export function EsiLocationPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.esiLocations);
  const {
    query,
    setQuery,
    items,
    allItems,
    initialLoading,
    searchLoading,
    removeResult,
    reloadAll,
  } = useDebouncedCollectionSearch<EsiLocation>("esiLocations");
  const [deleteTarget, setDeleteTarget] = useState<EsiLocation | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteEsiLocation(deleteTarget.id));
    if (deleteEsiLocation.fulfilled.match(result)) {
      toast.success("ESI Location deleted");
      removeResult(deleteTarget.id);
      setDeleteTarget(null);
    }
    else toast.error(result.payload as string);
  };

  const columns: Column<EsiLocation>[] = [
    { key: "name", header: "Name" },
    { key: "esiNo", header: "ESI No" },
    { key: "branch", header: "Branch" },
    { key: "address", header: "Address" },
  ];

  if (initialLoading && allItems.length === 0) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader title="ESI Locations" description={
        query.trim()
          ? `${items.length} match${items.length !== 1 ? "es" : ""}`
          : `${allItems.length} ESI location${allItems.length !== 1 ? "s" : ""} total`
      } action={
        <div className="flex gap-2">
          <ExportExcelButton config={esiLocationExportConfig} items={items} />
          <BulkUploadDialog
            config={esiLocationBulkConfig}
            onSuccess={() => { void reloadAll(); }}
          />
          <Button onClick={() => navigate("/esi-locations/new")}><Plus className="h-4 w-4" /> Add ESI Location</Button>
        </div>
      } />

      {allItems.length === 0 ? (
        <EmptyState
          title="No ESI locations"
          description="Add your first ESI location to get started."
          action={
            <Button onClick={() => navigate("/esi-locations/new")}>
              <Plus className="h-4 w-4" /> Add ESI Location
            </Button>
          }
        />
      ) : (
      <DataTable
        data={items}
        columns={columns}
        searchPlaceholder="Search ESI locations..."
        searchValue={query}
        onSearchChange={setQuery}
        searchLoading={searchLoading}
        actions={(item) => (
          <>
            <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); navigate(`/esi-locations/${item.id}/edit`); }}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </>
        )}
      />
      )}

      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={loading} />
    </div>
  );
}
