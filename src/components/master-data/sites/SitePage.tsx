import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useDebouncedCollectionSearch } from "@/hooks/useDebouncedCollectionSearch";
import { deleteSite } from "@/store/slices/siteSlice";
import type { Site } from "@/types";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import { BulkUploadDialog } from "@/components/shared/BulkUploadDialog";
import { ExportExcelButton } from "@/components/shared/ExportExcelButton";
import { siteBulkConfig } from "@/lib/excel/bulkUpload/masterDataConfigs";
import { siteExportConfig } from "@/lib/excel/bulkUpload/masterDataExportConfigs";

export function SitePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.sites);
  const {
    query,
    setQuery,
    items,
    allItems,
    initialLoading,
    searchLoading,
    removeResult,
    reloadAll,
  } = useDebouncedCollectionSearch<Site>("sites");
  const [deleteTarget, setDeleteTarget] = useState<Site | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteSite(deleteTarget.id));
    if (deleteSite.fulfilled.match(result)) {
      toast.success("Site deleted");
      removeResult(deleteTarget.id);
      setDeleteTarget(null);
    }
    else toast.error(result.payload as string);
  };

  const columns: Column<Site>[] = [{ key: "name", header: "Site Name" }  ];

  if (initialLoading && allItems.length === 0) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader title="Sites" description={
        query.trim()
          ? `${items.length} match${items.length !== 1 ? "es" : ""}`
          : `${allItems.length} site${allItems.length !== 1 ? "s" : ""} total`
      } action={
        <div className="flex gap-2">
          <ExportExcelButton config={siteExportConfig} items={items} />
          <BulkUploadDialog
            config={siteBulkConfig}
            onSuccess={() => { void reloadAll(); }}
          />
          <Button onClick={() => navigate("/sites/new")}><Plus className="h-4 w-4" /> Add Site</Button>
        </div>
      } />

      {allItems.length === 0 ? (
        <EmptyState
          title="No sites"
          description="Add your first site to get started."
          action={
            <Button onClick={() => navigate("/sites/new")}>
              <Plus className="h-4 w-4" /> Add Site
            </Button>
          }
        />
      ) : (
      <DataTable
        data={items}
        columns={columns}
        searchPlaceholder="Search sites..."
        searchValue={query}
        onSearchChange={setQuery}
        searchLoading={searchLoading}
        actions={(item) => (
          <>
            <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); navigate(`/sites/${item.id}/edit`); }}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </>
        )}
      />
      )}

      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={loading} />
    </div>
  );
}
