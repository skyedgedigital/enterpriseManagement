import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchSites, deleteSite } from "@/store/slices/siteSlice";
import type { Site } from "@/types";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { BulkUploadDialog } from "@/components/shared/BulkUploadDialog";
import { ExportExcelButton } from "@/components/shared/ExportExcelButton";
import { siteBulkConfig } from "@/lib/excel/bulkUpload/masterDataConfigs";
import { siteExportConfig } from "@/lib/excel/bulkUpload/masterDataExportConfigs";

export function SitePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.sites);
  const [deleteTarget, setDeleteTarget] = useState<Site | null>(null);

  useEffect(() => { dispatch(fetchSites()); }, [dispatch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteSite(deleteTarget.id));
    if (deleteSite.fulfilled.match(result)) { toast.success("Site deleted"); setDeleteTarget(null); }
    else toast.error(result.payload as string);
  };

  const columns: Column<Site>[] = [{ key: "name", header: "Site Name" }];

  if (loading && items.length === 0) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader title="Sites" description="Manage work locations" action={
        <div className="flex gap-2">
          <ExportExcelButton config={siteExportConfig} items={items} />
          <BulkUploadDialog config={siteBulkConfig} onSuccess={() => dispatch(fetchSites())} />
          <Button onClick={() => navigate("/sites/new")}><Plus className="h-4 w-4" /> Add Site</Button>
        </div>
      } />

      {items.length === 0 ? (
        <EmptyState title="No sites" description="Add your first site to get started." action={<Button onClick={() => navigate("/sites/new")}><Plus className="h-4 w-4" /> Add Site</Button>} />
      ) : (
        <DataTable data={items} columns={columns} searchKey="name" searchPlaceholder="Search sites..." actions={(item) => (
          <>
            <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); navigate(`/sites/${item.id}/edit`); }}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </>
        )} />
      )}

      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={loading} />
    </div>
  );
}
